import test from "node:test";
import assert from "node:assert/strict";
import { createMongooseOutboxLease, type OutboxLeaseModel } from "../integrations/index.js";

type Recorded = {
  filter?: unknown;
  update?: unknown;
  options?: unknown;
  deleted: unknown[];
};

type LeaseDocument = Readonly<{ _id: string; ownerId: string; expiresAt: number }>;

const createModel = (outcome: () => Promise<LeaseDocument | null>): Readonly<{ model: OutboxLeaseModel; recorded: Recorded }> => {
  const recorded: Recorded = { deleted: [] };
  const fake = {
    findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => {
      recorded.filter = filter;
      recorded.update = update;
      recorded.options = options;
      return { lean: outcome };
    },
    deleteOne: (filter: unknown): Promise<unknown> => {
      recorded.deleted.push(filter);
      return Promise.resolve({});
    }
  };
  // The fake implements only the slice of the Mongoose model the adapter calls.
  return { model: fake as unknown as OutboxLeaseModel, recorded };
};

void test("takes or renews the lease with one conditional upsert that matches only its own or an expired lease", async (): Promise<void> => {
  const { model, recorded } = createModel(() => Promise.resolve({ _id: "outbox-relay", ownerId: "me", expiresAt: 31_000 }));
  const lease = createMongooseOutboxLease({ leaseName: "outbox-relay", model });

  const acquired = await lease.acquire({ ownerId: "me", ttlMs: 30_000, now: 1_000 });

  assert.equal(acquired, true);
  assert.deepEqual(recorded.filter, { _id: "outbox-relay", $or: [{ ownerId: "me" }, { expiresAt: { $lte: 1_000 } }] });
  assert.deepEqual(recorded.update, { $set: { ownerId: "me", expiresAt: 31_000 } });
  assert.deepEqual(recorded.options, { upsert: true, returnDocument: "after" });
});

void test("reports the lease as held elsewhere when the unique _id index rejects the upsert", async (): Promise<void> => {
  const { model } = createModel(() => Promise.reject(Object.assign(new Error("E11000 duplicate key"), { code: 11_000 })));
  const lease = createMongooseOutboxLease({ leaseName: "outbox-relay", model });

  assert.equal(await lease.acquire({ ownerId: "me", ttlMs: 30_000, now: 1_000 }), false);
});

void test("reports the lease as not held when the stored owner is someone else", async (): Promise<void> => {
  const { model } = createModel(() => Promise.resolve({ _id: "outbox-relay", ownerId: "other", expiresAt: 31_000 }));
  const lease = createMongooseOutboxLease({ leaseName: "outbox-relay", model });

  assert.equal(await lease.acquire({ ownerId: "me", ttlMs: 30_000, now: 1_000 }), false);
});

void test("surfaces database failures instead of treating them as a lost lease", async (): Promise<void> => {
  const { model } = createModel(() => Promise.reject(new Error("mongo unavailable")));
  const lease = createMongooseOutboxLease({ leaseName: "outbox-relay", model });

  await assert.rejects(lease.acquire({ ownerId: "me", ttlMs: 30_000, now: 1_000 }), /mongo unavailable/);
});

void test("releases only a lease the given owner holds", async (): Promise<void> => {
  const { model, recorded } = createModel(() => Promise.resolve(null));
  const lease = createMongooseOutboxLease({ leaseName: "outbox-relay", model });

  await lease.release({ ownerId: "me" });

  assert.deepEqual(recorded.deleted, [{ _id: "outbox-relay", ownerId: "me" }]);
});
