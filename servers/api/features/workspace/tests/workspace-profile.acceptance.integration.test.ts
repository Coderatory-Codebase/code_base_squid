import { createServer } from "node:http";
import express from "express";
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  createReadableCollection,
  createTestIndex,
  generateTestId,
  getExplainPlan,
  insertTestDocuments,
  runMongoCommand,
  setupTestDatabase,
  toMongoObjectId,
  teardownTestDatabase
} from "../../../integrations/mongodb/index.js";
import { createWorkspaceRoutes } from "../index.js";
import { createWorkspaceRepository } from "../workspace.repository.js";
import { systemClock } from "@workspace/kernel";
import type { Logger } from "@workspace/logging";

let mongoUri = process.env.TEST_MONGODB_URI;
let memoryReplicaSet: MongoMemoryReplSet | undefined;
const logger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};
const workspaceMongoCache = fileURLToPath(new URL("../../../../../.repo-cache/mongodb-memory-server", import.meta.url));
process.env.MONGOMS_DOWNLOAD_DIR ??= workspaceMongoCache;
// mongodb-memory-server's MD5 helper buffers the full Windows archive in memory.
// MongoDB is fetched from the vendor's HTTPS distribution endpoint.
process.env.MONGOMS_MD5_CHECK ??= "false";

before(async () => {
  if (mongoUri) return;
  await mkdir(workspaceMongoCache, { recursive: true });
  const databasePath = join(workspaceMongoCache, `data-${randomUUID()}`);
  await mkdir(databasePath, { recursive: true });
  memoryReplicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{ dbPath: databasePath }]
  });
  mongoUri = memoryReplicaSet.getUri();
});

after(async () => {
  await memoryReplicaSet?.stop();
});

const runWithMongo = (name: string, run: () => Promise<void>): void => {
  void test(name, async () => {
    assert.ok(mongoUri);
    await setupTestDatabase(mongoUri);
    try {
      await run();
    } finally {
      await teardownTestDatabase();
    }
  });
};

const createProfileRepository = () => createWorkspaceRepository({
  organizations: createReadableCollection("organizations", ["_id", "ownerId"]),
  workspaces: createReadableCollection("workspaces", ["_id", "orgId"]),
  memberships: createReadableCollection("memberships", ["_id", "workspaceId", "userId"]),
  userById: async userId => createReadableCollection<{ _id: string; displayName: string }>("users").findOne({ _id: userId })
});

const assertReplicaSet = async (): Promise<void> => {
  const topology = await runMongoCommand({ hello: 1 });
  assert.ok(typeof topology.setName === "string", "acceptance integration requires a MongoDB replica set");
};

const measureOrganizationProfileAtTargetVolume = async (testCase: string): Promise<void> => {
  await assertReplicaSet();
  await createTestIndex("workspaces", { orgId: 1, deletedAt: 1, status: 1 });
  await createTestIndex("memberships", { workspaceId: 1, userId: 1, status: 1, deletedAt: 1 });

  const orgId = generateTestId();
  const ownerId = generateTestId();
  const memberId = generateTestId();
  const workspaceDocs: Record<string, unknown>[] = [];
  const membershipDocs: Record<string, unknown>[] = [];
  const memberDocs: Record<string, unknown>[] = [];
  for (let workspaceNumber = 0; workspaceNumber < 100; workspaceNumber += 1) {
    const workspaceId = generateTestId();
    workspaceDocs.push({ _id: workspaceId, orgId, name: `Workspace ${String(workspaceNumber + 1)}`, status: "ACTIVE" });
    for (let memberNumber = 0; memberNumber < 200; memberNumber += 1) {
      const userId = memberNumber === 0 && workspaceNumber === 0 ? memberId : generateTestId();
      membershipDocs.push({
        _id: generateTestId(),
        workspaceId,
        userId,
        status: "ACTIVE"
      });
      memberDocs.push({ _id: userId });
    }
  }

  assert.equal(workspaceDocs.length, 100);
  assert.equal(membershipDocs.length, 20_000);
  assert.equal(memberDocs.length, 20_000);
  await insertTestDocuments("organizations", [{
    _id: orgId,
    name: "Acme Design",
    ownerId,
    createdAt: new Date("2026-10-06T12:00:00.000Z"),
    status: "ACTIVE"
  }]);
  await insertTestDocuments("workspaces", workspaceDocs);
  await insertTestDocuments("memberships", membershipDocs);
  await insertTestDocuments("users", [{ _id: ownerId, displayName: "Priya" }, ...memberDocs]);

  const repository = createProfileRepository();
  const app = express();
  app.use(createWorkspaceRoutes({ repository, resolveWorkspacePrincipal: () => ({ userId: ownerId }), logger }));
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const profileUrl = `http://127.0.0.1:${String(address.port)}/workspace/organization-profile/${orgId}`;
    const durations: number[] = [];
    for (let openNumber = 0; openNumber < 200; openNumber += 1) {
      const startedAt = performance.now();
      const response = await fetch(profileUrl);
      assert.equal(response.status, 200);
      const body: unknown = await response.json();
      assert.ok(typeof body === "object" && body !== null && "name" in body);
      assert.ok("workspaces" in body && Array.isArray(body.workspaces));
      assert.equal(body.workspaces.length, 100, "owner response must contain every organization workspace");
      assert.ok(body.workspaces.every((workspace: unknown) =>
        typeof workspace === "object" && workspace !== null &&
        "id" in workspace && typeof workspace.id === "string" &&
        "name" in workspace && typeof workspace.name === "string" &&
        "state" in workspace && (workspace.state === "ACTIVE" || workspace.state === "ARCHIVED") &&
        "activeMemberCount" in workspace && typeof workspace.activeMemberCount === "number"
      ), "every owner workspace row must contain its identity, name, state, and active-member count");
      durations.push(performance.now() - startedAt);
    }

    assert.equal(durations.length, 200);
    durations.sort((left, right) => left - right);
    const p95Milliseconds = durations[Math.ceil(durations.length * 0.95) - 1];
    assert.ok(p95Milliseconds !== undefined);

    const workspaceExplainPlan = await getExplainPlan("workspaces", {
      status: { $ne: "DELETED" },
      deletedAt: { $exists: false },
      orgId
    });
    assert.ok(workspaceExplainPlan.includes("IXSCAN"), "workspace query should use an index");
    assert.ok(!workspaceExplainPlan.includes("COLLSCAN"), "workspace query should not scan the collection");
    assert.ok(
      workspaceExplainPlan.includes("orgId_1_deletedAt_1_status_1"),
      "workspace query should use the organization lookup index"
    );

    const membershipExplainPlan = await getExplainPlan("memberships", {
      workspaceId: { $in: workspaceDocs.map(({ _id }) => toMongoObjectId(String(_id))) },
      status: "ACTIVE",
      deletedAt: { $exists: false }
    });
    const membershipExplain = membershipExplainPlan;
    assert.ok(membershipExplain.includes("IXSCAN"), "membership query should use an index");
    assert.ok(!membershipExplain.includes("COLLSCAN"), "membership query should not scan the collection");
    assert.ok(
      membershipExplain.includes("workspaceId_1_userId_1_status_1_deletedAt_1"),
      "membership count query should use the workspace and user index"
    );

    const measuredAt = new Date(systemClock.now()).toISOString();
    console.info(
      `${testCase} measuredAt=${measuredAt}; p95=${p95Milliseconds.toFixed(2)}ms; requests=200; ` +
      "workspaces=100; membersPerWorkspace=200; memberships=20000; " +
      "workspaceIndex=orgId_1_deletedAt_1_status_1; " +
      "membershipIndex=workspaceId_1_userId_1_status_1_deletedAt_1"
    );
    assert.ok(p95Milliseconds <= 700, `expected p95 at or below 700 ms, received ${p95Milliseconds.toFixed(2)} ms`);
    assert.ok(p95Milliseconds < 700, `AC-5 requires p95 below 700 ms, received ${p95Milliseconds.toFixed(2)} ms`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
};

runWithMongo("AC-1: organization owner receives all workspaces, states, and active counts", async () => {
  await assertReplicaSet();
  const orgId = generateTestId();
  const workspaceId = generateTestId();
  const opsWorkspaceId = generateTestId();
  const memberId = generateTestId();
  const ownerId = generateTestId();
  const createdAt = new Date("2026-10-06T12:00:00.000Z");

  await insertTestDocuments("organizations", [{ _id: orgId, name: "Acme Design", ownerId, createdAt, status: "ACTIVE" }]);
  await insertTestDocuments("workspaces", [
    { _id: workspaceId, orgId, name: "Studio", status: "ACTIVE" },
    { _id: opsWorkspaceId, orgId, name: "Ops", status: "ACTIVE" }
  ]);
  await insertTestDocuments("memberships", [
    { _id: generateTestId(), workspaceId, userId: memberId, status: "ACTIVE" },
    { _id: generateTestId(), workspaceId, userId: ownerId, status: "ACTIVE" },
    { _id: generateTestId(), workspaceId: opsWorkspaceId, userId: generateTestId(), status: "ACTIVE" }
  ]);
  await insertTestDocuments("users", [
    { _id: ownerId, displayName: "Priya" },
    { _id: memberId, displayName: "Organization member" }
  ]);

  const profile = await createProfileRepository().findOrganizationProfile({ userId: ownerId }, orgId);
  assert.ok(profile);
  assert.equal(profile.name, "Acme Design");
  assert.equal(profile.ownerDisplayName, "Priya");
  assert.equal(profile.createdAt.toISOString(), createdAt.toISOString());
  assert.deepEqual(profile.state, { kind: "ACTIVE" });
  assert.deepEqual(profile.workspaces, [
    { id: workspaceId, name: "Studio", state: "ACTIVE", activeMemberCount: 2 },
    { id: opsWorkspaceId, name: "Ops", state: "ACTIVE", activeMemberCount: 1 }
  ]);
});

runWithMongo("organization profile preserves the scheduled organization state", async () => {
  await assertReplicaSet();
  const orgId = generateTestId();
  const workspaceId = generateTestId();
  const memberId = generateTestId();
  const ownerId = generateTestId();
  const effectiveOn = new Date("2026-11-20T00:00:00.000Z");

  await insertTestDocuments("organizations", [{
    _id: orgId,
    name: "Acme Design",
    ownerId,
    createdAt: new Date("2026-10-06T12:00:00.000Z"),
    status: "DELETION_SCHEDULED",
    deletionScheduledFor: effectiveOn
  }]);
  await insertTestDocuments("workspaces", [{ _id: workspaceId, orgId, name: "Studio", status: "ACTIVE" }]);
  await insertTestDocuments("memberships", [{ _id: generateTestId(), workspaceId, userId: memberId, status: "ACTIVE" }]);

  const profile = await createProfileRepository().findOrganizationProfile({ userId: memberId }, orgId);
  assert.ok(profile);
  assert.deepEqual(profile.state, { kind: "DELETION_SCHEDULED", effectiveOn });
});

runWithMongo("AC-3: archived workspace remains visible and suspended memberships are not counted", async () => {
  await assertReplicaSet();
  const orgId = generateTestId();
  const ownerId = generateTestId();
  const archivedWorkspaceId = generateTestId();
  const studioWorkspaceId = generateTestId();
  const activeMemberIds = Array.from({ length: 10 }, () => generateTestId());
  const suspendedMemberIds = Array.from({ length: 2 }, () => generateTestId());

  await insertTestDocuments("organizations", [{ _id: orgId, name: "Acme Design", ownerId, createdAt: new Date("2026-01-01T00:00:00.000Z"), status: "ACTIVE" }]);
  await insertTestDocuments("workspaces", [
    { _id: archivedWorkspaceId, orgId, name: "Old site", status: "ARCHIVED" },
    { _id: studioWorkspaceId, orgId, name: "Studio", status: "ACTIVE" }
  ]);
  await insertTestDocuments("memberships", [
    ...activeMemberIds.map(userId => ({ _id: generateTestId(), workspaceId: studioWorkspaceId, userId, status: "ACTIVE" })),
    ...suspendedMemberIds.map(userId => ({ _id: generateTestId(), workspaceId: studioWorkspaceId, userId, status: "SUSPENDED" }))
  ]);

  const profile = await createProfileRepository().findOrganizationProfile({ userId: ownerId }, orgId);
  assert.ok(profile);
  assert.deepEqual(profile.workspaces, [
    { id: archivedWorkspaceId, name: "Old site", state: "ARCHIVED", activeMemberCount: 0 },
    { id: studioWorkspaceId, name: "Studio", state: "ACTIVE", activeMemberCount: 10 }
  ]);
});

runWithMongo("TC-01.1.02-S2-AC4: owner workspace list performance", async () => {
  await measureOrganizationProfileAtTargetVolume("TC-01.1.02-S2-AC4");
});

runWithMongo("AC-2: a member receives only the workspace with active membership", async () => {
  await assertReplicaSet();
  const orgId = generateTestId();
  const ownerId = generateTestId();
  const memberId = generateTestId();
  const studioId = generateTestId();
  const opsId = generateTestId();
  await insertTestDocuments("organizations", [{ _id: orgId, name: "Acme Design", ownerId, createdAt: new Date("2026-01-01T00:00:00.000Z"), status: "ACTIVE" }]);
  await insertTestDocuments("workspaces", [
    { _id: studioId, orgId, name: "Studio", status: "ACTIVE" },
    { _id: opsId, orgId, name: "Ops", status: "ACTIVE" }
  ]);
  await insertTestDocuments("memberships", [{ _id: generateTestId(), workspaceId: studioId, userId: memberId, status: "ACTIVE" }]);
  const profile = await createProfileRepository().findOrganizationProfile({ userId: memberId }, orgId);
  assert.ok(profile);
  assert.deepEqual(profile.workspaces, [{ id: studioId, name: "Studio", state: "ACTIVE", activeMemberCount: 1 }]);
  assert.equal(JSON.stringify(profile).includes(opsId), false);
});
