import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  ORGANIZATION_PROFILE_COLLECTION,
  ORGANIZATION_PROFILE_WORKSPACE_INDEX
} from "../organization-profile.schema.js";
import { down, up } from "../migrations/20261004-organization-profile.js";

const mongoCacheDirectory = fileURLToPath(new URL("../../../../../.repo-cache/mongodb-memory-server", import.meta.url));
process.env.MONGOMS_DOWNLOAD_DIR ??= mongoCacheDirectory;
process.env.MONGOMS_MD5_CHECK ??= "false";

const hasIndexNamed = (indexes: unknown, expectedName: string): boolean =>
  Array.isArray(indexes) && indexes.some((index: unknown) =>
    typeof index === "object" && index !== null && "name" in index && index.name === expectedName
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

void test("organization profile migration works forward and back on a restored fixture copy", async () => {
  await mkdir(mongoCacheDirectory, { recursive: true });
  const databasePath = join(mongoCacheDirectory, `organization-profile-restored-${randomUUID()}`);
  await mkdir(databasePath, { recursive: true });

  let mongo: MongoMemoryServer | undefined;
  let connection: mongoose.Connection | undefined;
  try {
    mongo = await MongoMemoryServer.create({ instance: { dbPath: databasePath } });
    connection = await mongoose.createConnection(mongo.getUri(), { dbName: `organization_profile_${randomUUID()}` }).asPromise();
    const collection = connection.collection(ORGANIZATION_PROFILE_COLLECTION);
    const restoredDocuments = [
      {
        workspaceId: new mongoose.Types.ObjectId(),
        organizationProfileId: new mongoose.Types.ObjectId(),
        workspaceState: "ACTIVE",
        activeMemberCount: 12,
        updatedAt: new Date("2026-10-01T12:00:00.000Z"),
        version: 3
      },
      {
        workspaceId: new mongoose.Types.ObjectId(),
        organizationProfileId: new mongoose.Types.ObjectId(),
        workspaceState: "ARCHIVED",
        activeMemberCount: 0,
        updatedAt: new Date("2026-10-02T12:00:00.000Z"),
        version: 1,
        deletedAt: new Date("2026-10-03T12:00:00.000Z")
      }
    ];
    await collection.insertMany(restoredDocuments);
    const restoredSnapshot: unknown = await collection.find().sort({ _id: 1 }).toArray();

    const upStartedAt = performance.now();
    await up(connection);
    const upDurationMs = performance.now() - upStartedAt;
    const indexesAfterUp: unknown = await collection.listIndexes().toArray();
    const [firstRestoredDocument] = restoredDocuments;
    assert.ok(firstRestoredDocument);
    const profileIndex = Array.isArray(indexesAfterUp)
      ? (indexesAfterUp as unknown[]).find((index): index is Record<string, unknown> =>
        isRecord(index) && index.name === ORGANIZATION_PROFILE_WORKSPACE_INDEX
      )
      : undefined;
    assert.ok(profileIndex);
    assert.deepEqual(profileIndex["key"], { organizationProfileId: 1, workspaceId: 1 });
    assert.equal(profileIndex["name"], ORGANIZATION_PROFILE_WORKSPACE_INDEX);
    const explainPlan = await collection.find({ organizationProfileId: firstRestoredDocument.organizationProfileId })
      .hint(ORGANIZATION_PROFILE_WORKSPACE_INDEX)
      .explain();
    assert.equal(JSON.stringify(explainPlan).includes(ORGANIZATION_PROFILE_WORKSPACE_INDEX), true);

    const downStartedAt = performance.now();
    await down(connection);
    const downDurationMs = performance.now() - downStartedAt;
    const indexesAfterDown: unknown = await collection.listIndexes().toArray();
    assert.ok(!hasIndexNamed(indexesAfterDown, ORGANIZATION_PROFILE_WORKSPACE_INDEX));
    const snapshotAfterRollback: unknown = await collection.find().sort({ _id: 1 }).toArray();
    assert.deepEqual(snapshotAfterRollback, restoredSnapshot);

    console.info(
      `organization-profile migration on restored fixture copy: up=${upDurationMs.toFixed(2)}ms; ` +
      `down=${downDurationMs.toFixed(2)}ms; documentsPreserved=${String(restoredDocuments.length)}`
    );
  } finally {
    await connection?.close();
    await mongo?.stop();
  }
});
