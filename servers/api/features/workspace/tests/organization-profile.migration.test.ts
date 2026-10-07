import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createMigrationTestDatabase, generateTestId } from "../../../integrations/mongodb/index.js";
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
  let migrationDatabase: Awaited<ReturnType<typeof createMigrationTestDatabase>> | undefined;
  try {
    mongo = await MongoMemoryServer.create({ instance: { dbPath: databasePath } });
    migrationDatabase = await createMigrationTestDatabase(mongo.getUri(), `organization_profile_${randomUUID()}`);
    const restoredDocuments = [
      {
        workspaceId: generateTestId(),
        organizationProfileId: generateTestId(),
        workspaceState: "ACTIVE",
        activeMemberCount: 12,
        updatedAt: new Date("2026-10-01T12:00:00.000Z"),
        version: 3
      },
      {
        workspaceId: generateTestId(),
        organizationProfileId: generateTestId(),
        workspaceState: "ARCHIVED",
        activeMemberCount: 0,
        updatedAt: new Date("2026-10-02T12:00:00.000Z"),
        version: 1,
        deletedAt: new Date("2026-10-03T12:00:00.000Z")
      }
    ];
    await migrationDatabase.insertMany(ORGANIZATION_PROFILE_COLLECTION, restoredDocuments);
    const restoredSnapshot = await migrationDatabase.findAll(ORGANIZATION_PROFILE_COLLECTION);

    const upStartedAt = performance.now();
    await up(migrationDatabase.connection);
    const upDurationMs = performance.now() - upStartedAt;
    const indexesAfterUp = await migrationDatabase.listIndexes(ORGANIZATION_PROFILE_COLLECTION);
    const [firstRestoredDocument] = restoredDocuments;
    assert.ok(firstRestoredDocument);
    const profileIndex = indexesAfterUp.find((index): index is Record<string, unknown> =>
      isRecord(index) && index.name === ORGANIZATION_PROFILE_WORKSPACE_INDEX
    );
    assert.ok(profileIndex);
    assert.deepEqual(profileIndex["key"], { organizationProfileId: 1, workspaceId: 1 });
    assert.equal(profileIndex["name"], ORGANIZATION_PROFILE_WORKSPACE_INDEX);
    const explainPlan = await migrationDatabase.explain(
      ORGANIZATION_PROFILE_COLLECTION,
      { organizationProfileId: firstRestoredDocument.organizationProfileId },
      ORGANIZATION_PROFILE_WORKSPACE_INDEX
    );
    assert.equal(JSON.stringify(explainPlan).includes(ORGANIZATION_PROFILE_WORKSPACE_INDEX), true);

    const downStartedAt = performance.now();
    await down(migrationDatabase.connection);
    const downDurationMs = performance.now() - downStartedAt;
    const indexesAfterDown = await migrationDatabase.listIndexes(ORGANIZATION_PROFILE_COLLECTION);
    assert.ok(!hasIndexNamed(indexesAfterDown, ORGANIZATION_PROFILE_WORKSPACE_INDEX));
    const snapshotAfterRollback = await migrationDatabase.findAll(ORGANIZATION_PROFILE_COLLECTION);
    assert.deepEqual(snapshotAfterRollback, restoredSnapshot);

    console.info(
      `organization-profile migration on restored fixture copy: up=${upDurationMs.toFixed(2)}ms; ` +
      `down=${downDurationMs.toFixed(2)}ms; documentsPreserved=${String(restoredDocuments.length)}`
    );
  } finally {
    await migrationDatabase?.close();
    await mongo?.stop();
  }
});
