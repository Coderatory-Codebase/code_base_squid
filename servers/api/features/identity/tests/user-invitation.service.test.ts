import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { createInvitationService, InvitationCommandError } from "../user-invitation.service.js";
import type { InvitationAuditEvent, InvitationOperationSignal } from "../user-invitation.service.js";
import type { UserInvitationGateway } from "../user-invitation.gateway.js";
import type { Principal } from "../types.js";

const admin: Principal = Object.freeze({
  userId: "lena",
  workspaceId: "design",
  role: "admin",
  permissions: ["workspace:invite"]
});

const member: Principal = Object.freeze({
  userId: "sam",
  workspaceId: "design",
  role: "member",
  permissions: ["workspace:invite"]
});

type PendingGateway = Pick<UserInvitationGateway, "findPendingByEmail" | "createPending" | "replacePending">;

const createGateway = (existingPending = false): Readonly<{
  gateway: PendingGateway;
  calls: string[];
  created: Record<string, unknown>[];
  replaced: Record<string, unknown>[];
}> => {
  const calls: string[] = [];
  const created: Record<string, unknown>[] = [];
  const replaced: Record<string, unknown>[] = [];
  const gateway: PendingGateway = {
    findPendingByEmail: () => {
      calls.push("find-pending");
      return Promise.resolve(existingPending
        ? Object.freeze({
          workspaceId: "design",
          email: "omar@acme.test",
          invitedBy: "lena",
          tokenHash: "a".repeat(64),
          status: "pending" as const,
          role: "member",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        : null);
    },
    createPending: (_principal, input) => {
      calls.push("create-pending");
      created.push(input);
      return Promise.resolve(Object.freeze({
        workspaceId: "design",
        invitedBy: "lena",
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...input
      }));
    },
    replacePending: (_principal, _email, input) => {
      calls.push("replace-pending");
      replaced.push(input);
      return Promise.resolve(Object.freeze({
        workspaceId: "design",
        invitedBy: "lena",
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...input
      }));
    }
  };

  return Object.freeze({ gateway, calls, created, replaced });
};

const createService = (
  gateway: PendingGateway,
  events: InvitationAuditEvent[] = [],
  signals: InvitationOperationSignal[] = []
) =>
  createInvitationService({
    gateway,
    now: () => new Date("2030-01-01T00:00:00.000Z"),
    createToken: () => "raw-token-for-lena-only",
    createInvitationUrl: (token) => `https://web.example.test/invitations/accept?token=${token}`,
    auditRefusal: (event) => {
      events.push(event);
      return Promise.resolve();
    },
    emitOperationSignal: (signal) => { signals.push(signal); }
  });

void test("TC-02.1.02-S1-1 AC-1 creates one pending invitation with a seven-day expiry and returns its link once", async () => {
  const { gateway, created } = createGateway();
  const signals: InvitationOperationSignal[] = [];
  const result = await createService(gateway, [], signals).invite(admin, { email: "omar@acme.test", role: "member" });

  assert.equal(result.invitationUrl, "https://web.example.test/invitations/accept?token=raw-token-for-lena-only");
  assert.equal(created.length, 1);
  assert.equal(created[0].email, "omar@acme.test");
  assert.equal(created[0].expiresAt instanceof Date, true);
  assert.equal((created[0].expiresAt as Date).toISOString(), "2030-01-08T00:00:00.000Z");
  assert.deepEqual(signals, [{
    module: "identity",
    operation: "invite-to-workspace",
    outcome: "succeeded",
    workspaceId: "design",
    actorId: "lena"
  }]);
});

void test("TC-02.1.02-S1-2 AC-2 persists only a SHA-256 token hash", async () => {
  const { gateway, created } = createGateway();
  await createService(gateway).invite(admin, { email: "omar@acme.test", role: "member" });

  const tokenHash = created[0].tokenHash;
  assert.equal(typeof tokenHash, "string");
  assert.match(tokenHash, /^[a-f0-9]{64}$/);
  assert.notEqual(tokenHash, "raw-token-for-lena-only");
  assert.equal("token" in created[0], false);
});

void test("TC-02.1.02-S1-3 AC-3 replaces a pending invitation so its first link is refused", async () => {
  const { gateway, calls, created, replaced } = createGateway(true);

  const result = await createService(gateway).invite(admin, { email: "omar@acme.test", role: "member" });

  assert.equal(result.invitationUrl, "https://web.example.test/invitations/accept?token=raw-token-for-lena-only");
  assert.deepEqual(calls, ["find-pending", "replace-pending"]);
  assert.equal(created.length, 0);
  assert.equal(replaced.length, 1);
  assert.notEqual(replaced[0].tokenHash, "a".repeat(64));
});

void test("TC-02.1.02-S1-4 AC-4 refuses a non-admin invitation, writes nothing, and audits the refusal", async () => {
  const { gateway, calls } = createGateway();
  const events: InvitationAuditEvent[] = [];
  const signals: InvitationOperationSignal[] = [];

  await assert.rejects(
    () => createService(gateway, events, signals).invite(member, { email: "omar@acme.test", role: "member" }),
    (error: unknown) => error instanceof InvitationCommandError && error.code === "forbidden"
  );
  assert.deepEqual(calls, []);
  assert.deepEqual(events, [{
    type: "invitation.refused",
    reason: "forbidden",
    workspaceId: "design",
    actorId: "sam"
  }]);
  assert.deepEqual(signals, [{
    module: "identity",
    operation: "invite-to-workspace",
    outcome: "refused",
    workspaceId: "design",
    actorId: "sam",
    reason: "forbidden"
  }]);
});

void test("TC-02.1.02-S1-5 AC-5 rejects an invalid email without writing an invitation", async () => {
  const { gateway, calls } = createGateway();

  await assert.rejects(
    () => createService(gateway).invite(admin, { email: "omar@", role: "member" }),
    (error: unknown) => error instanceof InvitationCommandError && error.code === "invalid-email"
  );
  assert.deepEqual(calls, []);
});

void test("TC-02.1.02-S1-6 AC-6 supporting unit regression processes invitations within the local p95 guardrail", async () => {
  const { gateway } = createGateway();
  const service = createInvitationService({
    gateway,
    now: () => new Date("2030-01-01T00:00:00.000Z"),
    createToken: () => "load-test-token",
    createInvitationUrl: (token) => `https://web.example.test/invitations/accept?token=${token}`,
    auditRefusal: () => Promise.resolve(),
    emitOperationSignal: () => undefined
  });
  const durations: number[] = [];

  for (let index = 0; index < 12_000; index += 1) {
    const startedAt = performance.now();
    await service.invite(admin, { email: `member-${String(index)}@acme.test`, role: "member" });
    durations.push(performance.now() - startedAt);
  }

  durations.sort((left, right) => left - right);
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  assert.ok(p95 !== undefined);
  assert.ok(p95 < 300, `Expected p95 below 300ms; received ${p95.toFixed(2)}ms.`);
});
