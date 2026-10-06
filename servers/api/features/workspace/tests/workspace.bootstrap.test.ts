import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorkspaceBootstrap,
  type WorkspaceBootstrapDependencies
} from "../index.js";

const transaction = Object.freeze({});

const createHarness = (
  invitationStatus: "valid" | "expired" | "missing",
  options: Readonly<{ failAcceptance?: boolean }> = {}
) => {
  const calls: string[] = [];
  const dependencies: WorkspaceBootstrapDependencies<typeof transaction> = {
    transaction: async (operation) => operation(transaction),
    createUser: (_input, activeTransaction) => {
      assert.equal(activeTransaction, transaction);
      calls.push(`user:${_input.idempotencyKey ?? "none"}`);
      return Promise.resolve({ id: "user-1" });
    },
    resolveInvitation: (_token, email, activeTransaction) => {
      assert.equal(activeTransaction, transaction);
      calls.push(`resolve-invitation:${email}`);
      if (invitationStatus === "valid") {
        return Promise.resolve({ status: "valid", organizationId: "organization-1", workspaceId: "workspace-1", role: "member" });
      }
      if (invitationStatus === "expired") {
        return Promise.resolve({ status: "expired", senderName: "Adeel" });
      }
      return Promise.resolve({ status: "missing" });
    },
    acceptInvitation: (_input, activeTransaction) => {
      assert.equal(activeTransaction, transaction);
      calls.push(`accept-invitation:${_input.idempotencyKey}`);
      if (options.failAcceptance) return Promise.reject(new Error("invitation acceptance failed"));
      return Promise.resolve();
    },
    createOrganization: (_input, activeTransaction) => {
      assert.equal(activeTransaction, transaction);
      calls.push("organization");
      return Promise.resolve({ id: "organization-1" });
    },
    createWorkspace: (_input, activeTransaction) => {
      assert.equal(activeTransaction, transaction);
      calls.push("workspace");
      return Promise.resolve();
    },
    createOwnerMembership: (_input, activeTransaction) => {
      assert.equal(activeTransaction, transaction);
      calls.push("owner-membership");
      return Promise.resolve();
    }
  };

  return { bootstrap: createWorkspaceBootstrap(dependencies), calls };
};

const input = Object.freeze({
  identity: Object.freeze({ issuer: "https://identity.example.test", subject: "person-1", email: "person@example.test" }),
  organizationName: "Acme"
});

void test("valid invitation creates a user and accepts membership without creating an organization", async () => {
  const { bootstrap, calls } = createHarness("valid");

  const result = await bootstrap({ ...input, invitationToken: "valid-token" });

  assert.deepEqual(result, {
    status: "invited",
    userId: "user-1",
    workspaceId: "workspace-1",
    role: "member"
  });
  assert.deepEqual(calls, [
    "resolve-invitation:person@example.test",
    "user:valid-token",
    "accept-invitation:valid-token"
  ]);
});

void test("expired invitation offers setup without creating a user or organization", async () => {
  const { bootstrap, calls } = createHarness("expired");

  const result = await bootstrap({ ...input, invitationToken: "expired-token" });

  assert.deepEqual(result, {
    status: "invitation-expired",
    senderName: "Adeel",
    setupAvailable: true
  });
  assert.deepEqual(calls, ["resolve-invitation:person@example.test"]);
});

void test("expired invitation creates the normal organization only after setup is chosen", async () => {
  const { bootstrap, calls } = createHarness("expired");

  const result = await bootstrap({
    ...input,
    invitationToken: "expired-token",
    chooseOrganizationSetup: true
  });

  assert.deepEqual(result, {
    status: "organization-created",
    userId: "user-1",
    organizationId: "organization-1"
  });
  assert.deepEqual(calls, [
    "resolve-invitation:person@example.test",
    "user:expired-token",
    "organization",
    "workspace",
    "owner-membership"
  ]);
});

void test("missing invitation stops before creating a user or organization", async () => {
  const { bootstrap, calls } = createHarness("missing");

  const result = await bootstrap({ ...input, invitationToken: "missing-token" });

  assert.deepEqual(result, { status: "invitation-not-found" });
  assert.deepEqual(calls, ["resolve-invitation:person@example.test"]);
});

void test("no invitation creates the organization, General workspace, and owner membership in one transaction", async () => {
  const { bootstrap, calls } = createHarness("missing");

  const result = await bootstrap(input);

  assert.deepEqual(result, {
    status: "organization-created",
    userId: "user-1",
    organizationId: "organization-1"
  });
  assert.deepEqual(calls, ["user:none", "organization", "workspace", "owner-membership"]);
});

void test("does not create an organization when accepting a valid invitation fails", async () => {
  const { bootstrap, calls } = createHarness("valid", { failAcceptance: true });

  await assert.rejects(bootstrap({ ...input, invitationToken: "valid-token" }), /invitation acceptance failed/);

  assert.deepEqual(calls, [
    "resolve-invitation:person@example.test",
    "user:valid-token",
    "accept-invitation:valid-token"
  ]);
});
