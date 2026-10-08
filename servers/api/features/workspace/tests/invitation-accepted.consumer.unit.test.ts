import assert from "node:assert/strict";
import test from "node:test";
import { createInvitationAcceptedConsumer, type InvitationAcceptedEvent } from "../consumers/index.js";

void test("InvitationAccepted applies the invitation role and forces guests to the guest role", async () => {
  const applied: Array<Readonly<{ role: string; guest: boolean }>> = [];
  const consumer = createInvitationAcceptedConsumer({
    workspaceOf: () => Promise.resolve({ status: "ACTIVE", defaultRole: "workspace-default" }),
    addMemberOnce: ({ role, guest }) => {
      applied.push({ role, guest });
      return Promise.resolve("applied");
    },
    markNotApplied: () => Promise.resolve("recorded"),
    emitSignal: () => undefined
  });

  const accepted: InvitationAcceptedEvent = {
    eventId: "event-1",
    workspaceId: "workspace-1",
    userId: "user-1",
    role: "designer",
    guest: false
  };
  assert.equal(await consumer.consume(accepted), "applied");
  assert.equal(await consumer.consume({ ...accepted, eventId: "event-2", role: "member", guest: true }), "applied");
  assert.deepEqual(applied, [
    { role: "designer", guest: false },
    { role: "guest", guest: true }
  ]);
});
