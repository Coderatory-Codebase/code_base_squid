import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import mongoose from "mongoose";
import {
  createUserProfileGateway,
  USER_PROFILE_VIEW_INDEX_NAME,
  type UserProfileRecord
} from "../features/identity/index.js";
import { createUserProfileModel } from "../integrations/mongodb/identity/user-profile.model.js";
import { createUserProfileQueryAdapter } from "../integrations/mongodb/identity/profile-query.adapter.js";

const PROFILE_COUNT = 10_000;
const MEASURED_REQUESTS = 200;
const CONCURRENCY = 10;
const P95_BUDGET_MS = 300;
const BATCH_SIZE = 1_000;

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

const run = async (): Promise<void> => {
  const sourceUri = process.env.IDENTITY_PROFILE_PERF_MONGODB_URI;
  assert(sourceUri, "Set IDENTITY_PROFILE_PERF_MONGODB_URI to a local MongoDB connection string.");

  const runId = randomUUID().replaceAll("-", "");
  const databaseName = `identity_profile_perf_${runId}`;
  const workspaceId = `profile-perf-workspace-${runId}`;
  const targetUserId = `profile-perf-user-${runId}-0`;
  const uri = createIsolatedLocalUri(sourceUri, databaseName);
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5_000 }).asPromise();

  try {
    const profileModel = createUserProfileModel(connection);
    await profileModel.createIndexes();

    const updatedAt = new Date("2026-10-01T00:00:00.000Z");
    for (let offset = 0; offset < PROFILE_COUNT; offset += BATCH_SIZE) {
      const batch = Array.from({ length: Math.min(BATCH_SIZE, PROFILE_COUNT - offset) }, (_, batchIndex): UserProfileRecord => {
        const sequence = offset + batchIndex;
        const userId = `profile-perf-user-${runId}-${String(sequence)}`;
        return {
          userProfileId: userId,
          userId,
          workspaceId,
          name: `Performance Fixture ${String(sequence)}`,
          updatedAt,
          version: 0,
          deletedAt: null
        };
      });
      await profileModel.insertMany(batch, { ordered: true });
    }

    const count = await profileModel.countDocuments({ workspaceId });
    assert.equal(count, PROFILE_COUNT, "Seeded profile count does not match the requested target volume.");

    const gateway = createUserProfileGateway({ queryPort: createUserProfileQueryAdapter(profileModel) });
    const principal = { userId: targetUserId, workspaceId };
    const warmupCount = 100;
    await Promise.all(Array.from({ length: warmupCount }, () => gateway.getUserProfile(targetUserId, principal)));

    const samples: number[] = [];
    let nextRequest = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (nextRequest < MEASURED_REQUESTS) {
        nextRequest += 1;
        const startedAt = performance.now();
        const profile = await gateway.getUserProfile(targetUserId, principal);
        samples.push(performance.now() - startedAt);
        assert.deepEqual(profile, { name: "Performance Fixture 0" });
      }
    });
    await Promise.all(workers);

    const explanation = await profileModel.collection.find({
      userProfileId: targetUserId,
      deletedAt: null,
      workspaceId
    }).sort({ updatedAt: -1 }).explain("executionStats");
    const queryPlanner = explanation.queryPlanner as unknown as Readonly<{ winningPlan: unknown }>;
    const winningPlan = JSON.stringify(queryPlanner.winningPlan);
    const indexServedQuery = winningPlan.includes(USER_PROFILE_VIEW_INDEX_NAME);
    const p95Ms = percentile(samples, 0.95);
    const result = indexServedQuery && p95Ms <= P95_BUDGET_MS ? "PASS" : "FAIL";

    console.log(JSON.stringify({
      task: "02.1.01-S1-T5",
      result,
      environment: "isolated local MongoDB",
      workspaceId,
      seededProfiles: count,
      measuredRequests: samples.length,
      concurrency: CONCURRENCY,
      warmupRequests: warmupCount,
      p95Ms: Number(p95Ms.toFixed(2)),
      p95BudgetMs: P95_BUDGET_MS,
      index: USER_PROFILE_VIEW_INDEX_NAME,
      indexServedQuery,
      database: databaseName
    }, null, 2));

    assert.equal(samples.length, MEASURED_REQUESTS, "Not every profile query was measured.");
    assert.ok(indexServedQuery, `MongoDB did not select ${USER_PROFILE_VIEW_INDEX_NAME}: ${winningPlan}`);
    assert.ok(p95Ms <= P95_BUDGET_MS, `Profile query p95 ${p95Ms.toFixed(2)}ms exceeded ${String(P95_BUDGET_MS)}ms.`);
  } finally {
    await connection.dropDatabase();
    await connection.close();
  }
};

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
