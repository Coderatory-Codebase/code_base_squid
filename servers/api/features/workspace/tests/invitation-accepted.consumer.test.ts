import test from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createMongoDbIntegration } from "../../../integrations/mongodb/index.js";
import { createWorkspaceInvitationAcceptedConsumer, WorkspaceModel } from "../index.js";

const logger = {
  info: (): void => undefined,
  warn: (): void => undefined,
  error: (): void => undefined
};

void test("InvitationAccepted creates one scoped member, applies roles, and records archived refusals", async (context) => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const database = createMongoDbIntegration({ uri: mongo.getUri(), logger });
  context.after(async () => {
    await database.disconnect();
    await mongo.stop();
  });
  await database.connect();
  await WorkspaceModel.init();
  await WorkspaceModel.create([
    { _id: "workspace-a", status: "ACTIVE", defaultRole: "editor", members: [], appliedEventIds: [], notAppliedEvents: [] },
    { _id: "workspace-b", status: "ACTIVE", defaultRole: "reviewer", members: [], appliedEventIds: [], notAppliedEvents: [] },
    { _id: "workspace-archived", status: "ARCHIVED", defaultRole: "member", members: [], appliedEventIds: [], notAppliedEvents: [] }
  ]);

  const consumer = createWorkspaceInvitationAcceptedConsumer({ logger });
  const invitation = { eventId: "event-a1", workspaceId: "workspace-a", userId: "user-1", guest: false } as const;
  const acceptanceStartedAt = performance.now();
  assert.equal(await consumer.consume(invitation), "applied");
  assert.ok(performance.now() - acceptanceStartedAt < 5_000, "accepted invitation must be applied within 5 seconds");
  assert.equal(await consumer.consume(invitation), "duplicate");
  assert.equal(await consumer.consume({
    eventId: "event-a2", workspaceId: "workspace-a", userId: "user-2", guest: true
  }), "applied");
  assert.equal(await consumer.consume({
    eventId: "event-b1", workspaceId: "workspace-b", userId: "user-3", guest: false
  }), "applied");
  assert.equal(await consumer.consume({
    eventId: "event-c1", workspaceId: "workspace-archived", userId: "user-4", guest: false
  }), "archived");
  assert.equal(await consumer.consume({
    eventId: "event-c1", workspaceId: "workspace-archived", userId: "user-4", guest: false
  }), "duplicate");

  const [workspaceA, workspaceB, archived] = await Promise.all([
    WorkspaceModel.findById("workspace-a").lean().exec(),
    WorkspaceModel.findById("workspace-b").lean().exec(),
    WorkspaceModel.findById("workspace-archived").lean().exec()
  ]);
  assert.ok(workspaceA);
  assert.ok(workspaceB);
  assert.ok(archived);
  assert.deepEqual(workspaceA.members.map(({ userId, role, guest }) => ({ userId, role, guest })), [
    { userId: "user-1", role: "editor", guest: false },
    { userId: "user-2", role: "guest", guest: true }
  ]);
  assert.deepEqual(workspaceA.appliedEventIds, ["event-a1", "event-a2"]);
  assert.deepEqual(workspaceB.members.map(({ userId, role }) => ({ userId, role })), [
    { userId: "user-3", role: "reviewer" }
  ]);
  assert.deepEqual(archived.members, []);
  assert.deepEqual(archived.notAppliedEvents.map(({ eventId, reason }) => ({ eventId, reason })), [
    { eventId: "event-c1", reason: "ARCHIVED" }
  ]);
});
