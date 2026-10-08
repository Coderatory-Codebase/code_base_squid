import test from "node:test";
import assert from "node:assert/strict";
import { createMongooseOutboxCollection, type OutboxModel } from "../integrations/index.js";

type Recorded = {
  filter?: unknown;
  sort?: unknown;
  limit?: unknown;
  updates: Array<{ filter: unknown; update: unknown }>;
};

const createModel = (documents: readonly unknown[]): Readonly<{ model: OutboxModel; recorded: Recorded }> => {
  const recorded: Recorded = { updates: [] };
  const fake = {
    find: (filter: unknown) => {
      recorded.filter = filter;
      return {
        sort: (sort: unknown) => {
          recorded.sort = sort;
          return {
            limit: (limit: unknown) => {
              recorded.limit = limit;
              return { lean: (): Promise<readonly unknown[]> => Promise.resolve(documents) };
            }
          };
        }
      };
    },
    updateMany: (filter: unknown, update: unknown): Promise<unknown> => {
      recorded.updates.push({ filter, update });
      return Promise.resolve({});
    }
  };
  // The fake implements only the slice of the Mongoose model the adapter calls.
  return { model: fake as unknown as OutboxModel, recorded };
};

void test("reads pending rows oldest first up to the limit and maps them to outbox rows", async (): Promise<void> => {
  const { model, recorded } = createModel([
    { _id: "01A", topic: "user.created", payload: { n: 1 }, status: "pending", createdAt: 10 },
    { _id: "01B", topic: "user.deleted", payload: { n: 2 }, status: "pending", createdAt: 20 }
  ]);
  const collection = createMongooseOutboxCollection({ model });

  const rows = await collection.findPending({ limit: 25 });

  assert.deepEqual(recorded.filter, { status: "pending" });
  assert.deepEqual(recorded.sort, { _id: 1 });
  assert.equal(recorded.limit, 25);
  assert.deepEqual(rows, [
    { id: "01A", topic: "user.created", payload: { n: 1 }, createdAt: 10 },
    { id: "01B", topic: "user.deleted", payload: { n: 2 }, createdAt: 20 }
  ]);
});

void test("marks the given rows published with the publish time", async (): Promise<void> => {
  const { model, recorded } = createModel([]);
  const collection = createMongooseOutboxCollection({ model });

  await collection.markPublished({ ids: ["01A", "01B"], publishedAt: 1_700_000_000_000 });

  assert.deepEqual(recorded.updates, [{
    filter: { _id: { $in: ["01A", "01B"] } },
    update: { $set: { status: "published", publishedAt: 1_700_000_000_000 } }
  }]);
});
