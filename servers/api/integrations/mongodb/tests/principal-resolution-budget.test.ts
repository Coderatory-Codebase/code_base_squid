import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
  createPrincipalResolver,
  createScopedHandle,
  type IdentityPort,
  type PrincipalCache,
  type PrincipalResolver,
  type ScopedDocument,
  type WorkspacePort
} from "../../../kernel/index.js";
import { createMongoScopedCollection, type DriverCollection } from "../scoped-collection.js";

type MembershipDoc = ScopedDocument & {
  readonly userId: string;
  readonly orgId: string;
  readonly role: string;
  readonly guest: boolean;
  readonly membershipStatus: string;
  readonly workspaceStatus: string;
  readonly orgStatus: string;
};

const WORKSPACE = "design";
const MEMBERS = 500;
const MISS_ROUNDS = 4;
const HIT_ROUNDS = 10;
const MISS_BUDGET_MS = 20;
const HIT_BUDGET_MS = 5;
const NOW = new Date("2026-10-04T10:00:00Z");
const FAR_FUTURE = new Date("2030-01-01T00:00:00Z");

const percentile = (samples: ReadonlyArray<number>, quantile: number): number => {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * quantile) - 1] ?? Number.NaN;
};

/** Prints the recorded numbers (copy them into the story) and returns p95. */
const report = (label: string, samples: ReadonlyArray<number>, budgetMs: number): number => {
  const p95 = percentile(samples, 0.95);
  console.log(
    `PRINCIPAL BUDGET (${label}): n=${String(samples.length)}, p50 ${percentile(samples, 0.5).toFixed(3)} ms, ` +
      `p95 ${p95.toFixed(3)} ms, p99 ${percentile(samples, 0.99).toFixed(3)} ms, budget ${String(budgetMs)} ms`
  );
  return p95;
};

let replSet: MongoMemoryReplSet;
let connection: mongoose.Connection;
let resolver: PrincipalResolver;
const store = new Map<string, unknown>();
const state = { membershipCalls: 0 };

const resolveAll = async (collect?: number[]): Promise<void> => {
  for (let member = 0; member < MEMBERS; member += 1) {
    const start = process.hrtime.bigint();
    await resolver.resolve({ sessionId: `s-${String(member)}`, workspaceId: WORKSPACE });
    collect?.push(Number(process.hrtime.bigint() - start) / 1e6);
  }
};

void describe("S2-T2: principal resolution against its budget (500 members in one workspace)", () => {
  before(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    connection = await mongoose.createConnection(replSet.getUri()).asPromise();
    const native = connection.getClient().db("principal_budget").collection("memberships");

    // Seed a workspace with 500 members, with the lookup key indexed.
    await native.insertMany(
      Array.from({ length: MEMBERS }, (_unused, index) => ({
        _id: `m${String(index)}`,
        workspaceId: WORKSPACE,
        version: 1,
        deletedAt: null,
        userId: `u${String(index)}`,
        orgId: "org-1",
        role: index % 10 === 0 ? "admin" : "member",
        guest: false,
        membershipStatus: "ACTIVE",
        workspaceStatus: "ACTIVE",
        orgStatus: "ACTIVE"
      })) as never
    );
    await native.createIndex({ workspaceId: 1, userId: 1 });

    // Workspace.membershipOf, answered through the data gateway on the real database (ARC-003).
    const driver = native as unknown as DriverCollection;
    const membershipsFor = createScopedHandle<MembershipDoc>({
      collection: createMongoScopedCollection<MembershipDoc>(driver)
    });
    const workspace: WorkspacePort = {
      membershipOf: async ({ userId, workspaceId }) => {
        state.membershipCalls += 1;
        const [doc] = await membershipsFor({ workspaceId }).find({ userId });
        if (!doc) return null;
        return {
          orgId: doc.orgId,
          role: doc.role,
          guest: doc.guest,
          membershipStatus: doc.membershipStatus,
          workspaceStatus: doc.workspaceStatus,
          orgStatus: doc.orgStatus
        };
      }
    };
    const identity: IdentityPort = {
      principalFor: (sessionId) =>
        Promise.resolve({ userId: sessionId.replace("s-", "u"), status: "ACTIVE", expiresAt: FAR_FUTURE })
    };
    // In-memory stand-in for Redis: the cache-hit number is a lower bound (no network round trip).
    const cache: PrincipalCache = {
      get: (key) => Promise.resolve(store.get(key) ?? null),
      set: (key, value) => {
        store.set(key, value);
        return Promise.resolve();
      },
      delete: (key) => {
        store.delete(key);
        return Promise.resolve();
      }
    };
    resolver = createPrincipalResolver({
      identity,
      workspace,
      cache,
      logger: { warn: () => undefined },
      now: () => NOW
    });
  }, { timeout: 180_000 });

  after(async () => {
    await connection.close();
    await replSet.stop();
  });

  void it("miss: p95 stays under 20 ms when every principal is resolved from its sources", { timeout: 300_000 }, async () => {
    await resolveAll(); // untimed: warms the driver connection and the JIT
    const samples: number[] = [];
    const callsBefore = state.membershipCalls;

    for (let round = 0; round < MISS_ROUNDS; round += 1) {
      store.clear();
      await resolveAll(samples);
    }

    // Every timed sample was a real miss: the source was asked once per resolution.
    assert.equal(state.membershipCalls - callsBefore, MEMBERS * MISS_ROUNDS);
    const p95 = report("miss", samples, MISS_BUDGET_MS);
    assert.ok(p95 < MISS_BUDGET_MS, `miss p95 ${p95.toFixed(3)} ms is not under ${String(MISS_BUDGET_MS)} ms`);
  });

  void it("hit: p95 stays under 5 ms when the principal comes from the cache", { timeout: 300_000 }, async () => {
    store.clear();
    await resolveAll(); // untimed: fills the cache for all 500 members
    const callsBefore = state.membershipCalls;
    const samples: number[] = [];

    for (let round = 0; round < HIT_ROUNDS; round += 1) {
      await resolveAll(samples);
    }

    // Every timed sample was a real hit: no source was asked.
    assert.equal(state.membershipCalls, callsBefore);
    const sample = await resolver.resolve({ sessionId: "s-0", workspaceId: WORKSPACE });
    assert.equal(sample.role, "admin");
    assert.equal(sample.userId, "u0");

    const p95 = report("hit", samples, HIT_BUDGET_MS);
    assert.ok(p95 < HIT_BUDGET_MS, `hit p95 ${p95.toFixed(3)} ms is not under ${String(HIT_BUDGET_MS)} ms`);
  });
});
