import test from "node:test";
import assert from "node:assert/strict";
import { createMembersService } from "../services/members.service.js";
import type { MembersGateway } from "../db/members.gateway.js";
import type { Principal } from "../../../types/index.js";

const manager: Principal = { userId: "owner-1", email: "owner@example.test", workspaceIds: [] };
const member: Principal = { userId: "member-1", email: "member@example.test", workspaceIds: [] };
const dashboard = {
  organization: { id: "000000000000000000000001", name: "Northwind" },
  lifecycle: { status: "active" as const, version: 0, archivedAt: null, archivedBy: null, deletedAt: null },
  metrics: { activeTeamMembers: 2, linkedWorkspaces: 1 },
  viewerRole: "owner" as const,
  members: [
    { userId: manager.userId, email: manager.email ?? null, role: "owner" as const, joinedAt: null },
    { userId: "member-1", email: member.email ?? null, role: "member" as const, joinedAt: new Date() }
  ],
  activity: []
};

const gatewayFor = (overrides: Partial<MembersGateway> = {}): MembersGateway => ({
  getDashboard: async (_organizationId, principal) => ({
    ...dashboard,
    viewerRole: principal.userId === member.userId ? "member" : "owner"
  }),
  getOrganizationLifecycle: () => Promise.resolve({
    ownerId: manager.userId,
    lifecycle: dashboard.lifecycle
  }),
  transitionOrganizationLifecycle: () => Promise.resolve(dashboard.lifecycle),
  createInvitation: async () => true,
  acceptInvitation: async () => ({ id: dashboard.organization.id, name: dashboard.organization.name }),
  updateMemberRole: async () => true,
  removeMember: async () => true,
  ...overrides
});

void test("only owners and admins can invite members", async () => {
  let invitationWrites = 0;
  const service = createMembersService(gatewayFor({
    createInvitation: async () => {
      invitationWrites += 1;
      return true;
    }
  }));
  await assert.rejects(
    service.inviteMember(dashboard.organization.id, member, "new@example.test", "member"),
    (error: unknown) => typeof error === "object" && error !== null && "status" in error && error.status === 403
  );
  assert.equal(invitationWrites, 0);
});

void test("owner cannot be assigned another role or removed", async () => {
  const service = createMembersService(gatewayFor());
  await assert.rejects(
    service.updateMemberRole(dashboard.organization.id, manager, manager.userId, "member"),
    (error: unknown) => typeof error === "object" && error !== null && "status" in error && error.status === 403
  );
  await assert.rejects(
    service.removeMember(dashboard.organization.id, manager, manager.userId),
    (error: unknown) => typeof error === "object" && error !== null && "status" in error && error.status === 403
  );
});

void test("archived organizations reject team writes before persistence", async () => {
  let writes = 0;
  const service = createMembersService(gatewayFor({
    getDashboard: () => Promise.resolve({ ...dashboard, lifecycle: { ...dashboard.lifecycle, status: "archived" } }),
    createInvitation: () => { writes += 1; return Promise.resolve(true); },
    updateMemberRole: () => { writes += 1; return Promise.resolve(true); },
    removeMember: () => { writes += 1; return Promise.resolve(true); }
  }));
  await assert.rejects(
    service.inviteMember(dashboard.organization.id, manager, "new@example.test", "member"),
    (error: unknown) => typeof error === "object" && error !== null && "status" in error && error.status === 409
  );
  await assert.rejects(
    service.updateMemberRole(dashboard.organization.id, manager, member.userId, "admin"),
    (error: unknown) => typeof error === "object" && error !== null && "status" in error && error.status === 409
  );
  await assert.rejects(
    service.removeMember(dashboard.organization.id, manager, member.userId),
    (error: unknown) => typeof error === "object" && error !== null && "status" in error && error.status === 409
  );
  assert.equal(writes, 0);
});

void test("invitation stores only a token hash and expires in seven days", async () => {
  let received: Parameters<MembersGateway["createInvitation"]>[2] | undefined;
  const service = createMembersService(gatewayFor({
    createInvitation: async (_organizationId, _principal, invitation) => {
      received = invitation;
      return true;
    }
  }));
  const created = await service.inviteMember(dashboard.organization.id, manager, "New@Example.Test", "admin");
  assert.ok(received);
  assert.equal(received.email, "new@example.test");
  assert.equal(received.role, "admin");
  assert.notEqual(received.tokenHash, created.token);
  assert.equal(received.tokenHash.length, 64);
  assert.equal(received.expiresAt.getTime() - received.createdAt.getTime(), 7 * 24 * 60 * 60 * 1000);
});

void test("malformed invitation tokens are rejected before reaching persistence", async () => {
  let acceptanceCalls = 0;
  const service = createMembersService(gatewayFor({
    acceptInvitation: async () => {
      acceptanceCalls += 1;
      return null;
    }
  }));
  await assert.rejects(
    service.acceptInvitation(member, "invalid"),
    (error: unknown) => typeof error === "object" && error !== null && "status" in error && error.status === 404
  );
  assert.equal(acceptanceCalls, 0);
});
