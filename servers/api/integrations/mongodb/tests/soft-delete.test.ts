import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createScopedHandle, type ScopedDocument } from "../../../kernel/index.js";
import { createMongoScopedCollection, type DriverCollection } from "../scoped-collection.js";

type Task = ScopedDocument & { readonly title: string };

let replSet: MongoMemoryReplSet;
let connection: mongoose.Connection;

// Fresh collection per case: three tasks in w1, one in w2.
const setup = async (name: string) => {
  const native = connection.getClient().db("soft_delete").collection(name);
  await native.insertMany([
    { _id: "t1", workspaceId: "w1", version: 1, deletedAt: null, title: "A" },
    { _id: "t2", workspaceId: "w1", version: 1, deletedAt: null, title: "B" },
    { _id: "t3", workspaceId: "w1", version: 1, deletedAt: null, title: "C" },
    { _id: "t4", workspaceId: "w2", version: 1, deletedAt: null, title: "D" }
  ] as never);
  const driver = native as unknown as DriverCollection;
  const tasksFor = createScopedHandle<Task>({ collection: createMongoScopedCollection<Task>(driver) });
  const readRaw = async (id: string): Promise<Record<string, unknown> | undefined> =>
    ((await driver.find({ _id: id }).toArray()) as Record<string, unknown>[])[0];
  return { tasksFor, readRaw };
};

void describe("01.4.01-S2 soft-delete filter and restore path", () => {
  before(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    connection = await mongoose.createConnection(replSet.getUri()).asPromise();
  }, { timeout: 180_000 });

  after(async () => {
    await connection.close();
    await replSet.stop();
  });

  void it("TC-S2-1: a soft-deleted task is excluded from reads", async () => {
    const { tasksFor } = await setup("tc1");
    const handle = tasksFor({ workspaceId: "w1" });
    assert.deepEqual(await handle.softDelete("t3", 1, "duplicate"), { status: "ok" });

    assert.deepEqual((await handle.find()).map((task) => task._id), ["t1", "t2"]);
  });

  void it("TC-S2-2: the restore path returns the deleted task, only within the caller's workspace", async () => {
    const { tasksFor } = await setup("tc2");
    const handle = tasksFor({ workspaceId: "w1" });
    await handle.softDelete("t3", 1, "duplicate");

    const found = await handle.restorePath.findById("t3");
    assert.ok(found);
    assert.equal(found._id, "t3");
    assert.notEqual(found.deletedAt, null);

    // Another workspace cannot reach it, deleted or not.
    const other = tasksFor({ workspaceId: "w2" });
    assert.equal(await other.restorePath.findById("t3"), null);
    assert.equal((await other.restorePath.findById("t4"))?._id, "t4");
    assert.equal(await handle.restorePath.findById("t4"), null);
  });

  void it("TC-S2-3: a caller's own deletedAt condition cannot bring deleted rows back", async () => {
    const { tasksFor } = await setup("tc3");
    const handle = tasksFor({ workspaceId: "w1" });
    await handle.softDelete("t3", 1, "duplicate");

    for (const filter of [{ deletedAt: { $ne: null } }, { deletedAt: { $exists: true } }, { _id: "t3" }]) {
      const ids = (await handle.find(filter)).map((task) => task._id);
      assert.ok(!ids.includes("t3"), `deleted row leaked for ${JSON.stringify(filter)}`);
    }
  });

  void it("softDelete stamps deletedAt and cause, and bumps the version", async () => {
    const { tasksFor, readRaw } = await setup("stamp");
    await tasksFor({ workspaceId: "w1" }).softDelete("t3", 1, "duplicate");

    const raw = await readRaw("t3");
    assert.ok(raw);
    assert.ok(raw["deletedAt"] instanceof Date);
    assert.equal(raw["deletedCause"], "duplicate");
    assert.equal(raw["version"], 2);
  });

  void it("restore brings a row back conditional on the version read", async () => {
    const { tasksFor } = await setup("restore");
    const handle = tasksFor({ workspaceId: "w1" });
    await handle.softDelete("t3", 1, "duplicate");

    const stale = await handle.restorePath.restore("t3", 1);
    assert.equal(stale.status, "conflict");

    assert.deepEqual(await handle.restorePath.restore("t3", 2), { status: "ok" });
    assert.deepEqual((await handle.find()).map((task) => task._id), ["t1", "t2", "t3"]);
  });

  void it("another workspace cannot soft-delete or restore this row", async () => {
    const { tasksFor, readRaw } = await setup("cross");
    const other = tasksFor({ workspaceId: "w2" });

    assert.equal((await other.softDelete("t1", 1, "x")).status, "conflict");
    assert.equal((await readRaw("t1"))?.["deletedAt"], null);
  });
});
