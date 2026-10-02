import { test } from "node:test";
import assert from "node:assert/strict";
import { createUserInvitationGateway } from "../user-invitation.gateway.js";
import { UserInvitationModel } from "../user-invitation.model.js";
import type { Principal } from "../types.js";

const captured = <T>(value: T | null, message: string): T => {
  assert.ok(value, message);
  return value;
};

// Mock principal for testing
const mockPrincipal: Principal = Object.freeze({
  userId: "user-123",
  workspaceId: "workspace-abc",
  role: "admin",
  permissions: ["workspace:invite"]
});

void test("gateway enforces workspace scoping on queries", async () => {
  const gateway = createUserInvitationGateway();

  // Mock the model's find method to verify filter
  let capturedFilter: Record<string, unknown> | null = null;
  const originalFind = Reflect.get(UserInvitationModel, "find");

  UserInvitationModel.find = ((filter: Record<string, unknown>) => {
    capturedFilter = filter;
    return {
      sort: () => ({
        lean: () => ({
          exec: () => Promise.resolve([])
        })
      })
    };
  }) as typeof UserInvitationModel.find;

  await gateway.findByPrincipal(mockPrincipal);

  const filter = captured<Record<string, unknown>>(capturedFilter, "Filter should be captured");
  assert.equal(filter.workspaceId, "workspace-abc", "Should filter by principal's workspaceId");
  assert.equal(filter.deletedAt, null, "Should exclude soft-deleted records");

  UserInvitationModel.find = originalFind;
});

void test("gateway prevents cross-workspace reads", async () => {
  const gateway = createUserInvitationGateway();

  // Mock the model to simulate data from different workspaces
  const originalFind = Reflect.get(UserInvitationModel, "find");

  UserInvitationModel.find = ((filter: Record<string, unknown>) => {
    // Verify the filter includes workspace constraint
    assert.equal(filter.workspaceId, mockPrincipal.workspaceId);

    return {
      sort: () => ({
        lean: () => ({
          exec: () => Promise.resolve([])
        })
      })
    };
  }) as typeof UserInvitationModel.find;

  const results = await gateway.findByPrincipal(mockPrincipal);

  assert.ok(Array.isArray(results), "Should return array");
  assert.equal(results.length, 0, "Should not return records from other workspaces");

  UserInvitationModel.find = originalFind;
});

void test("gateway findOneByEmail enforces workspace scope", async () => {
  const gateway = createUserInvitationGateway();

  let capturedFilter: Record<string, unknown> | null = null;
  const originalFindOne = Reflect.get(UserInvitationModel, "findOne");

  UserInvitationModel.findOne = ((filter: Record<string, unknown>) => {
    capturedFilter = filter;
    return {
      lean: () => ({
        exec: () => Promise.resolve(null)
      })
    };
  }) as typeof UserInvitationModel.findOne;

  await gateway.findOneByEmail(mockPrincipal, "test@example.com");

  const filter = captured<Record<string, unknown>>(capturedFilter, "Filter should be captured");
  assert.equal(filter.workspaceId, "workspace-abc");
  assert.equal(filter.email, "test@example.com");
  assert.equal(filter.deletedAt, null);

  UserInvitationModel.findOne = originalFindOne;
});

void test("gateway excludes soft-deleted records by default", async () => {
  const gateway = createUserInvitationGateway();

  const originalFind = Reflect.get(UserInvitationModel, "find");

  UserInvitationModel.find = ((filter: Record<string, unknown>) => {
    assert.equal(filter.deletedAt, null, "Should explicitly exclude soft-deleted records");

    return {
      sort: () => ({
        lean: () => ({
          exec: () => Promise.resolve([])
        })
      })
    };
  }) as typeof UserInvitationModel.find;

  await gateway.findByPrincipal(mockPrincipal);

  UserInvitationModel.find = originalFind;
});

void test("invitation schema declares covering indexes for scoped listings", () => {
  const indexes = UserInvitationModel.schema.indexes().map(([keys]) => keys);

  assert.ok(
    indexes.some((keys) => JSON.stringify(keys) === JSON.stringify({ workspaceId: 1, deletedAt: 1, createdAt: -1 })),
    "default workspace listing must have a covering index"
  );
  assert.ok(
    indexes.some((keys) => JSON.stringify(keys) === JSON.stringify({ workspaceId: 1, status: 1, deletedAt: 1, createdAt: -1 })),
    "status-filtered workspace listing must have a covering index"
  );
});
