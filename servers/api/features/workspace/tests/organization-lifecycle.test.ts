import test from "node:test";
import assert from "node:assert/strict";
import { transitionOrganizationLifecycle, resolveOrganizationLifecycle } from "../domain/organization-lifecycle.js";
import { createOrganizationLifecycleService } from "../services/organization-lifecycle.service.js";
import type { MembersGateway } from "../db/members.gateway.js";
import type { Principal } from "../../../types/index.js";

const owner: Principal = { userId: "owner-1", workspaceIds: [] };
const admin: Principal = { userId: "admin-1", workspaceIds: [] };
const initial = resolveOrganizationLifecycle({});
const now = new Date("2026-10-07T12:00:00.000Z");
const organizationId = "000000000000000000000071";
const unwrap = (result: ReturnType<typeof transitionOrganizationLifecycle>) => {
  assert.ok(result.ok);
  return result.value;
};
const getError = (result: ReturnType<typeof transitionOrganizationLifecycle>) => {
  assert.ok(!result.ok);
  return result.error;
};

void test("organization lifecycle supports archive, restore, and soft delete as versioned transitions", () => {
  const archived = unwrap(transitionOrganizationLifecycle(initial, "archive", 0, owner.userId, now));
  assert.deepEqual(archived, {
    status: "archived",
    version: 1,
    archivedAt: now,
    archivedBy: owner.userId,
    deletedAt: null
  });

  const restored = unwrap(transitionOrganizationLifecycle(archived, "restore", 1, owner.userId, now));
  assert.equal(restored.status, "active");
  assert.equal(restored.version, 2);

  const reArchived = unwrap(transitionOrganizationLifecycle(restored, "archive", 2, owner.userId, now));
  const deleted = unwrap(transitionOrganizationLifecycle(reArchived, "delete", 3, owner.userId, now));
  assert.equal(deleted.status, "deleted");
});

void test("archive rejects duplicate requests and stale versions with current state", () => {
  const archived = unwrap(transitionOrganizationLifecycle(initial, "archive", 0, owner.userId, now));
  const duplicate = getError(transitionOrganizationLifecycle(archived, "archive", 1, owner.userId, now));
  assert.match(duplicate.message, /already archived/u);
  const stale = getError(transitionOrganizationLifecycle(archived, "restore", 0, owner.userId, now));
  assert.deepEqual(stale, {
    code: "conflict",
    message: "The organization changed. Review its current state before trying again.",
    current: archived
  });
});

void test("lifecycle service refuses non-owners before attempting persistence", async () => {
  let writes = 0;
  const lifecycleGateway: MembersGateway = {
    getDashboard: () => Promise.resolve(null),
    getOrganizationLifecycle: () => Promise.resolve({ ownerId: owner.userId, lifecycle: initial }),
    transitionOrganizationLifecycle: () => {
      writes += 1;
      return Promise.resolve(initial);
    },
    createInvitation: () => Promise.resolve(false),
    acceptInvitation: () => Promise.resolve(null),
    updateMemberRole: () => Promise.resolve(false),
    removeMember: () => Promise.resolve(false)
  };
  const result = await createOrganizationLifecycleService(lifecycleGateway).transition(organizationId, admin, "archive", 0);
  assert.deepEqual(result, {
    ok: false,
    code: "forbidden",
    message: "Only the organization owner can change its lifecycle."
  });
  assert.equal(writes, 0);
});
