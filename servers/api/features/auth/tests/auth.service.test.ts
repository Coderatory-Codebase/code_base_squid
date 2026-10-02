import test from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createAuthGateway, createAuthService, hashPassword } from "../index.js";
import type { AuthGateway, AuthSession, AuthUser } from "../db/auth.gateway.js";
import { SessionModel } from "../integrations/session.model.js";
import { createMongoDbIntegration } from "../../../integrations/mongodb/index.js";

void test("sign-in stores only a token hash and resolves the server-owned principal", async () => {
  const passwordHash = await hashPassword("correct horse battery staple");
  assert.equal(passwordHash.includes("correct horse battery staple"), false);
  const user: AuthUser = { id: "user-1", email: "member@example.test", passwordHash, workspaceIds: ["workspace-1"] };
  const storedSessions: AuthSession[] = [];
  let deletedHash: string | null = null;
  const gateway: AuthGateway = {
    findUserByEmail: (email) => Promise.resolve(email === user.email ? user : null),
    findUserById: (id) => Promise.resolve(id === user.id ? user : null),
    upsertUser: () => Promise.resolve(user),
    createSession: (session) => { storedSessions.push(session); return Promise.resolve(); },
    findActiveSession: (tokenHash) => Promise.resolve(storedSessions.find(({ tokenHash: savedHash }) => savedHash === tokenHash) ?? null),
    deleteSession: (tokenHash) => { deletedHash = tokenHash; return Promise.resolve(); }
  };
  const service = createAuthService(gateway);
  const session = await service.signIn(" MEMBER@example.test ", "correct horse battery staple");
  const storedSession = storedSessions[0];

  assert.ok(storedSession);
  assert.match(storedSession.sessionId, /^[a-f0-9]{32}$/);
  assert.notEqual(storedSession.tokenHash, session.token);
  assert.deepEqual(await service.resolvePrincipal(session.token), {
    userId: "user-1",
    workspaceIds: ["workspace-1"]
  });
  await service.signOut(session.token);
  assert.equal(deletedHash, storedSession.tokenHash);
});

void test("sign-in rejects incorrect credentials without creating a session", async () => {
  const gateway: AuthGateway = {
    findUserByEmail: () => Promise.resolve(null),
    findUserById: () => Promise.resolve(null),
    upsertUser: () => Promise.reject(new Error("Not used")),
    createSession: () => Promise.reject(new Error("Not used")),
    findActiveSession: () => Promise.resolve(null),
    deleteSession: () => Promise.resolve()
  };
  await assert.rejects(createAuthService(gateway).signIn("missing@example.test", "bad-password"), {
    code: "unauthorized",
    status: 401
  });
});

void test("Mongo-backed sign-in creates, resolves, and revokes a session", async (context) => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const mongoIntegration = createMongoDbIntegration({
    uri: mongo.getUri(),
    logger: { info: () => undefined, warn: () => undefined, error: () => undefined }
  });
  context.after(async () => {
    await mongoIntegration.disconnect();
    await mongo.stop();
  });
  await mongoIntegration.connect();
  await SessionModel.init();
  const passwordHash = await hashPassword("preview-password");
  const gateway = createAuthGateway();
  const user = await gateway.upsertUser("member@example.test", passwordHash, ["workspace-1"]);
  const service = createAuthService(gateway);
  const session = await service.signIn("member@example.test", "preview-password");
  assert.deepEqual(await service.resolvePrincipal(session.token), {
    userId: user.id,
    workspaceIds: ["workspace-1"]
  });
  await service.signOut(session.token);
  assert.equal(await service.resolvePrincipal(session.token), null);
});
