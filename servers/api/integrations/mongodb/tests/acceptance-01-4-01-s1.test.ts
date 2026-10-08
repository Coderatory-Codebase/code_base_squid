import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createScopedHandle, type ScopedDocument } from "../../../kernel/index.js";
import { createMongoScopedCollection, type DriverCollection } from "../scoped-collection.js";

type Task = ScopedDocument & { readonly title: string };
type Filter = Readonly<Record<string, unknown>>;

let replSet: MongoMemoryReplSet;
let connection: mongoose.Connection;

// Fresh, seeded collection per criterion so the checks cannot influence each other.
const setup = async (collectionName: string) => {
  const native = connection.getClient().db("acceptance_01_4_01_s1").collection(collectionName);
  await native.insertMany([
    { _id: "t1", workspaceId: "w1", version: 1, deletedAt: null, title: "A" },
    { _id: "t2", workspaceId: "w2", version: 1, deletedAt: null, title: "B" }
  ] as never);

  const real = native as unknown as DriverCollection;
  const probe = { calls: 0, updateFilters: [] as Filter[] };
  const counted: DriverCollection = {
    find: (filter) => {
      probe.calls += 1;
      return real.find(filter);
    },
    insertOne: (document) => {
      probe.calls += 1;
      return real.insertOne(document);
    },
    updateOne: (filter, update) => {
      probe.calls += 1;
      probe.updateFilters.push(filter);
      return real.updateOne(filter, update);
    }
  };

  const tasksFor = createScopedHandle<Task>({ collection: createMongoScopedCollection<Task>(counted) });
  const readStored = async (): Promise<Task[]> => (await real.find({}).toArray()) as Task[];
  return { tasksFor, probe, readStored };
};

void describe("01.4.01-S1 acceptance: queries are confined to the caller's workspace", () => {
  before(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    connection = await mongoose.createConnection(replSet.getUri()).asPromise();
  }, { timeout: 180_000 });

  after(async () => {
    await connection.close();
    await replSet.stop();
  });

  void it("AC-1: reading as a member of the first workspace returns only its task", async () => {
    const { tasksFor } = await setup("ac1");
    const tasks = await tasksFor({ workspaceId: "w1" }).find();

    assert.deepEqual(tasks.map((task) => task._id), ["t1"]);
    // Persisted shape matches the data design.
    const [task] = tasks;
    assert.ok(task);
    assert.equal(task.workspaceId, "w1");
    assert.equal(task.version, 1);
    assert.equal(task.deletedAt, null);
  });

  void it("AC-2: a call with no workspace throws before any query reaches the database", async () => {
    const { tasksFor, probe, readStored } = await setup("ac2");

    assert.throws(() => tasksFor({}), { code: "WORKSPACE_REQUIRED" });
    assert.throws(() => tasksFor({ workspaceId: null }), { code: "WORKSPACE_REQUIRED" });
    assert.throws(() => tasksFor({ workspaceId: "" }), { code: "WORKSPACE_REQUIRED" });

    assert.equal(probe.calls, 0);
    assert.equal((await readStored()).length, 2);
  });

  void it("AC-3: saving a stale copy is refused as a conflict and the stored task is unchanged (ARC-008)", async () => {
    const { tasksFor, probe, readStored } = await setup("ac3");
    const handle = tasksFor({ workspaceId: "w1" });

    const [copy] = await handle.find();
    assert.ok(copy);
    assert.equal(copy.version, 1);

    // Someone else updates the task after the module read it.
    assert.deepEqual(await handle.update("t1", 1, { title: "Someone else" }), { status: "ok" });

    // The module now saves its stale copy.
    const result = await handle.update("t1", copy.version, { title: "Mine" });
    assert.deepEqual(result, { status: "conflict", code:  "VERSION_CONFLICT" });

    // The update was conditional on the version read, inside the workspace.
    const lastFilter = probe.updateFilters[probe.updateFilters.length - 1];
    assert.ok(lastFilter);
    assert.equal(lastFilter["version"], 1);
    assert.equal(lastFilter["workspaceId"], "w1");

    // Stored task is unchanged by the refused save.
    const stored = (await readStored()).find((task) => task._id === "t1");
    assert.ok(stored);
    assert.equal(stored.title, "Someone else");
    assert.equal(stored.version, 2);
    assert.equal(stored.workspaceId, "w1");
    assert.equal(stored.deletedAt, null);
  });
});
