import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { createIdentityUserModel, createMongoTestConnection } from "../integrations/mongodb/index.js";
import { createUserProfileGateway, type IdentityUserRecord } from "../features/identity/index.js";
import { createUserProfileQueryAdapter } from "../integrations/mongodb/identity/profile-query.adapter.js";

const PROFILE_COUNT = 10_000;
const TARGET_REQUESTS_PER_SECOND = 20;
const DURATION_SECONDS = 10 * 60;
const UPDATES_PER_USER = DURATION_SECONDS;
const CONCURRENCY = TARGET_REQUESTS_PER_SECOND;
const P95_BUDGET_MS = 300;
const BATCH_SIZE = 1_000;
const INDEX_NAME = "users_by_user_id";

const percentile = (values: readonly number[], fraction: number): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * fraction) - 1);
  const result = sorted[index];
  if (result === undefined) throw new Error("Cannot calculate a percentile without measurements.");
  return result;
};

const createIsolatedLocalUri = (source: string, databaseName: string): string => {
  const parsed = new URL(source);
  assert(
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1",
    "Refusing to seed a non-local MongoDB host. Use a disposable local MongoDB URI."
  );
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const waitUntil = async (targetTime: number): Promise<void> => {
  const delay = targetTime - performance.now();
  if (delay > 0) await new Promise<void>((resolve) => setTimeout(resolve, delay));
};

const run = async (): Promise<void> => {
  const sourceUri = process.env.IDENTITY_PROFILE_PERF_MONGODB_URI;
  assert(sourceUri, "Set IDENTITY_PROFILE_PERF_MONGODB_URI to a local MongoDB connection string.");

  const runId = randomUUID().replaceAll("-", "");
  const databaseName = `identity_profile_perf_${runId}`;
  const uri = createIsolatedLocalUri(sourceUri, databaseName);
  const connection = await createMongoTestConnection({ uri, databaseName });

  try {
    const users = createIdentityUserModel(connection);
    await users.createIndexes();
    for (let offset = 0; offset < PROFILE_COUNT; offset += BATCH_SIZE) {
      const batch = Array.from({ length: Math.min(BATCH_SIZE, PROFILE_COUNT - offset) }, (_, batchIndex): IdentityUserRecord => {
        const sequence = offset + batchIndex;
        return {
          userId: `profile-perf-user-${runId}-${String(sequence)}`,
          email: `profile-perf-${String(sequence)}@example.test`,
          name: `Performance Fixture ${String(sequence)}`,
          profileVersion: 0,
          provider: "google",
          subject: `profile-perf-subject-${runId}-${String(sequence)}`,
          status: "ACTIVE",
          closedAt: null
        };
      });
      await users.insertMany(batch, { ordered: true });
    }

    const count = await users.countDocuments({ userId: { $regex: `^profile-perf-user-${runId}-` } });
    assert.equal(count, PROFILE_COUNT, "Seeded Identity user count does not match the requested target volume.");

    const gateway = createUserProfileGateway({ queryPort: createUserProfileQueryAdapter(users) });
    const userIds = Array.from({ length: CONCURRENCY }, (_, index) => `profile-perf-user-${runId}-${String(index)}`);
    const samples: number[] = [];
    const startedAt = performance.now();
    const workers = userIds.map(async (userId, workerIndex) => {
      const principal = { userId, workspaceId: `profile-perf-workspace-${runId}` };
      for (let sequence = 0; sequence < UPDATES_PER_USER; sequence += 1) {
        const requestNumber = sequence * CONCURRENCY + workerIndex;
        await waitUntil(startedAt + requestNumber * (1_000 / TARGET_REQUESTS_PER_SECOND));
        const requestStartedAt = performance.now();
        const result = await gateway.updateUserProfile(
          userId,
          principal,
          `Performance ${String(requestNumber)}`,
          sequence
        );
        samples.push(performance.now() - requestStartedAt);
        assert.equal(result.kind, "updated", `Profile update ${String(requestNumber)} did not save.`);
      }
    });
    await Promise.all(workers);
    const elapsedMs = performance.now() - startedAt;
    const p95Ms = percentile(samples, 0.95);

    const explanation = await users.collection.find({
      userId: userIds[0],
      status: "ACTIVE",
      closedAt: null
    }).explain("executionStats");
    const queryPlanner = explanation.queryPlanner as unknown as Readonly<{ winningPlan: unknown }>;
    const winningPlan = JSON.stringify(queryPlanner.winningPlan);
    const indexServedQuery = winningPlan.includes(INDEX_NAME);
    const actualRequestsPerSecond = samples.length / (elapsedMs / 1_000);
    const result = indexServedQuery && p95Ms <= P95_BUDGET_MS && actualRequestsPerSecond >= TARGET_REQUESTS_PER_SECOND * 0.99
      ? "PASS"
      : "FAIL";

    console.log(JSON.stringify({
      task: "02.1.01-S4-T4",
      result,
      environment: "isolated local MongoDB",
      seededUsers: count,
      measuredUpdates: samples.length,
      targetRequestsPerSecond: TARGET_REQUESTS_PER_SECOND,
      actualRequestsPerSecond: Number(actualRequestsPerSecond.toFixed(2)),
      durationSeconds: Number((elapsedMs / 1_000).toFixed(2)),
      concurrency: CONCURRENCY,
      p95Ms: Number(p95Ms.toFixed(2)),
      p95BudgetMs: P95_BUDGET_MS,
      index: INDEX_NAME,
      indexServedQuery,
      database: databaseName
    }, null, 2));

    assert.equal(samples.length, TARGET_REQUESTS_PER_SECOND * DURATION_SECONDS, "Not every scheduled profile update was measured.");
    assert.ok(indexServedQuery, `MongoDB did not select ${INDEX_NAME}: ${winningPlan}`);
    assert.ok(p95Ms <= P95_BUDGET_MS, `Profile update p95 ${p95Ms.toFixed(2)}ms exceeded ${String(P95_BUDGET_MS)}ms.`);
    assert.ok(actualRequestsPerSecond >= TARGET_REQUESTS_PER_SECOND * 0.99, "Measured update rate fell below the 20 requests/second target.");
  } finally {
    await connection.dropDatabase();
    await connection.close();
  }
};

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
