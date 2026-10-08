import assert from "node:assert/strict";
import test from "node:test";
import {
  planOrganizationOwnerTransfer,
  type OrganizationOwnerTransferInput
} from "../organization-owner-transfer.js";

const createInput = (overrides: Partial<OrganizationOwnerTransferInput> = {}): OrganizationOwnerTransferInput => ({
  organization: { id: "org-1", ownerId: "owner-1" },
  ownerIdWhenTransferWasOpened: "owner-1",
  recipient: { userId: "sam", isGuest: false },
  recipientMemberships: [
    { organizationId: "org-1", workspaceId: "studio", userId: "sam", role: "ADMIN", status: "ACTIVE" }
  ],
  ...overrides
});

void test("AC-1: plans a transfer to an active, non-guest workspace admin", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput()), {
    ok: true,
    value: {
      kind: "TRANSFER",
      organizationId: "org-1",
      previousOwnerId: "owner-1",
      nextOwnerId: "sam",
      expectedOwnerId: "owner-1"
    }
  });
});

void test("AC-4: returns Conflict with the current owner when the opened owner snapshot is stale", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput({
    organization: { id: "org-1", ownerId: "new-owner" }
  })), {
    ok: false,
    error: { kind: "conflict", currentOwnerId: "new-owner" }
  });
});

void test("AC-2: refuses the current owner as a transfer recipient", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput({
    recipient: { userId: "owner-1", isGuest: false }
  })), {
    ok: false,
    error: { kind: "invalid", reason: "recipient-is-current-owner" }
  });
});

void test("AC-2: refuses a guest recipient even when a workspace membership is active", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput({
    recipient: { userId: "sam", isGuest: true }
  })), {
    ok: false,
    error: { kind: "invalid", reason: "recipient-is-guest" }
  });
});

void test("AC-2: refuses a recipient whose organization workspace membership is suspended", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput({
    recipientMemberships: [{ organizationId: "org-1", workspaceId: "studio", userId: "sam", role: "ADMIN", status: "SUSPENDED" }]
  })), {
    ok: false,
    error: { kind: "invalid", reason: "recipient-membership-is-suspended" }
  });
});

void test("AC-2: refuses a recipient whose organization workspace membership is removed", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput({
    recipientMemberships: [{ organizationId: "org-1", workspaceId: "studio", userId: "sam", role: "ADMIN", status: "REMOVED" }]
  })), {
    ok: false,
    error: { kind: "invalid", reason: "recipient-membership-is-removed" }
  });
});

void test("AC-2: refuses a recipient with membership only in another organization", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput({
    recipientMemberships: [{ organizationId: "other-org", workspaceId: "studio", userId: "sam", role: "ADMIN", status: "ACTIVE" }]
  })), {
    ok: false,
    error: { kind: "invalid", reason: "recipient-has-no-organization-membership" }
  });
});

void test("AC-1: accepts an active workspace admin membership despite an inactive membership elsewhere", () => {
  assert.equal(planOrganizationOwnerTransfer(createInput({
    recipientMemberships: [
      { organizationId: "org-1", workspaceId: "studio", userId: "sam", role: "ADMIN", status: "SUSPENDED" },
      { organizationId: "org-1", workspaceId: "studio", userId: "sam", role: "ADMIN", status: "ACTIVE" }
    ]
  })).ok, true);
});

void test("AC-2: refuses an active workspace member who is not an admin", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput({
    recipientMemberships: [{ organizationId: "org-1", workspaceId: "studio", userId: "sam", role: "MEMBER", status: "ACTIVE" }]
  })), {
    ok: false,
    error: { kind: "invalid", reason: "recipient-is-not-workspace-admin" }
  });
});

void test("AC-2: returns Invalid for malformed transfer identifiers", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput({
    organization: { id: " ", ownerId: "owner-1" }
  })), {
    ok: false,
    error: { kind: "invalid", reason: "invalid-input" }
  });
});

void test("AC-2: refuses a recipient with no workspace memberships", () => {
  assert.deepEqual(planOrganizationOwnerTransfer(createInput({ recipientMemberships: [] })), {
    ok: false,
    error: { kind: "invalid", reason: "recipient-has-no-organization-membership" }
  });
});
