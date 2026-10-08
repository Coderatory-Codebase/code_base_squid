import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { createWorkspaceBootstrap } from "../../workspace.bootstrap.js";
import { hashInvitationToken, initializeIdentityMongoCollections } from "../../../identity/public.js";
import { createWorkspaceMongoDependencies } from "../index.js";

type SharedWorkspaceRecord = { _id: string | mongoose.Types.ObjectId; [key: string]: unknown };

const mongoUri = (() => {
  try {
    const uri = new URL(process.env.MONGODB_URI ?? "");
    if (!uri.hostname) return "";
    uri.pathname = "/test";
    return uri.toString();
  } catch {
    return "";
  }
})();
const liveTestEnabled = process.env.WORKSPACE_MONGO_INTEGRATION === "1" && Boolean(mongoUri);

void test("real MongoDB invitation bootstrap commits atomically and rolls failed setup back", {
  skip: !liveTestEnabled
}, async (testContext) => {
  const suffix = randomUUID();
  const organizationId = `t1-org-${suffix}`;
  const workspaceId = `t1-workspace-${suffix}`;
  const invitationId = `t1-invitation-${suffix}`;
  const token = `t1-token-${suffix}`;
  const provider = "google" as const;
  const rollbackProvider = "microsoft" as const;
  const email = `t1-${suffix}@example.test`;
  let db: typeof mongoose.connection.db = undefined;

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    const hello = await mongoose.connection.db?.admin().command({ hello: 1 });
    if (!hello || (typeof hello.setName !== "string" && hello.msg !== "isdbgrid")) {
      testContext.skip("Local MongoDB is standalone; transaction coverage requires a replica set.");
      return;
    }
    await initializeIdentityMongoCollections();
    db = mongoose.connection.db;
    assert.ok(db);
    const users = db.collection<SharedWorkspaceRecord>("users");
    const invitations = db.collection<SharedWorkspaceRecord>("invitations");
    const organizations = db.collection<SharedWorkspaceRecord>("organizations");
    const workspaces = db.collection<SharedWorkspaceRecord>("workspaces");
    const memberships = db.collection<SharedWorkspaceRecord>("memberships");

    await organizations.insertOne({ _id: organizationId, ownerId: "existing-owner", name: "Existing", version: 1, status: "ACTIVE", settings: {} });
    await workspaces.insertOne({ _id: workspaceId, orgId: organizationId, name: "General", version: 1, status: "ACTIVE", settings: {}, configuration: {} });
    await invitations.insertOne({
      _id: invitationId,
      tokenHash: hashInvitationToken(token),
      email,
      workspaceId,
      role: "Member",
      senderName: "Local test",
      senderUserId: "existing-owner",
      status: "PENDING",
      expiresAt: new Date("2030-01-01T00:00:00.000Z")
    });

    const dependencies = createWorkspaceMongoDependencies();
    const bootstrap = createWorkspaceBootstrap(dependencies);
    const result = await bootstrap({
      identity: { provider, subject: "invited-user", email, displayName: "Invited User" },
      organizationName: "Must not be created",
      invitationToken: token
    });
    const repeatedResult = await bootstrap({
      identity: { provider, subject: "invited-user", email, displayName: "Invited User" },
      organizationName: "Must not be created",
      invitationToken: token
    });

    assert.equal(result.status, "invited");
    assert.deepEqual(repeatedResult, result);
    assert.equal(await users.countDocuments({ provider, subject: "invited-user" }), 1);
    assert.equal(await organizations.countDocuments({ _id: organizationId }), 1);
    assert.equal(await organizations.countDocuments({ name: "Must not be created" }), 0);
    assert.equal(await memberships.countDocuments({ workspaceId, role: "Member" }), 1);
    assert.equal((await invitations.findOne({ _id: invitationId }))?.acceptedBy, result.userId);

    const failingDependencies = {
      ...dependencies,
      createWorkspace: (): Promise<void> => Promise.reject(new Error("force transaction rollback"))
    };
    const failingBootstrap = createWorkspaceBootstrap(failingDependencies);
    await assert.rejects(failingBootstrap({
      identity: { provider: rollbackProvider, subject: "setup-user", email: `setup-${suffix}@example.test`, displayName: "Setup User" },
      organizationName: `Rollback ${suffix}`
    }), /force transaction rollback/);
    assert.equal(await users.countDocuments({ provider: rollbackProvider, subject: "setup-user" }), 0);
    assert.equal(await organizations.countDocuments({ name: `Rollback ${suffix}` }), 0);
  } finally {
    if (db) {
      await db.collection<SharedWorkspaceRecord>("memberships").deleteMany({ workspaceId });
      await db.collection<SharedWorkspaceRecord>("invitations").deleteOne({ _id: invitationId });
      await db.collection<SharedWorkspaceRecord>("workspaces").deleteOne({ _id: workspaceId });
      await db.collection<SharedWorkspaceRecord>("organizations").deleteOne({ _id: organizationId });
      await db.collection<SharedWorkspaceRecord>("users").deleteMany({ provider: { $in: [provider, rollbackProvider] }, subject: { $in: ["invited-user", "setup-user"] } });
    }
    await mongoose.disconnect();
  }
});
