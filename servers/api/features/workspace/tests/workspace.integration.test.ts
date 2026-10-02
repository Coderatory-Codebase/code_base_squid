import test from "node:test";
import assert from "node:assert/strict";
import { generateTestId, setupTestDatabase, teardownTestDatabase, createTestIndex, insertTestDocuments, getExplainPlan, createReadableCollection } from "../../../integrations/mongodb/index.js";
import { createWorkspaceRepository } from "../workspace.repository.js";

const uri = process.env.TEST_MONGODB_URI;

if (!uri) {
  void test("Live MongoDB integration test (workspace repository) [SKIPPED - TEST_MONGODB_URI not configured]", { skip: true }, () => {});
} else {
  void test("Workspace Repository Live MongoDB Integration", async () => {
    await setupTestDatabase(uri);

    // Create indexes
    await createTestIndex("workspaces", { orgId: 1 });
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
      { _id: orgId, name: "Integration Org", ownerId: userId, createdAt: new Date(), status: "ACTIVE" },
      { _id: otherOrgId, name: "Other Org", ownerId: otherUserId, createdAt: new Date(), status: "ACTIVE" },
      { _id: generateTestId(), name: "Deleted Org", ownerId: userId, createdAt: new Date(), status: "DELETED" }
    ]);

    await insertTestDocuments("workspaces", [
      { _id: workspaceId, orgId: orgId, status: "ACTIVE" },
      { _id: otherWorkspaceId, orgId: otherOrgId, status: "ACTIVE" }
    ]);

    await insertTestDocuments("memberships", [
      { _id: generateTestId(), workspaceId: workspaceId, userId: userId, status: "ACTIVE" },
      { _id: generateTestId(), workspaceId: otherWorkspaceId, userId: userId, status: "REMOVED" },
      { _id: generateTestId(), workspaceId: workspaceId, userId: otherUserId, status: "SUSPENDED" }
    ]);

    const repo = createWorkspaceRepository({
      organizations: createReadableCollection("organizations", ["_id", "ownerId"]),
      workspaces: createReadableCollection("workspaces", ["_id", "orgId"]),
      memberships: createReadableCollection("memberships", ["_id", "workspaceId", "userId"])
    });

    // Valid active member
    const profile1 = await repo.findOrganizationProfile({ userId }, orgId);
    assert.ok(profile1);
    assert.equal(profile1.name, "Integration Org");

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
    const wsExplain = await getExplainPlan("workspaces", { orgId: orgId, status: { $ne: "DELETED" } });
    assert.ok(wsExplain.includes("IXSCAN"));
    assert.ok(!wsExplain.includes("COLLSCAN"));

    await teardownTestDatabase();
  });
}
