import assert from "node:assert/strict";
import test from "node:test";
import { decideInvitationAcceptance, type InvitationForAcceptance } from "../gateways/index.js";

const pendingInvitation: InvitationForAcceptance = Object.freeze({
  email: "omar@acme.test",
  expiresAt: new Date("2030-01-08T00:00:00.000Z"),
  status: "pending"
});
const now = new Date("2030-01-01T00:00:00.000Z");

void test("TC-02.1.02-S2-1 AC-1 domain rule accepts an unexpired invitation for its invited email", () => {
  assert.deepEqual(decideInvitationAcceptance(pendingInvitation, "OMAR@acme.test", now), { kind: "accept" });
});

void test("TC-02.1.02-S2-2 AC-2 domain rule makes acceptance idempotent", () => {
  assert.deepEqual(decideInvitationAcceptance({ ...pendingInvitation, status: "accepted" }, "omar@acme.test", now), {
    kind: "already-accepted"
  });
});

void test("TC-02.1.02-S2-3 AC-3 domain rule refuses a different signed-in email", () => {
  assert.deepEqual(decideInvitationAcceptance(pendingInvitation, "sam@acme.test", now), {
    kind: "refused",
    reason: "invitation-for-a-different-email"
  });
});

void test("TC-02.1.02-S2-5 AC-5 domain rule refuses expired invitations before persistence", () => {
  assert.deepEqual(decideInvitationAcceptance({ ...pendingInvitation, expiresAt: now }, "omar@acme.test", now), {
    kind: "refused",
    reason: "invitation-no-longer-valid"
  });
});
