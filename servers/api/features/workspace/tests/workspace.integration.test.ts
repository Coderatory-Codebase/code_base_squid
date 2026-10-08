import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test, { after, before } from "node:test";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { generateTestId, setupTestDatabase, teardownTestDatabase, createTestIndex, insertTestDocuments, getExplainPlan, createReadableCollection } from "../../../integrations/mongodb/index.js";
import { createWorkspaceRepository } from "../workspace.repository.js";

let uri = process.env.TEST_MONGODB_URI;
let memoryReplicaSet: MongoMemoryReplSet | undefined;
const workspaceMongoCache = fileURLToPath(new URL("../../../../../.repo-cache/mongodb-memory-server", import.meta.url));
process.env.MONGOMS_DOWNLOAD_DIR ??= workspaceMongoCache;
process.env.MONGOMS_MD5_CHECK ??= "false";

before(async () => {
  if (uri) return;
  await mkdir(workspaceMongoCache, { recursive: true });
  const databasePath = join(workspaceMongoCache, `workspace-integration-${randomUUID()}`);
  await mkdir(databasePath, { recursive: true });
  memoryReplicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{ dbPath: databasePath }]
  });
  uri = memoryReplicaSet.getUri();
});

after(async () => {
  await memoryReplicaSet?.stop();
});

void test("Workspace Repository MongoDB Integration", async () => {
  assert.ok(uri);
  await setupTestDatabase(uri);
  try {
    // Create indexes
    await createTestIndex("workspaces", { orgId: 1, deletedAt: 1, status: 1 });
    await createTestIndex("memberships", { workspaceId: 1, userId: 1 }, { unique: true });
    await createTestIndex("memberships", { userId: 1 });

    // Seed
    const orgId = generateTestId();
    const otherOrgId = generateTestId();
    const userId = generateTestId();
    const otherUserId = generateTestId();
    const workspaceId = generateTestId();
    const otherWorkspaceId = generateTestId();

    await insertTestDocuments("organizations", [
      { _id: orgId, name: "Integration Org", ownerId: userId, createdAt: new Date("2026-10-06T12:00:00.000Z"), status: "ACTIVE" },
      { _id: otherOrgId, name: "Other Org", ownerId: otherUserId, createdAt: new Date("2026-10-06T12:00:00.000Z"), status: "ACTIVE" },
      { _id: generateTestId(), name: "Deleted Org", ownerId: userId, createdAt: new Date("2026-10-06T12:00:00.000Z"), status: "DELETED" }
    ]);

    await insertTestDocuments("workspaces", [
      { _id: workspaceId, orgId: orgId, name: "Integration Workspace", status: "ACTIVE" },
      { _id: otherWorkspaceId, orgId: otherOrgId, name: "Other Workspace", status: "ACTIVE" }
    ]);

    await insertTestDocuments("memberships", [
      { _id: generateTestId(), workspaceId: workspaceId, userId: userId, status: "ACTIVE" },
      { _id: generateTestId(), workspaceId: otherWorkspaceId, userId: userId, status: "REMOVED" },
      { _id: generateTestId(), workspaceId: workspaceId, userId: otherUserId, status: "SUSPENDED" }
    ]);

    const repo = createWorkspaceRepository({
      organizations: createReadableCollection("organizations", ["_id", "ownerId"]),
      workspaces: createReadableCollection("workspaces", ["_id", "orgId"]),
      memberships: createReadableCollection("memberships", ["_id", "workspaceId", "userId"]),
      userById: userId => Promise.resolve({ _id: userId, displayName: "Priya" })
    });

    // Valid active member
    const profile1 = await repo.findOrganizationProfile({ userId }, orgId);
    assert.ok(profile1);
    assert.equal(profile1.name, "Integration Org");
    assert.equal(profile1.ownerDisplayName, "Priya");

    // Non-member
    const profile2 = await repo.findOrganizationProfile({ userId: otherUserId }, orgId);
    assert.equal(profile2, null);

    // Member of another organization (but not this one)
    const profile3 = await repo.findOrganizationProfile({ userId }, otherOrgId);
    assert.equal(profile3, null);

    // Malformed ID
    const profile4 = await repo.findOrganizationProfile({ userId }, "malformed");
    assert.equal(profile4, null);

    // Unknown organization
    const profile5 = await repo.findOrganizationProfile({ userId }, generateTestId());
    assert.equal(profile5, null);

    // Explain plan verification
    const wsExplain = await getExplainPlan("workspaces", { status: { $ne: "DELETED" }, deletedAt: { $exists: false }, orgId });
    assert.ok(wsExplain.includes("IXSCAN"));
    assert.ok(!wsExplain.includes("COLLSCAN"));
  } finally {
    await teardownTestDatabase();
  }
});
