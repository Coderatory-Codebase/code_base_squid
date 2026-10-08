import assert from "node:assert/strict";
import { systemClock } from "@workspace/kernel";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { createPrincipalResolver, createSessionCookieResolver, SESSION_COOKIE_NAME } from "../features/authentication/index.js";
import {
  createMongoTestConnection,
  createSessionModel,
  createSessionQueryAdapter,
  createWorkspaceMembershipQueryAdapter
} from "../integrations/mongodb/index.js";

const REQUESTS_PER_SECOND = Number(process.env.IDENTITY_PRINCIPAL_LOAD_REQUESTS_PER_SECOND ?? "500");
const DURATION_SECONDS = Number(process.env.IDENTITY_PRINCIPAL_LOAD_DURATION_SECONDS ?? "600");
const SESSION_COUNT = Number(process.env.IDENTITY_PRINCIPAL_LOAD_SESSIONS ?? "10000");
const LOAD_TEST_URI = process.env.IDENTITY_PRINCIPAL_LOAD_TEST_MONGODB_URI;

const percentile = (values: readonly number[], fraction: number): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const value = sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
  if (value === undefined) throw new Error("Cannot calculate a percentile without measurements.");
  return value;
};

void test("principal resolution sustains the 500 rps warm-cache session budget", {
  skip: !LOAD_TEST_URI && "Set IDENTITY_PRINCIPAL_LOAD_TEST_MONGODB_URI to an isolated MongoDB replica-set URI.",
  timeout: (DURATION_SECONDS + 300) * 1_000
}, async (context) => {
  assert.ok(LOAD_TEST_URI);
  assert.ok(Number.isSafeInteger(SESSION_COUNT) && SESSION_COUNT >= 100);
  const databaseName = `identity_principal_load_${randomUUID().replaceAll("-", "")}`;
  const connection = await createMongoTestConnection({ uri: LOAD_TEST_URI, databaseName });
  const database = connection.db;
  assert.ok(database);
  const sessionModel = createSessionModel(connection);
  await sessionModel.syncIndexes();
  const organizations = database.collection<{ _id: string; status: string }>("organizations");
  const workspaces = database.collection<{ _id: string; orgId: string; status: string }>("workspaces");
  const memberships = database.collection<{ workspaceId: string; userId: string; role: string; status: string; guest: boolean; version: number }>("memberships");
  await organizations.insertOne({ _id: "principal-load-org", status: "ACTIVE" });
  await workspaces.insertOne({ _id: "principal-load-workspace", orgId: "principal-load-org", status: "ACTIVE" });
  await memberships.createIndex({ userId: 1, status: 1 }, { name: "principal_load_memberships_by_user" });

  const sessions = Array.from({ length: SESSION_COUNT }, (_, index) => {
    const token = randomBytes(32).toString("base64url");
    const userId = `load-user-${String(index)}`;
    const now = systemClock.now();
    return {
      token,
      sessionId: `load-session-${String(index)}`,
      userId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      status: "ACTIVE" as const,
      lastUsedAt: new Date(now),
      expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1_000),
      device: "Staging-shaped load session"
    };
  });
  await sessionModel.insertMany(sessions.map(({ token: _token, ...session }) => session), { ordered: true });
  await memberships.insertMany(sessions.map(({ userId }) => ({
    workspaceId: "principal-load-workspace",
    userId,
    role: "member",
    status: "ACTIVE",
    guest: false,
    version: 0
  })), { ordered: true });

  const sessionPort = createSessionQueryAdapter(sessionModel);
  const sessionResolver = createSessionCookieResolver({ sessions: sessionPort });
  const principalResolver = createPrincipalResolver({
    resolveSession: sessionResolver,
    invalidateResolvedSession: sessionResolver.invalidateSession,
    memberships: createWorkspaceMembershipQueryAdapter(connection)
  });
  const cookies = sessions.map(({ token }) => `${SESSION_COOKIE_NAME}=${token}`);
  for (const cookie of cookies) {
    const principal = await principalResolver.resolve(cookie);
    assert.equal(principal.kind, "resolved", "Every active staged session must warm its principal cache.");
  }

  const revocationTargetCount = Math.floor(SESSION_COUNT * 0.05);
  const sampleDurations: number[] = [];
  const requestFailures: string[] = [];
  const revokedIndexes = new Set<number>();
  const startedAt = performance.now();
  let requestNumber = 0;
  let revokedCount = 0;

  try {
    for (let second = 0; second < DURATION_SECONDS; second += 1) {
      const deadline = startedAt + (second + 1) * 1_000;
      const desiredRevocations = Math.min(revocationTargetCount, Math.floor((second + 1) * revocationTargetCount / DURATION_SECONDS));
      while (revokedCount < desiredRevocations) {
        const index = revokedCount;
        const session = sessions[index];
        assert.ok(session);
        const revoked = await sessionPort.revokeActiveSession(session.sessionId, session.userId, new Date(systemClock.now()));
        if (!revoked) requestFailures.push(`Unable to revoke staged session ${session.sessionId}.`);
        principalResolver.invalidateSession(session.sessionId);
        revokedIndexes.add(index);
        revokedCount += 1;
      }

      const requests = Array.from({ length: REQUESTS_PER_SECOND }, (_, requestOffset) => {
        const index = requestNumber + requestOffset;
        const sessionIndex = index % SESSION_COUNT;
        const cookie = cookies[sessionIndex];
        assert.ok(cookie);
        const requestStartedAt = performance.now();
        return principalResolver.resolve(cookie).then((resolution) => {
          sampleDurations.push(performance.now() - requestStartedAt);
          const shouldResolve = !revokedIndexes.has(sessionIndex);
          if (shouldResolve !== (resolution.kind === "resolved")) requestFailures.push(`Unexpected principal result for session ${String(sessionIndex)}.`);
        }).catch((error: unknown) => {
          requestFailures.push(error instanceof Error ? error.message : String(error));
        });
      });
      await Promise.all(requests);
      requestNumber += REQUESTS_PER_SECOND;
      const remaining = deadline - performance.now();
      if (remaining > 0) await new Promise<void>((resolve) => setTimeout(resolve, remaining));
    }

    const p95Ms = percentile(sampleDurations, 0.95);
    const result = p95Ms < 20 && requestFailures.length === 0 && revokedCount === revocationTargetCount;
    console.log(JSON.stringify({
      testCase: "TC-02.1.01-S3-4",
      result: result ? "PASS" : "FAIL",
      acceptanceRun: REQUESTS_PER_SECOND === 500 && DURATION_SECONDS === 600 && SESSION_COUNT === 10_000,
      requestsPerSecond: REQUESTS_PER_SECOND,
      durationSeconds: DURATION_SECONDS,
      sessions: SESSION_COUNT,
      revokedSessions: revokedCount,
      measuredRequests: sampleDurations.length,
      p95Ms: Number(p95Ms.toFixed(2)),
      requestFailures: requestFailures.slice(0, 10)
    }, null, 2));
    assert.equal(REQUESTS_PER_SECOND, 500, "AC-4 requires 500 principal resolutions per second.");
    assert.equal(DURATION_SECONDS, 600, "AC-4 requires a 10-minute run.");
    assert.equal(revokedCount, revocationTargetCount, "AC-4 requires revoking 5% of staged sessions.");
    assert.equal(requestFailures.length, 0, `Principal resolution failures: ${requestFailures.slice(0, 5).join(" | ")}`);
    assert.equal(sampleDurations.length, REQUESTS_PER_SECOND * DURATION_SECONDS);
    assert.ok(p95Ms < 20, `Principal resolution p95 was ${p95Ms.toFixed(2)}ms; budget is 20ms.`);
    await context.test("revoked sessions are refused immediately after cache invalidation", async () => {
      for (const index of revokedIndexes) {
        const cookie = cookies[index];
        assert.ok(cookie);
        assert.deepEqual(await principalResolver.resolve(cookie), { kind: "unauthenticated" });
      }
    });
  } finally {
    await connection.dropDatabase();
    await connection.close();
  }
});
