import assert from "node:assert/strict";
import test from "node:test";
import { invalidInvitationMessage, refuseInvalidInvitationLink } from "../user-invitation-validity.domain.js";

const now = new Date("2030-01-08T00:01:00.000Z");

void test("TC-02.1.02-S4-1 AC-1 domain rule gives an expired invitation the safe invalid-link response", () => {
  assert.deepEqual(refuseInvalidInvitationLink({ status: "pending", expiresAt: new Date("2030-01-08T00:00:00.000Z") }, now), {
    kind: "invalid",
    message: invalidInvitationMessage
  });
});

void test("TC-02.1.02-S4-2 AC-2 domain rule gives unknown, used, expired, and revoked links identical wording", () => {
  const cases = [
    null,
    { status: "accepted" as const, expiresAt: new Date("2030-01-09T00:00:00.000Z") },
    { status: "expired" as const, expiresAt: new Date("2030-01-09T00:00:00.000Z") },
    { status: "revoked" as const, expiresAt: new Date("2030-01-09T00:00:00.000Z") }
  ];
  for (const invitation of cases) {
    assert.equal(refuseInvalidInvitationLink(invitation, now).message, invalidInvitationMessage);
  }
});

void test("TC-02.1.02-S4-3 AC-3 domain rule keeps the response safe after an expired document is purged", () => {
  assert.equal(refuseInvalidInvitationLink(null, now).message, invalidInvitationMessage);
});
