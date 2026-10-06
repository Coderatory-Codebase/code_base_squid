import assert from "node:assert/strict";
import test from "node:test";
import { decideInvitationResend, decideInvitationRevocation, type ManagedInvitation } from "../user-invitation-management.domain.js";

const pending: ManagedInvitation = Object.freeze({ status: "pending", expiresAt: new Date("2030-01-02T00:00:00.000Z") });

void test("TC-02.1.02-S3-2 AC-2 domain rule revokes a pending invitation for an authorized admin", () => {
  assert.deepEqual(decideInvitationRevocation(pending, true), { kind: "revoke" });
});

void test("TC-02.1.02-S3-3 AC-3 domain rule gives a pending invitation a fresh seven-day expiry", () => {
  const result = decideInvitationResend(pending, true, new Date("2030-01-01T00:00:00.000Z"));
  if (result.kind === "resend") {
    assert.equal(result.expiresAt.toISOString(), "2030-01-08T00:00:00.000Z");
  } else {
    assert.fail(`Expected resend decision, received ${result.kind}.`);
  }
});

void test("TC-02.1.02-S3-4 AC-4 domain rule refuses management by a member without authority", () => {
  assert.deepEqual(decideInvitationRevocation(pending, false), { kind: "refused", reason: "forbidden" });
});
