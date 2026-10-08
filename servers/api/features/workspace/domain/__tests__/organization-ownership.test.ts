import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveOrganizationOwnership,
  type OrganizationOwnershipInput,
  type Result
} from "../organization-ownership.js";

const valueFrom = <Value, Error>(result: Result<Value, Error>): Value => {
  if (result.ok) return result.value;
  assert.fail(`Expected success; received ${JSON.stringify(result.error)}`);
};

const createInput = (overrides: Partial<OrganizationOwnershipInput> = {}): OrganizationOwnershipInput => ({
  organization: {
    id: "org-1",
    ownerId: "deleted-owner",
    state: "ACTIVE"
  },
  deletedOwnerId: "deleted-owner",
  ownerRoleHolders: [
    {
      userId: "sam",
      workspaceId: "workspace-1",
      role: "WORKSPACE_OWNER",
      status: "ACTIVE",
      assignedAt: new Date("2026-10-01T12:00:00.000Z")
    }
  ],
  ...overrides
});

void test("AC-1: transfers ownership to the oldest active workspace owner and returns one transfer event", () => {
  const result = valueFrom(resolveOrganizationOwnership(createInput({
    ownerRoleHolders: [
      {
        userId: "later-owner",
        workspaceId: "workspace-2",
        role: "WORKSPACE_OWNER",
        status: "ACTIVE",
        assignedAt: new Date("2026-10-03T12:00:00.000Z")
      },
      {
        userId: "inactive-owner",
        workspaceId: "workspace-3",
        role: "WORKSPACE_OWNER",
        status: "INACTIVE",
        assignedAt: new Date("2026-09-01T12:00:00.000Z")
      },
      {
        userId: "active-member",
        workspaceId: "workspace-4",
        role: "MEMBER",
        status: "ACTIVE",
        assignedAt: new Date("2026-08-01T12:00:00.000Z")
      },
      {
        userId: "sam",
        workspaceId: "workspace-1",
        role: "WORKSPACE_OWNER",
        status: "ACTIVE",
        assignedAt: new Date("2026-10-01T12:00:00.000Z")
      }
    ]
  })));

  assert.deepEqual(result, {
    kind: "TRANSFERRED",
    organizationId: "org-1",
    previousOwnerId: "deleted-owner",
    newOwnerId: "sam",
    event: {
      kind: "OrganizationOwnershipTransferred",
      organizationId: "org-1",
      previousOwnerId: "deleted-owner",
      newOwnerId: "sam"
    }
  });
});

void test("AC-2: archives the organization when no other active workspace owner is eligible", () => {
  const result = valueFrom(resolveOrganizationOwnership(createInput({
    ownerRoleHolders: [
      {
        userId: "deleted-owner",
        workspaceId: "workspace-1",
        role: "WORKSPACE_OWNER",
        status: "ACTIVE",
        assignedAt: new Date("2026-09-01T12:00:00.000Z")
      },
      {
        userId: "inactive-owner",
        workspaceId: "workspace-2",
        role: "WORKSPACE_OWNER",
        status: "INACTIVE",
        assignedAt: new Date("2026-10-01T12:00:00.000Z")
      }
    ]
  })));

  assert.deepEqual(result, {
    kind: "ARCHIVED",
    organizationId: "org-1",
    previousOwnerId: "deleted-owner",
    event: {
      kind: "OrganizationArchived",
      organizationId: "org-1",
      previousOwnerId: "deleted-owner"
    }
  });
});

void test("AC-3: repeated UserDeleted after transfer returns no second transfer event", () => {
  const firstDelivery = valueFrom(resolveOrganizationOwnership(createInput()));
  assert.ok("newOwnerId" in firstDelivery);

  const repeatedDelivery = resolveOrganizationOwnership(createInput({
    organization: {
      id: "org-1",
      ownerId: firstDelivery.newOwnerId,
      state: "ACTIVE"
    }
  }));

  assert.deepEqual(repeatedDelivery, {
    ok: true,
    value: {
      kind: "UNCHANGED",
      organizationId: "org-1",
      reason: "owner-already-changed",
      event: null
    }
  });
});

void test("AC-3: an already archived organization produces no ownership event", () => {
  assert.deepEqual(resolveOrganizationOwnership(createInput({
    organization: {
      id: "org-1",
      ownerId: "deleted-owner",
      state: "ARCHIVED"
    }
  })), {
    ok: true,
    value: {
      kind: "UNCHANGED",
      organizationId: "org-1",
      reason: "organization-already-archived",
      event: null
    }
  });
});

void test("AC-3: a UserDeleted event for a former owner cannot replace the current owner", () => {
  assert.deepEqual(resolveOrganizationOwnership(createInput({
    organization: {
      id: "org-1",
      ownerId: "current-owner",
      state: "ACTIVE"
    },
    ownerRoleHolders: []
  })), {
    ok: true,
    value: {
      kind: "UNCHANGED",
      organizationId: "org-1",
      reason: "owner-already-changed",
      event: null
    }
  });
});

void test("selects a deterministic owner when workspace-owner timestamps tie", () => {
  const result = valueFrom(resolveOrganizationOwnership(createInput({
    ownerRoleHolders: [
      {
        userId: "z-owner",
        workspaceId: "workspace-a",
        role: "WORKSPACE_OWNER",
        status: "ACTIVE",
        assignedAt: new Date("2026-10-01T12:00:00.000Z")
      },
      {
        userId: "a-owner",
        workspaceId: "workspace-z",
        role: "WORKSPACE_OWNER",
        status: "ACTIVE",
        assignedAt: new Date("2026-10-01T12:00:00.000Z")
      }
    ]
  })));

  assert.equal("newOwnerId" in result ? result.newOwnerId : null, "a-owner");
});

void test("returns Invalid for an empty organization identifier", () => {
  assert.deepEqual(resolveOrganizationOwnership(createInput({
    organization: {
      id: " ",
      ownerId: "deleted-owner",
      state: "ACTIVE"
    }
  })), { ok: false, error: { kind: "invalid-input" } });
});

void test("invalid role-holder timestamps return an error instead of throwing", () => {
  const result = resolveOrganizationOwnership(createInput({
    ownerRoleHolders: [
      {
        userId: "sam",
        workspaceId: "workspace-1",
        role: "WORKSPACE_OWNER",
        status: "ACTIVE",
        assignedAt: new Date(Number.NaN)
      }
    ]
  }));

  assert.deepEqual(result, { ok: false, error: { kind: "invalid-input" } });
});
