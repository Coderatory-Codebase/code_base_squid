import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import test, { after, before } from "node:test";
import {
  createInvitationService,
  createUserInvitationGateway,
  InvitationCommandError,
  UserInvitationModel
} from "../../../../features/identity/index.js";
import type { InvitationPrincipal } from "../../../../features/identity/index.js";

const now = new Date("2030-01-01T00:00:00.000Z");
const firstToken = "A".repeat(43);
const replacementToken = "B".repeat(43);
const testMongoUri = process.env.TEST_MONGODB_URI;
const integrationSkip = testMongoUri
  ? false
  : "Set TEST_MONGODB_URI to an isolated MongoDB test database to run invitation integration cases.";
const admin: InvitationPrincipal = Object.freeze({
  userId: "admin-1",
  workspaceId: "workspace-1",
  role: "admin",
  permissions: ["workspace:invite"]
});
const otherWorkspace: InvitationPrincipal = Object.freeze({ ...admin, workspaceId: "workspace-2" });
before(async () => {
  if (!testMongoUri) return;
  await mongoose.connect(testMongoUri, { dbName: `identity-invitations-${randomUUID()}` });
  await UserInvitationModel.init();
});

after(async () => {
  if (testMongoUri) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

const clearInvitations = async (): Promise<void> => {
  await UserInvitationModel.deleteMany({}).exec();
};

const serviceWithTokens = (tokens: readonly string[]) => {
  let index = 0;
  return createInvitationService({
    gateway: createUserInvitationGateway(),
    now: () => new Date(now),
    createToken: () => tokens[index++] ?? `overflow-token-${String(index)}`,
    createInvitationUrl: (token) => `https://web.example.test/workspace/invitations/accept?token=${token}`,
    auditRefusal: () => Promise.resolve(),
    emitOperationSignal: () => undefined
  });
};

const tokenHash = (token: string): string => createHash("sha256").update(token).digest("hex");

void test("TC-02.1.02-S1-1 AC-1 persists one scoped pending invitation with a seven-day expiry", { skip: integrationSkip }, async () => {
  await clearInvitations();
  const service = serviceWithTokens([firstToken]);

  const result = await service.invite(admin, { email: "member@example.test", role: "member" });
  const records = await createUserInvitationGateway().findByPrincipal(admin, { status: "pending" });

  assert.equal(result.invitationUrl, `https://web.example.test/workspace/invitations/accept?token=${firstToken}`);
  assert.equal(records.length, 1);
  const [record] = records;
  assert.ok(record);
  assert.equal(record.expiresAt.toISOString(), "2030-01-08T00:00:00.000Z");
  assert.equal(record.status, "pending");
});

void test("TC-02.1.02-S1-2 AC-2 persists the token digest and never persists the raw token", { skip: integrationSkip }, async () => {
  await clearInvitations();
  const rawToken = "R".repeat(43);
  await serviceWithTokens([rawToken]).invite(admin, { email: "member@example.test", role: "member" });
  const stored = await UserInvitationModel.findOne({ workspaceId: admin.workspaceId }).lean().exec();

  assert.ok(stored);
  assert.equal(stored.tokenHash, tokenHash(rawToken));
  assert.equal(JSON.stringify(stored).includes(rawToken), false);
  assert.equal("token" in stored, false);
});

void test("TC-02.1.02-S1-3 AC-3 replaces the pending invitation and invalidates its earlier token", { skip: integrationSkip }, async () => {
  await clearInvitations();
  const service = serviceWithTokens([firstToken, replacementToken]);
  await service.invite(admin, { email: "member@example.test", role: "member" });
  await service.invite(admin, { email: "member@example.test", role: "admin" });
  const gateway = createUserInvitationGateway();
  const records = await gateway.findByPrincipal(admin, { status: "pending" });

  assert.equal(records.length, 1);
  assert.equal(records[0]?.role, "admin");
  assert.equal(await UserInvitationModel.exists({ tokenHash: tokenHash(firstToken) }), null);
  assert.equal(await UserInvitationModel.exists({ tokenHash: tokenHash(replacementToken) }) !== null, true);
});

void test("TC-02.1.02-S1-5 AC-5 rejects an invalid address without a Mongo write", { skip: integrationSkip }, async () => {
  await clearInvitations();
  await assert.rejects(
    () => serviceWithTokens(["unused-token"]).invite(admin, { email: "not-an-address", role: "member" }),
    (error: unknown) => error instanceof InvitationCommandError && error.code === "invalid-email"
  );
  assert.equal(await UserInvitationModel.countDocuments({}).exec(), 0);
});

void test("TC-02.1.02-S1-X-data scopes real Mongo reads and excludes soft-deleted records", { skip: integrationSkip }, async () => {
  await clearInvitations();
  await UserInvitationModel.insertMany([
    { workspaceId: admin.workspaceId, email: "live@example.test", invitedBy: admin.userId, tokenHash: tokenHash("live-token"), status: "pending", role: "member", expiresAt: new Date("2030-01-08T00:00:00.000Z"), deletedAt: null },
    { workspaceId: admin.workspaceId, email: "deleted@example.test", invitedBy: admin.userId, tokenHash: tokenHash("deleted-token"), status: "pending", role: "member", expiresAt: new Date("2030-01-08T00:00:00.000Z"), deletedAt: now },
    { workspaceId: otherWorkspace.workspaceId, email: "other@example.test", invitedBy: admin.userId, tokenHash: tokenHash("other-token"), status: "pending", role: "member", expiresAt: new Date("2030-01-08T00:00:00.000Z"), deletedAt: null }
  ]);

  const records = await createUserInvitationGateway().findByPrincipal(admin, { status: "pending" });
  assert.deepEqual(records.map(({ email }) => email), ["live@example.test"]);
  const indexes = UserInvitationModel.schema.indexes().map(([keys]) => keys);
  assert.ok(indexes.some((keys) => JSON.stringify(keys) === JSON.stringify({ workspaceId: 1, status: 1, deletedAt: 1, createdAt: -1 })));
});
