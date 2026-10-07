import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Connection } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createMongoTestConnection } from "../../testing.connection.js";
import { createMongoWorkspaceAdapter } from "../workspace.adapter.js";

let replicaSet: MongoMemoryReplSet;
let connection: Connection;
let workspaceAdapter: ReturnType<typeof createMongoWorkspaceAdapter>;

before(async () => {
  replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  connection = await createMongoTestConnection({ uri: replicaSet.getUri(), databaseName: "workspace_creation" });
  workspaceAdapter = createMongoWorkspaceAdapter(connection);
});

after(async () => {
  await connection.close();
  await replicaSet.stop();
});

const database = () => {
  const connected = connection.db;
  assert.ok(connected);
  return connected;
};

const clear = async (): Promise<void> => {
  await Promise.all(["organizations", "workspaces", "memberships"].map((collection) => database().collection(collection).deleteMany({})));
};

const seedOrganization = async (userId: string): Promise<void> => {
  await database().collection<{ _id: string; ownerId: string; name: string; version: number; status: "ACTIVE"; settings: Record<string, never> }>("organizations")
    .insertOne({ _id: "org-1", ownerId: userId, name: "Design", version: 0, status: "ACTIVE", settings: {} });
};

void test("AC-1: an owner with no membership can load the create-workspace offer", async () => {
  await clear();
  await seedOrganization("owner-1");
  assert.deepEqual(await workspaceAdapter.landingForOwner("owner-1"), { kind: "create-workspace", organizationName: "Design" });
});

void test("AC-2: creation atomically writes a workspace and Owner membership, then opens it", async () => {
  await clear();
  await seedOrganization("owner-1");
  const created = await workspaceAdapter.createForOwner({ userId: "owner-1", workspaceId: "workspace-1", name: "Design" });

  assert.deepEqual(created, { workspaceId: "workspace-1", organizationId: "org-1", name: "Design" });
  assert.deepEqual(await workspaceAdapter.landingForOwner("owner-1"), { kind: "ready", workspace: created });
  assert.deepEqual(await database().collection("memberships").findOne({ userId: "owner-1", workspaceId: "workspace-1" }, { projection: { _id: 0 } }), {
    workspaceId: "workspace-1", userId: "owner-1", role: "Owner", status: "ACTIVE", guest: false,
    version: 1, deletedAt: null, deletedCause: null
  });
});

void test("policy refusal: members, guests, and users without an owner organization cannot create", async () => {
  await clear();
  await seedOrganization("owner-1");
  await database().collection("memberships").insertMany([
    { workspaceId: "member-workspace", userId: "member-1", role: "Member", status: "ACTIVE", guest: false, version: 0 },
    { workspaceId: "guest-workspace", userId: "guest-1", role: "Member", status: "ACTIVE", guest: true, version: 0 }
  ]);

  assert.equal(await workspaceAdapter.createForOwner({ userId: "member-1", workspaceId: "must-not-exist-1", name: "No" }), null);
  assert.equal(await workspaceAdapter.createForOwner({ userId: "guest-1", workspaceId: "must-not-exist-2", name: "No" }), null);
  assert.equal(await workspaceAdapter.createForOwner({ userId: "api-key-user", workspaceId: "must-not-exist-3", name: "No" }), null);
  assert.equal(await database().collection("workspaces").countDocuments({}), 0);
});

void test("concurrent creation attempts produce one workspace and one owner membership", async () => {
  await clear();
  await seedOrganization("owner-1");
  const results = await Promise.all([
    workspaceAdapter.createForOwner({ userId: "owner-1", workspaceId: "workspace-a", name: "Design" }),
    workspaceAdapter.createForOwner({ userId: "owner-1", workspaceId: "workspace-b", name: "Design" })
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(await database().collection("workspaces").countDocuments({ orgId: "org-1" }), 1);
  assert.equal(await database().collection("memberships").countDocuments({ userId: "owner-1", status: "ACTIVE" }), 1);
});

void test("AC-3: a failed write rolls back the workspace claim and does not add an owner membership", async () => {
  await clear();
  await seedOrganization("owner-1");
  await database().collection<{
    _id: string;
    orgId: string;
    version: number;
    status: "ACTIVE";
    name: string;
    settings: Record<string, never>;
    configuration: { defaultRole: "Member" };
  }>("workspaces").insertOne({
    _id: "workspace-conflict", orgId: "another-org", version: 0, status: "ACTIVE", name: "Existing",
    settings: {}, configuration: { defaultRole: "Member" }
  });

  await assert.rejects(() => workspaceAdapter.createForOwner({
    userId: "owner-1",
    workspaceId: "workspace-conflict",
    name: "Design"
  }));

  const organization = await database().collection<{ _id: string; version: number }>("organizations").findOne({ _id: "org-1" });
  assert.equal(organization?.version, 0);
  assert.equal(await database().collection("memberships").countDocuments({ userId: "owner-1" }), 0);
  assert.equal(await database().collection("workspaces").countDocuments({ orgId: "org-1" }), 0);
});
