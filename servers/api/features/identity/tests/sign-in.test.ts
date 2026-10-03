import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createIdentityUserBootstrap } from "../sign-in.js";
import type { IdentityUserTransaction } from "../shared/ports/user-bootstrap.port.js";

const verifiedIdentity = {
  provider: "google",
  subject: "g-1001",
  email: "lena@acme.test",
  displayName: "Lena Park"
} as const;

void test("first verified sign-in creates one user, one event, and an active hashed session", async () => {
  const users: Array<{ userId: string; provider: string; subject: string; email: string; name: string; status: string }> = [];
  const sessions: Array<{ userId: string; tokenHash: string; status: string; expiresAt: Date }> = [];
  const events: unknown[] = [];
  let id = 0;
  const transaction: IdentityUserTransaction = {
    findUserByProviderSubject: (provider, subject) => Promise.resolve(
      users.find((user) => user.provider === provider && user.subject === subject) as Awaited<ReturnType<IdentityUserTransaction["findUserByProviderSubject"]>>
    ),
    insertUser: (user) => { users.push(user); return Promise.resolve(); },
    insertSession: (session) => { sessions.push(session); return Promise.resolve(); },
    appendUserCreated: (event) => { events.push(event); return Promise.resolve(); }
  };
  const service = createIdentityUserBootstrap({
    createId: () => `id-${String(++id)}`,
    createSessionToken: () => "secret-session-token",
    now: () => new Date("2026-10-01T12:00:00.000Z"),
    deviceLabel: "Unknown device"
  });

  const result = await service.createUser(transaction, verifiedIdentity);

  assert.equal(result.kind, "created");
  assert.equal(users.length, 1);
  const createdUser = users[0];
  assert.ok(createdUser);
  assert.deepEqual(users[0], {
    userId: "id-1",
    email: "lena@acme.test",
    name: "Lena Park",
    provider: "google",
    subject: "g-1001",
    status: "ACTIVE",
    closedAt: null
  });
  assert.equal(events.length, 1);
  assert.equal(sessions.length, 1);
  const createdSession = sessions[0];
  assert.ok(createdSession);
  assert.equal(createdSession.status, "ACTIVE");
  assert.equal(createdSession.tokenHash, createHash("sha256").update("secret-session-token").digest("hex"));
  assert.notEqual(createdSession.tokenHash, "secret-session-token");
});

void test("repeated sign-in reuses the provider subject without another user or UserCreated event", async () => {
  const existingUser = {
    userId: "user-existing",
    email: "lena@acme.test",
    name: "Lena Park",
    provider: "google" as const,
    subject: "g-1001",
    status: "ACTIVE" as const,
    closedAt: null
  };
  let insertedUsers = 0;
  let writtenEvents = 0;
  let issuedSessions = 0;
  const transaction: IdentityUserTransaction = {
    findUserByProviderSubject: () => Promise.resolve(existingUser),
    insertUser: () => { insertedUsers += 1; return Promise.resolve(); },
    insertSession: () => { issuedSessions += 1; return Promise.resolve(); },
    appendUserCreated: () => { writtenEvents += 1; return Promise.resolve(); }
  };
  const service = createIdentityUserBootstrap({
    createId: () => "new-session-id",
    createSessionToken: () => "new-session-token",
    now: () => new Date("2026-10-08T12:00:00.000Z"),
    deviceLabel: "Unknown device"
  });

  const result = await service.createUser(transaction, verifiedIdentity);

  assert.equal(result.kind, "existing");
  assert.equal(result.user.userId, "user-existing");
  assert.equal(insertedUsers, 0);
  assert.equal(writtenEvents, 0);
  assert.equal(issuedSessions, 1);
});

void test("closed account sign-in writes nothing", async () => {
  let writes = 0;
  const transaction: IdentityUserTransaction = {
    findUserByProviderSubject: () => Promise.resolve({
      userId: "closed-user",
      email: "lena@acme.test",
      name: "Lena Park",
      provider: "google",
      subject: "g-1001",
      status: "CLOSED",
      closedAt: new Date("2026-09-28T00:00:00.000Z")
    }),
    insertUser: () => { writes += 1; return Promise.resolve(); },
    insertSession: () => { writes += 1; return Promise.resolve(); },
    appendUserCreated: () => { writes += 1; return Promise.resolve(); }
  };
  const service = createIdentityUserBootstrap({
    createId: () => "unused",
    createSessionToken: () => "unused",
    now: () => new Date("2026-10-01T12:00:00.000Z"),
    deviceLabel: "Unknown device"
  });

  assert.deepEqual(await service.createUser(transaction, verifiedIdentity), { kind: "account-closed" });
  assert.equal(writes, 0);
});
