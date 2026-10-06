import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createScopedHandle, type ScopedDocument } from "../../../kernel/index.js";
import { createMongoScopedCollection, type DriverCollection } from "../scoped-collection.js";

type Task = ScopedDocument & { readonly title: string; readonly sku?: string };

const DATABASE = "acceptance_01_4_01_s2";
const SAMPLES = 10_000;
const WARMUP = 500;
const MAX_OVERHEAD_MS = 1;

let replSet: MongoMemoryReplSet;
let connection: mongoose.Connection;

const collectionFor = (name: string) => connection.getClient().db(DATABASE).collection(name);

// Three tasks in w1 (one will be soft-deleted by the check), one task in w2.
const seedThreeTasks = async (name: string) => {
  const native = collectionFor(name);
  await native.insertMany([
    { _id: "t1", workspaceId: "w1", version: 1, deletedAt: null, title: "A" },
    { _id: "t2", workspaceId: "w1", version: 1, deletedAt: null, title: "B" },
    { _id: "t3", workspaceId: "w1", version: 1, deletedAt: null, title: "C" },
    { _id: "t4", workspaceId: "w2", version: 1, deletedAt: null, title: "D" }
  ] as never);
  const driver = native as unknown as DriverCollection;
  const tasksFor = createScopedHandle<Task>({ collection: createMongoScopedCollection<Task>(driver) });
  return { tasksFor, driver };
};

const elapsedMs = async (work: () => Promise<unknown>): Promise<number> => {
  const start = process.hrtime.bigint();
  await work();
  return Number(process.hrtime.bigint() - start) / 1e6;
};

const p95 = (samples: ReadonlyArray<number>): number => {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1] ?? Number.NaN;
};

void describe("01.4.01-S2 acceptance: soft-deleted records stay out of every read except the restore path", () => {
  before(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    connection = await mongoose.createConnection(replSet.getUri()).asPromise();
  }, { timeout: 180_000 });

  after(async () => {
    await connection.close();
    await replSet.stop();
  });

  void it("AC-1: after one of three tasks is soft-deleted, a read returns the other two", async () => {
    const { tasksFor, driver } = await seedThreeTasks("ac1");
    const handle = tasksFor({ workspaceId: "w1" });

    assert.deepEqual(await handle.softDelete("t3", 1, "duplicate"), { status: "ok" });

    assert.deepEqual((await handle.find()).map((task) => task._id), ["t1", "t2"]);

    // Persisted shape: the row still exists and carries deletedAt and cause.
    const [stored] = (await driver.find({ _id: "t3" }).toArray()) as Array<Record<string, unknown>>;
    assert.ok(stored);
    assert.ok(stored["deletedAt"] instanceof Date);
    assert.equal(stored["deletedCause"], "duplicate");
    assert.equal(stored["workspaceId"], "w1");
    assert.equal(stored["version"], 2);
  });

  void it("AC-2: the restore path returns the deleted task by id, only within the caller's workspace", async () => {
    const { tasksFor } = await seedThreeTasks("ac2");
    const handle = tasksFor({ workspaceId: "w1" });
    await handle.softDelete("t3", 1, "duplicate");

    const found = await handle.restorePath.findById("t3");
    assert.ok(found);
    assert.equal(found._id, "t3");
    assert.notEqual(found.deletedAt, null);

    // Another workspace cannot reach it, and w1 cannot reach w2's rows through the restore path.
    assert.equal(await tasksFor({ workspaceId: "w2" }).restorePath.findById("t3"), null);
    assert.equal(await handle.restorePath.findById("t4"), null);
  });

  void it("AC-3: a caller's own deletedAt condition cannot bring deleted rows back", async () => {
    const { tasksFor } = await seedThreeTasks("ac3");
    const handle = tasksFor({ workspaceId: "w1" });
    await handle.softDelete("t3", 1, "duplicate");

    const hostileFilters = [
      { deletedAt: { $ne: null } },
      { deletedAt: { $exists: true } },
      { deletedAt: { $type: "date" } },
      { _id: "t3" }
    ];
    for (const filter of hostileFilters) {
      const ids = (await handle.find(filter)).map((task) => task._id);
      assert.ok(!ids.includes("t3"), `deleted row leaked for ${JSON.stringify(filter)}`);
    }
  });

  void it(
    "AC-4: an indexed find adds under 1 ms per call at p95 compared with the direct driver call",
    { timeout: 120_000 },
    async () => {
      const native = collectionFor("ac4");
      const rows = Array.from({ length: 400 }, (_unused, index) => ({
        _id: `p${String(index)}`,
        workspaceId: index % 2 === 0 ? "w1" : "w2",
        version: 1,
        deletedAt: null,
        title: `Task ${String(index)}`,
        sku: `sku-${String(index)}`
      }));
      await native.insertMany(rows as never);
      await native.createIndex({ workspaceId: 1, sku: 1 });

      const driver = native as unknown as DriverCollection;
      const tasksFor = createScopedHandle<Task>({ collection: createMongoScopedCollection<Task>(driver) });

      // sku-10 belongs to w1; every call uses the same indexed lookup.
      const throughGateway = (): Promise<ReadonlyArray<Task>> =>
        tasksFor({ workspaceId: "w1" }).find({ sku: "sku-10" });
      const direct = (): Promise<unknown[]> =>
        driver.find({ sku: "sku-10", deletedAt: null, workspaceId: "w1" }).toArray();

      // Same result either way, and the lookup really returns one row.
      assert.equal((await throughGateway()).length, 1);
      assert.equal((await direct()).length, 1);

      for (let index = 0; index < WARMUP; index += 1) {
        await throughGateway();
        await direct();
      }

      // Interleaved so machine noise lands on both sides equally.
      const gatewaySamples: number[] = [];
      const directSamples: number[] = [];
      for (let index = 0; index < SAMPLES; index += 1) {
        gatewaySamples.push(await elapsedMs(throughGateway));
        directSamples.push(await elapsedMs(direct));
      }

      const overhead = p95(gatewaySamples) - p95(directSamples);
      console.log(
        `AC-4: gateway p95 ${p95(gatewaySamples).toFixed(3)} ms, direct p95 ${p95(directSamples).toFixed(3)} ms, overhead ${overhead.toFixed(3)} ms`
      );
      assert.ok(overhead < MAX_OVERHEAD_MS, `gateway overhead ${overhead.toFixed(3)} ms is not under ${String(MAX_OVERHEAD_MS)} ms`);
    }
  );
});
