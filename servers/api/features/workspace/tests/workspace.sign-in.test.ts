import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceSignInCallback } from "../workspace.sign-in.js";

void test("verifies the sign-in credential and forwards its identity and invitation token to bootstrap", async () => {
  const calls: string[] = [];
  const callback = createWorkspaceSignInCallback({
    verifyIdentity: (credential) => {
      calls.push(`verify:${credential}`);
      return Promise.resolve({ issuer: "https://identity.example.test", subject: "person-1", email: "person@example.test" });
    },
    bootstrap: (input) => {
      calls.push(`bootstrap:${input.invitationToken ?? "none"}:${input.identity.subject}`);
      return Promise.resolve({ status: "invitation-not-found" });
    }
  });

  const result = await callback({
    credential: "signed-identity-token",
    invitationToken: "invite-1",
    organizationName: "Acme"
  });

  assert.deepEqual(result, { status: "invitation-not-found" });
  assert.deepEqual(calls, ["verify:signed-identity-token", "bootstrap:invite-1:person-1"]);
});
