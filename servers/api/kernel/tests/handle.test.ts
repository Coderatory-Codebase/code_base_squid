import test from "node:test";
import assert from "node:assert/strict";
import { createScopedHandle, type RawCollection, type ScopedDocument } from "../index.js";

type Task = ScopedDocument & { readonly title: string };

const seed = (): Task[] => [
  { _id: "t1", workspaceId: "w1", version: 1, deletedAt: null, title: "A" },
  { _id: "t2", workspaceId: "w2", version: 1, deletedAt: null, title: "B" }
];

const createFake = (rows: Task[]) => {
  const state = { calls: 0 };
  const matches = (row: Task, filter: Readonly<Record<string, unknown>>): boolean =>
    Object.entries(filter).every(([key, value]) => (row as Record<string, unknown>)[key] === value);

  const collection: RawCollection<Task> = {
    find: (filter) => { state.calls += 1; return Promise.resolve(rows.filter((row) => matches(row, filter))); },
    insertOne: (document) => { state.calls += 1; rows.push(document); return Promise.resolve(); },
    updateOne: (filter, update) => {
      state.calls += 1;
      const index = rows.findIndex((row) => matches(row, filter));
      const row = rows[index];
      if (!row) return Promise.resolve({ matchedCount: 0 });
      rows[index] = { ...row, ...(update["$set"] as object), version: row.version + 1 };
      return Promise.resolve({ matchedCount: 1 });
    }
  };
  return { collection, state };
};

void test("TC-1: sirf pehle workspace ka task milta hai", async () => {
  const { collection } = createFake(seed());
  const handle = createScopedHandle({ collection })({ workspaceId: "w1" });
  assert.deepEqual((await handle.find()).map((task) => task._id), ["t1"]);
});

void test("caller ka filter workspace predicate override nahi kar sakta", async () => {
  const { collection } = createFake(seed());
  const handle = createScopedHandle({ collection })({ workspaceId: "w1" });
  assert.deepEqual((await handle.find({ workspaceId: "w2" })).map((task) => task._id), ["t1"]);
});

void test("TC-2: workspace ke bagair query se pehle throw", () => {
  const { collection, state } = createFake(seed());
  assert.throws(() => createScopedHandle({ collection })({}), { code: "WORKSPACE_REQUIRED" });
  assert.throws(() => createScopedHandle({ collection })({ workspaceId: null }));
  assert.equal(state.calls, 0);
});

void test("TC-3: stale version par conflict aur stored task unchanged", async () => {
  const rows = seed();
  const { collection } = createFake(rows);
  const handle = createScopedHandle({ collection })({ workspaceId: "w1" });
  assert.equal((await handle.update("t1", 1, { title: "Someone else" })).status, "ok");
  const result = await handle.update("t1", 1, { title: "Mine" });
  assert.equal(result.status, "conflict");
  const updatedTask = rows[0];
  assert.ok(updatedTask);
  assert.equal(updatedTask.title, "Someone else");
  assert.equal(updatedTask.version, 2);
});
