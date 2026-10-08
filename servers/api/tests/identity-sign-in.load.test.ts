import assert from "node:assert/strict";
import { systemClock } from "@workspace/kernel";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import express from "express";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { createIdentityUserBootstrap } from "../features/identity/index.js";
import type { OidcProviderPort } from "../features/authentication/index.js";
import {
  createOidcFlowCookie,
  createOidcSignInRoutes,
  OIDC_FLOW_COOKIE_NAME
} from "../features/authentication/index.js";
import { createWorkspaceBootstrap } from "../features/workspace/index.js";
import {
  createIdentityUserModel,
  createSessionModel,
  createMongoSignInTransactionRunner,
  createMongoTestConnection
} from "../integrations/mongodb/index.js";

const REQUESTS_PER_SECOND = Number(process.env.IDENTITY_LOAD_REQUESTS_PER_SECOND ?? "10");
const DURATION_SECONDS = Number(process.env.IDENTITY_LOAD_DURATION_SECONDS ?? String(10 * 60));
const REQUEST_COUNT = REQUESTS_PER_SECOND * DURATION_SECONDS;
const CALLBACK_BUDGET_MS = 300;
const PROVIDER_ROUND_TRIP_MS = 5;
const LOAD_TEST_URI = process.env.IDENTITY_LOAD_TEST_MONGODB_URI;
const SEEDED_USER_COUNT = Number(process.env.IDENTITY_LOAD_SEED_USERS ?? "10000");
const IS_ACCEPTANCE_RUN = REQUESTS_PER_SECOND === 10 && DURATION_SECONDS === 600 && SEEDED_USER_COUNT === 10_000;

const percentile = (values: readonly number[], fraction: number): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * fraction) - 1);
  const value = sorted[index];
  if (value === undefined) throw new Error("Cannot calculate a percentile without measurements.");
  return value;
};

const waitUntil = async (deadline: number): Promise<void> => {
  const remaining = deadline - performance.now();
  if (remaining > 0) await new Promise<void>((resolve) => setTimeout(resolve, remaining));
};

void test("OIDC callback sustains 10 first sign-ins/sec for 10 minutes under the 300ms p95 budget", {
  skip: !LOAD_TEST_URI && "Set IDENTITY_LOAD_TEST_MONGODB_URI to a dedicated disposable replica-set URI.",
  timeout: (DURATION_SECONDS + 300) * 1_000
}, async (context) => {
  assert.ok(LOAD_TEST_URI, "An isolated MongoDB replica-set URI is required for this load test.");
  assert.ok(Number.isSafeInteger(SEEDED_USER_COUNT) && SEEDED_USER_COUNT >= 0, "IDENTITY_LOAD_SEED_USERS must be a non-negative integer.");

  const databaseName = `identity_signin_perf_${randomUUID().replaceAll("-", "")}`;
  const connection = await createMongoTestConnection({ uri: LOAD_TEST_URI, databaseName });
  const users = createIdentityUserModel(connection);
  const sessions = createSessionModel(connection);
  const providerDurationByCode = new Map<string, number>();
  const completionDurationByCode = new Map<string, number>();
  const provider: OidcProviderPort = Object.freeze({
    createAuthorizationRequest: () => Promise.resolve({ kind: "provider-unavailable" as const }),
    verifyCallback: async (_identityProvider, callbackUrl) => {
      const startedAt = performance.now();
      const code = new URL(callbackUrl).searchParams.get("code");
      if (!code) return { kind: "invalid-sign-in" as const };
      await new Promise<void>((resolve) => setTimeout(resolve, PROVIDER_ROUND_TRIP_MS));
      providerDurationByCode.set(code, performance.now() - startedAt);
      return {
        kind: "verified" as const,
        identity: {
          provider: "google" as const,
          subject: code,
          email: `${code}@load.acme.test`,
          displayName: `Load User ${code}`
        }
      };
    }
  });
  const identity = createIdentityUserBootstrap({
    createId: randomUUID,
    createSessionToken: () => randomUUID(),
    now: () => new Date(systemClock.now()),
    deviceLabel: "Load test"
  });
  const workspaceBootstrap = createWorkspaceBootstrap({
    transactionRunner: createMongoSignInTransactionRunner(connection),
    identity,
    createId: randomUUID
  });
  const completion = Object.freeze({
    complete: async (verifiedIdentity: Parameters<typeof workspaceBootstrap.complete>[0]) => {
      const startedAt = performance.now();
      try {
        return await workspaceBootstrap.complete(verifiedIdentity);
      } finally {
        completionDurationByCode.set(verifiedIdentity.subject, performance.now() - startedAt);
      }
    }
  });
  const flowCookie = createOidcFlowCookie({ encryptionKey: Buffer.alloc(32, 7) });
  const app = express();
  app.use(createOidcSignInRoutes({
    provider,
    flowCookie,
    completion,
    callbackBaseUrl: "http://127.0.0.1",
    webOrigin: "http://127.0.0.1:3000",
    secureCookies: false
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string", "Load-test server did not bind to a TCP port.");
  const callbackUrl = `http://127.0.0.1:${String(address.port)}/identity/callback/google`;
  const samples: Array<Readonly<{ code: string; callbackMs: number; providerMs: number; bootstrapMs: number; minute: number }>> = [];
  const requestFailures: string[] = [];

  try {
    // Provision every transaction collection and index before the timed window.
    // MongoDB cannot implicitly create multiple collections inside one transaction,
    // and index creation during the first callback would contaminate its latency.
    await users.syncIndexes();
    await sessions.syncIndexes();
    const database = connection.db;
    if (!database) throw new Error("MongoDB connection is not ready.");
    await Promise.all(["outbox", "organizations", "workspaces", "memberships"].map(async (name) => {
      await database.createCollection(name);
    }));
    for (let offset = 0; offset < SEEDED_USER_COUNT; offset += 1_000) {
      const batchSize = Math.min(1_000, SEEDED_USER_COUNT - offset);
      await users.insertMany(Array.from({ length: batchSize }, (_, batchOffset) => {
        const sequence = offset + batchOffset;
        return {
          userId: `fixture-user-${String(sequence)}`,
          email: `fixture-${String(sequence)}@load.acme.test`,
          name: "Staging Fixture User",
          provider: "google",
          subject: `fixture-google-${String(sequence)}`,
          status: "ACTIVE",
          closedAt: null
        };
      }), { ordered: false });
    }

    const launchAt = performance.now() + 1_000;
    const inFlight: Array<Promise<void>> = [];
    for (let index = 0; index < REQUEST_COUNT; index += 1) {
      await waitUntil(launchAt + index * (1_000 / REQUESTS_PER_SECOND));
      const code = `load-google-${String(index)}`;
      const cookie = flowCookie.seal({
        provider: "google",
        state: `state-${code}-0123456789`,
        nonce: `nonce-${code}-0123456789`,
        codeVerifier: `verifier-${code}-0123456789abcdefghijklmnopqrstuv`
      });
      const requestStartedAt = performance.now();
      const request = fetch(`${callbackUrl}?code=${encodeURIComponent(code)}`, {
        headers: { cookie: `${OIDC_FLOW_COOKIE_NAME}=${cookie}` },
        redirect: "manual",
        signal: AbortSignal.timeout(10_000)
      }).then(async (response) => {
        const callbackMs = performance.now() - requestStartedAt;
        const providerMs = providerDurationByCode.get(code);
        if (response.status !== 303) throw new Error(`Callback ${code} returned HTTP ${String(response.status)}.`);
        if (providerMs === undefined) throw new Error(`Stub provider timing missing for ${code}.`);
        const bootstrapMs = completionDurationByCode.get(code);
        if (bootstrapMs === undefined) throw new Error(`Workspace bootstrap timing missing for ${code}.`);
        samples.push({
          code,
          callbackMs: Math.max(0, callbackMs - providerMs),
          providerMs,
          bootstrapMs,
          minute: Math.floor(index / (REQUESTS_PER_SECOND * 60))
        });
        await response.arrayBuffer();
      }).catch((error: unknown) => {
        requestFailures.push(`${code}: ${error instanceof Error ? error.message : String(error)}`);
      });
      inFlight.push(request);
    }
    await Promise.all(inFlight);
    const callbackP95Ms = percentile(samples.map(({ callbackMs }) => callbackMs), 0.95);
    const measuredProviderP95Ms = percentile(samples.map(({ providerMs }) => providerMs), 0.95);
    const completionP95Ms = percentile(samples.map(({ bootstrapMs }) => bootstrapMs), 0.95);
    const minuteMeasurements = Array.from({ length: Math.ceil(DURATION_SECONDS / 60) }, (_, minute) => {
      const minuteSamples = samples.filter((sample) => sample.minute === minute);
      return {
        minute: minute + 1,
        callbacks: minuteSamples.length,
        bootstrapP95Ms: Number(percentile(minuteSamples.map(({ bootstrapMs }) => bootstrapMs), 0.95).toFixed(2)),
        callbackP95ExcludingProviderMs: Number(percentile(minuteSamples.map(({ callbackMs }) => callbackMs), 0.95).toFixed(2))
      };
    });
    const userCount = await users.countDocuments({ provider: "google" });
    const sessionCount = await database.collection("sessions").countDocuments({});
    const outboxCount = await database.collection("outbox").countDocuments({ type: "UserCreated" });
    const writeCountsValid = userCount === SEEDED_USER_COUNT + REQUEST_COUNT
      && sessionCount === REQUEST_COUNT
      && outboxCount === REQUEST_COUNT;
    const measurementsValid = samples.length === REQUEST_COUNT && requestFailures.length === 0;
    const passed = callbackP95Ms < CALLBACK_BUDGET_MS && writeCountsValid && measurementsValid;
    console.log(JSON.stringify({
      testCase: "TC-02.1.01-S1-6",
      companionCase: "TC-02.1.01-S1-X-performance",
      result: !passed ? "FAIL" : IS_ACCEPTANCE_RUN ? "PASS" : "DIAGNOSTIC_ONLY",
      acceptanceRun: IS_ACCEPTANCE_RUN,
      scheduledRequests: REQUEST_COUNT,
      measuredCallbacks: samples.length,
      requestFailures: requestFailures.length,
      firstRequestFailures: requestFailures.slice(0, 5),
      durationSeconds: DURATION_SECONDS,
      arrivalRatePerSecond: REQUESTS_PER_SECOND,
      seedUsers: SEEDED_USER_COUNT,
      providerRoundTripP95Ms: Number(measuredProviderP95Ms.toFixed(2)),
      workspaceBootstrapP95Ms: Number(completionP95Ms.toFixed(2)),
      callbackP95ExcludingProviderMs: Number(callbackP95Ms.toFixed(2)),
      callbackBudgetMs: CALLBACK_BUDGET_MS,
      verifiedUsers: userCount,
      verifiedSessions: sessionCount,
      verifiedUserCreatedEvents: outboxCount,
      minuteMeasurements,
      database: databaseName
    }, null, 2));
    await context.test("TC-02.1.01-S1-6 — AC-6 first sign-in callback load budget", () => {
      assert.equal(REQUESTS_PER_SECOND, 10, "AC-6 requires 10 callbacks per second.");
      assert.equal(DURATION_SECONDS, 600, "AC-6 requires a 10-minute run.");
      assert.equal(requestFailures.length, 0, `Callback request failures: ${requestFailures.slice(0, 5).join(" | ")}`);
      assert.equal(samples.length, REQUEST_COUNT, "The run did not measure every scheduled callback.");
      assert.equal(userCount, SEEDED_USER_COUNT + REQUEST_COUNT, "Not every first sign-in created one user.");
      assert.equal(sessionCount, REQUEST_COUNT, "Not every first sign-in created one session.");
      assert.equal(outboxCount, REQUEST_COUNT, "Not every first sign-in wrote one UserCreated event.");
      assert.ok(callbackP95Ms < CALLBACK_BUDGET_MS, `Callback p95 excluding provider was ${callbackP95Ms.toFixed(2)}ms; budget is ${CALLBACK_BUDGET_MS.toFixed(0)}ms.`);
    });
    await context.test("TC-02.1.01-S1-X-performance — measured surface budget at target volume", () => {
      assert.ok(IS_ACCEPTANCE_RUN, "The target-volume fixture must use 10,000 seeded users and 6,000 first sign-ins.");
      assert.equal(requestFailures.length, 0, "The target-volume run must complete without failed requests.");
      assert.equal(samples.length, REQUEST_COUNT, "Every target-volume callback must be measured.");
      assert.equal(userCount, SEEDED_USER_COUNT + REQUEST_COUNT, "Target-volume user writes did not match the fixture.");
      assert.equal(sessionCount, REQUEST_COUNT, "Target-volume session writes did not match the fixture.");
      assert.equal(outboxCount, REQUEST_COUNT, "Target-volume outbox writes did not match the fixture.");
      assert.ok(callbackP95Ms < CALLBACK_BUDGET_MS, `Measured p95 was ${callbackP95Ms.toFixed(2)}ms; budget is ${CALLBACK_BUDGET_MS.toFixed(0)}ms.`);
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    await connection.dropDatabase();
    await connection.close();
  }
});
