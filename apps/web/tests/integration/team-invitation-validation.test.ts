import assert from "node:assert/strict";
import test from "node:test";
import { validateInvitationEmail } from "../../features/organizations/team.invitation-validation";

void test("invitation email validation returns a trimmed email for valid input", () => {
  assert.deepEqual(validateInvitationEmail("  member@example.test  "), {
    ok: true,
    email: "member@example.test"
  });
});

void test("invitation email validation refuses malformed input for field-level feedback", () => {
  assert.deepEqual(validateInvitationEmail("member@"), { ok: false });
  assert.deepEqual(validateInvitationEmail(null), { ok: false });
});
