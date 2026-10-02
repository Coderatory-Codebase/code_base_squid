import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { createInvitationService, InvitationCommandError } from "../user-invitation.service.js";
import type { InvitationAuditEvent } from "../user-invitation.service.js";
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

type PendingGateway = Pick<UserInvitationGateway, "findPendingByEmail" | "createPending">;

const createGateway = (existingPending = false): Readonly<{
  gateway: PendingGateway;
  calls: string[];
  created: Record<string, unknown>[];
}> => {
  const calls: string[] = [];
  const created: Record<string, unknown>[] = [];
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
    }
  };

  return Object.freeze({ gateway, calls, created });
};

const createService = (gateway: PendingGateway, events: InvitationAuditEvent[] = []) =>
  createInvitationService({
    gateway,
    now: () => new Date("2030-01-01T00:00:00.000Z"),
    createToken: () => "raw-token-for-lena-only",
    createInvitationUrl: (token) => `https://web.example.test/invitations/accept?token=${token}`,
    auditRefusal: (event) => {
      events.push(event);
      return Promise.resolve();
    }
  });

void test("AC1 creates one pending invitation with a seven-day expiry and returns its link once", async () => {
  const { gateway, created } = createGateway();
  const result = await createService(gateway).invite(admin, { email: "omar@acme.test", role: "member" });

  assert.equal(result.invitationUrl, "https://web.example.test/invitations/accept?token=raw-token-for-lena-only");
  assert.equal(created.length, 1);
  assert.equal(created[0].email, "omar@acme.test");
  assert.equal(created[0].expiresAt instanceof Date, true);
  assert.equal((created[0].expiresAt as Date).toISOString(), "2030-01-08T00:00:00.000Z");
});

void test("AC2 persists only a SHA-256 token hash", async () => {
  const { gateway, created } = createGateway();
  await createService(gateway).invite(admin, { email: "omar@acme.test", role: "member" });

  const tokenHash = created[0].tokenHash;
  assert.equal(typeof tokenHash, "string");
  assert.match(tokenHash, /^[a-f0-9]{64}$/);
  assert.notEqual(tokenHash, "raw-token-for-lena-only");
  assert.equal("token" in created[0], false);
});

void test("AC3 refuses a duplicate pending invitation without creating another link", async () => {
  const { gateway, calls } = createGateway(true);

  await assert.rejects(
    () => createService(gateway).invite(admin, { email: "omar@acme.test", role: "member" }),
    (error: unknown) => error instanceof InvitationCommandError && error.code === "duplicate-invitation"
  );
  assert.deepEqual(calls, ["find-pending"]);
});

void test("AC4 refuses a non-admin invitation, writes nothing, and audits the refusal", async () => {
  const { gateway, calls } = createGateway();
  const events: InvitationAuditEvent[] = [];

  await assert.rejects(
    () => createService(gateway, events).invite(member, { email: "omar@acme.test", role: "member" }),
    (error: unknown) => error instanceof InvitationCommandError && error.code === "forbidden"
  );
  assert.deepEqual(calls, []);
  assert.deepEqual(events, [{
    type: "invitation.refused",
    reason: "forbidden",
    workspaceId: "design",
    actorId: "sam"
  }]);
});

void test("AC5 rejects an invalid email without writing an invitation", async () => {
  const { gateway, calls } = createGateway();

  await assert.rejects(
    () => createService(gateway).invite(admin, { email: "omar@", role: "member" }),
    (error: unknown) => error instanceof InvitationCommandError && error.code === "invalid-email"
  );
  assert.deepEqual(calls, []);
});

void test("AC6 processes the stated 12,000-invitation volume with a command p95 below 300ms", async () => {
  const { gateway } = createGateway();
  const service = createInvitationService({
    gateway,
    now: () => new Date("2030-01-01T00:00:00.000Z"),
    createToken: () => "load-test-token",
    createInvitationUrl: (token) => `https://web.example.test/invitations/accept?token=${token}`,
    auditRefusal: () => Promise.resolve()
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
