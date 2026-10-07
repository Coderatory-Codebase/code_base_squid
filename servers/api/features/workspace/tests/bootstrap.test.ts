import assert from "node:assert/strict";
import test from "node:test";
import { createIdentityUserBootstrap } from "../../identity/public.js";
import type { WorkspaceBootstrapTransaction } from "../bootstrap.js";
import { createWorkspaceBootstrap } from "../bootstrap.js";

void test("Workspace bootstrap creates Identity user/session/outbox and owner records in one transaction", async () => {
  const calls: string[] = [];
  const transaction: WorkspaceBootstrapTransaction = {
    findUserByProviderSubject: () => {
      calls.push("find-user");
      return Promise.resolve(null);
    },
    insertUser: () => { calls.push("insert-user"); return Promise.resolve(); },
    insertSession: () => { calls.push("insert-session"); return Promise.resolve(); },
    appendUserCreated: () => { calls.push("append-user-created"); return Promise.resolve(); },
    activeWorkspaceIdsFor: () => Promise.resolve([]),
    createOrganization: () => { calls.push("create-organization"); return Promise.resolve(); },
    createWorkspace: () => { calls.push("create-workspace"); return Promise.resolve(); },
    createOwnerMembership: () => { calls.push("create-owner-membership"); return Promise.resolve(); }
  };
  let transactionCount = 0;
  let nextId = 0;
  const bootstrap = createWorkspaceBootstrap({
    transactionRunner: {
      run: (operation) => {
        transactionCount += 1;
        return operation(transaction);
      }
    },
    identity: createIdentityUserBootstrap({
      createId: () => `id-${String(++nextId)}`,
      createSessionToken: () => "opaque-session-token",
      now: () => new Date("2026-10-01T12:00:00.000Z"),
      deviceLabel: "Unknown device"
    }),
    createId: () => `workspace-id-${String(++nextId)}`
  });

  const result = await bootstrap.complete({
    provider: "google",
    subject: "g-1001",
    email: "lena@acme.test",
    displayName: "Lena Park"
  });

  assert.deepEqual(result, { kind: "signed-in", sessionToken: "opaque-session-token", workspaceId: "workspace-id-5" });
  assert.equal(transactionCount, 1);
  assert.deepEqual(calls, [
    "find-user",
    "insert-user",
    "append-user-created",
    "insert-session",
    "create-organization",
    "create-workspace",
    "create-owner-membership"
  ]);
});

void test("Workspace bootstrap does not provision workspace records for a closed identity", async () => {
  const calls: string[] = [];
  const transaction: WorkspaceBootstrapTransaction = {
    findUserByProviderSubject: () => Promise.resolve({
      userId: "closed-user",
      email: "lena@acme.test",
      name: "Lena Park",
      provider: "google",
      subject: "g-1001",
      status: "CLOSED",
      closedAt: new Date("2026-09-28T00:00:00.000Z")
    }),
    insertUser: () => { calls.push("insert-user"); return Promise.resolve(); },
    insertSession: () => { calls.push("insert-session"); return Promise.resolve(); },
    appendUserCreated: () => { calls.push("append-user-created"); return Promise.resolve(); },
    activeWorkspaceIdsFor: () => Promise.resolve([]),
    createOrganization: () => { calls.push("create-organization"); return Promise.resolve(); },
    createWorkspace: () => { calls.push("create-workspace"); return Promise.resolve(); },
    createOwnerMembership: () => { calls.push("create-owner-membership"); return Promise.resolve(); }
  };
  const bootstrap = createWorkspaceBootstrap({
    transactionRunner: { run: (operation) => operation(transaction) },
    identity: createIdentityUserBootstrap({
      createId: () => "unused",
      createSessionToken: () => "unused",
      now: () => new Date("2026-10-01T12:00:00.000Z"),
      deviceLabel: "Unknown device"
    }),
    createId: () => "unused"
  });

  assert.deepEqual(await bootstrap.complete({
    provider: "google",
    subject: "g-1001",
    email: "lena@acme.test",
    displayName: "Lena Park"
  }), { kind: "account-closed" });
  assert.deepEqual(calls, []);
});
