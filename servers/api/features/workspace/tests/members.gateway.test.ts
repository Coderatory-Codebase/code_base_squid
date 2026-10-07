import test from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createMongoDbIntegration } from "../../../integrations/mongodb/index.js";
import { OrganizationModel } from "../integrations/organization.model.js";
import { createMembersGateway } from "../db/members.gateway.js";

const logger = {
  info: (): void => undefined,
  warn: (): void => undefined,
  error: (): void => undefined
};

void test("dashboard reflects live team access and invite acceptance is atomic, email-bound, and one-time", async (context) => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const mongoIntegration = createMongoDbIntegration({ uri: mongo.getUri(), logger });
  context.after(async () => {
    await mongoIntegration.disconnect();
    await mongo.stop();
  });
  await mongoIntegration.connect();
  await OrganizationModel.init();
  const organizationId = "000000000000000000000031";
  await OrganizationModel.create({
    _id: organizationId,
    name: "Gateway team",
    ownerId: "owner-1",
    ownerEmail: "owner@example.test",
    workspaceIds: ["workspace-a", "workspace-b"],
    members: [],
    invitations: [],
    activity: [],
    deletedAt: null
  });

  const gateway = createMembersGateway();
  const now = new Date("2026-10-07T12:00:00.000Z");
  const acceptedAt = new Date(now.getTime() + 1_000);
  const roleChangedAt = new Date(now.getTime() + 2_000);
  const removedAt = new Date(now.getTime() + 3_000);
  const invitation = {
    email: "admin@example.test",
    role: "admin" as const,
    tokenHash: "a".repeat(64),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    invitedBy: "owner-1",
    createdAt: now,
    acceptedAt: null
  };
  assert.equal(await gateway.createInvitation(organizationId, { userId: "owner-1", workspaceIds: [] }, invitation), true);

  const ownerDashboard = await gateway.getDashboard(organizationId, { userId: "owner-1", workspaceIds: [] });
  assert.ok(ownerDashboard);
  assert.equal(ownerDashboard.viewerRole, "owner");
  assert.deepEqual(ownerDashboard.metrics, { activeTeamMembers: 1, linkedWorkspaces: 2 });
  assert.equal(ownerDashboard.activity[0]?.action, "invitation_sent");

  assert.equal(
    await gateway.acceptInvitation(
      { userId: "wrong-user", email: "other@example.test", workspaceIds: [] },
      invitation.tokenHash,
      acceptedAt
    ),
    null
  );
  const joined = await gateway.acceptInvitation(
    { userId: "admin-1", email: "ADMIN@example.test", workspaceIds: [] },
    invitation.tokenHash,
    acceptedAt
  );
  assert.deepEqual(joined, { id: organizationId, name: "Gateway team" });
  const adminDashboard = await gateway.getDashboard(organizationId, {
    userId: "admin-1",
    email: "admin@example.test",
    workspaceIds: []
  });
  assert.ok(adminDashboard);
  assert.equal(adminDashboard.viewerRole, "admin");
  assert.equal(adminDashboard.metrics.activeTeamMembers, 2);
  assert.equal(adminDashboard.activity[0]?.action, "invitation_accepted");
  assert.equal(await gateway.acceptInvitation(
    { userId: "admin-2", email: "admin@example.test", workspaceIds: [] },
    invitation.tokenHash,
    acceptedAt
  ), null);

  assert.equal(await gateway.updateMemberRole(organizationId, "owner-1", "owner@example.test", "admin-1", "member", roleChangedAt, "admin@example.test"), true);
  assert.equal(await gateway.removeMember(organizationId, "owner-1", "owner@example.test", "admin-1", removedAt, "admin@example.test"), true);
  assert.equal(await gateway.removeMember(organizationId, "owner-1", "owner@example.test", "owner-1", removedAt, "owner@example.test"), false);
  const finalDashboard = await gateway.getDashboard(organizationId, { userId: "owner-1", workspaceIds: [] });
  assert.ok(finalDashboard);
  assert.equal(finalDashboard.metrics.activeTeamMembers, 1);
  assert.deepEqual(finalDashboard.activity.map(({ action }) => action), [
    "member_removed",
    "member_role_changed",
    "invitation_accepted",
    "invitation_sent"
  ]);
  assert.equal(finalDashboard.activity[0]?.target, "admin@example.test");
});

void test("expired and duplicated pending invitations cannot be accepted or issued twice", async (context) => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const mongoIntegration = createMongoDbIntegration({ uri: mongo.getUri(), logger });
  context.after(async () => {
    await mongoIntegration.disconnect();
    await mongo.stop();
  });
  await mongoIntegration.connect();
  const organizationId = "000000000000000000000032";
  await OrganizationModel.create({
    _id: organizationId,
    name: "Expiration team",
    ownerId: "owner-2",
    ownerEmail: "owner2@example.test",
    workspaceIds: [],
    members: [],
    invitations: [],
    activity: [],
    deletedAt: null
  });
  const gateway = createMembersGateway();
  const now = new Date("2026-10-07T12:00:00.000Z");
  const expired = {
    email: "expired@example.test",
    role: "member" as const,
    tokenHash: "b".repeat(64),
    expiresAt: new Date(now.getTime() - 1),
    invitedBy: "owner-2",
    createdAt: new Date(now.getTime() - 1000),
    acceptedAt: null
  };
  assert.equal(await gateway.createInvitation(organizationId, { userId: "owner-2", workspaceIds: [] }, expired), true);
  assert.equal(await gateway.acceptInvitation(
    { userId: "expired-user", email: expired.email, workspaceIds: [] },
    expired.tokenHash,
    now
  ), null);
  assert.equal(await gateway.createInvitation(organizationId, { userId: "owner-2", workspaceIds: [] }, {
    ...expired,
    email: "pending@example.test",
    tokenHash: "c".repeat(64),
    expiresAt: new Date(now.getTime() + 60_000),
    createdAt: now
  }), true);
  assert.equal(await gateway.createInvitation(organizationId, { userId: "owner-2", workspaceIds: [] }, {
    ...expired,
    email: "pending@example.test",
    tokenHash: "d".repeat(64),
    expiresAt: new Date(now.getTime() + 60_000),
    createdAt: now
  }), false);
});
