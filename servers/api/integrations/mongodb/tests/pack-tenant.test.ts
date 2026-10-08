import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createScopedHandle, type ScopedDocument } from "../../../kernel/index.js";
import { createMongoScopedCollection, type DriverCollection } from "../scoped-collection.js";

type Task = ScopedDocument & { readonly title: string };

const state = { driverCalls: 0 };
let replSet: MongoMemoryReplSet;
let connection: mongoose.Connection;
let tasksFor: ReturnType<typeof createScopedHandle<Task>>;

void describe("PACK-TENANT: tenant isolation through the gateway (replica set)", () => {
  before(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    connection = await mongoose.createConnection(replSet.getUri()).asPromise();
    const native = connection.getClient().db("pack_tenant").collection("tasks");

    // Seed two workspaces, one row each, directly through the driver (independent of the gateway).
    await native.insertMany([
      { _id: "t1", workspaceId: "w1", version: 1, deletedAt: null, title: "A" },
      { _id: "t2", workspaceId: "w2", version: 1, deletedAt: null, title: "B" }
    ] as never);

    // Count every call that reaches the driver.
    const real = native as unknown as DriverCollection;
    const counted: DriverCollection = {
      find: (filter) => { state.driverCalls += 1; return real.find(filter); },
      insertOne: (document) => { state.driverCalls += 1; return real.insertOne(document); },
      updateOne: (filter, update) => { state.driverCalls += 1; return real.updateOne(filter, update); }
    };
    tasksFor = createScopedHandle<Task>({ collection: createMongoScopedCollection<Task>(counted) });
  }, { timeout: 180_000 });

  after(async () => {
    await connection.close();
    await replSet.stop();
  });

  void it("a member of workspace A never reads workspace B's rows", async () => {
    const asA = await tasksFor({ workspaceId: "w1" }).find();
    const asB = await tasksFor({ workspaceId: "w2" }).find();
    assert.deepEqual(asA.map((task) => task._id), ["t1"]);
    assert.deepEqual(asB.map((task) => task._id), ["t2"]);
  });

  void it("a hostile filter cannot escape the workspace", async () => {
    const handle = tasksFor({ workspaceId: "w1" });
    assert.deepEqual((await handle.find({ workspaceId: "w2" })).map((task) => task._id), ["t1"]);
    assert.deepEqual(await handle.find({ _id: "t2" }), []);
  });

  void it("a mutation cannot touch another workspace's row", async () => {
    const result = await tasksFor({ workspaceId: "w1" }).update("t2", 1, { title: "hacked" });
    assert.equal(result.status, "conflict");
    const [untouched] = await tasksFor({ workspaceId: "w2" }).find();

    assert.ok(untouched);
    assert.equal(untouched.title, "B");
    assert.equal(untouched.version, 1);
  });

  void it("a call with no workspace throws and makes zero driver calls", () => {
    const callsBefore = state.driverCalls;
    assert.throws(() => tasksFor({}), { code: "WORKSPACE_REQUIRED" });
    assert.throws(() => tasksFor({ workspaceId: null }), { code: "WORKSPACE_REQUIRED" });
    assert.throws(() => tasksFor({ workspaceId: "" }), { code: "WORKSPACE_REQUIRED" });
    assert.equal(state.driverCalls, callsBefore);
  });
});
