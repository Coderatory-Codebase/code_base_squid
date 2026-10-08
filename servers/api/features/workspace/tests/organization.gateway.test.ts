import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  buildOrganizationQueryForPrincipal,
  createOrganizationGateway,
  type OrganizationCondition,
  type OrganizationQuery,
  type QueryPlanExplanation,
  type QueryPlanValue,
  isQueryPlanNode
} from "../db/organization.gateway.js";
import { createMongoDbIntegration } from "../../../integrations/mongodb/index.js";
import { OrganizationModel } from "../integrations/organization.model.js";
void test("gateway scopes by ownership or membership and excludes deleted organizations", async (): Promise<void> => {
  const calls: string[] = [];
  let capturedDeletedAtFilter: null | undefined;
  let capturedOrFilter: readonly OrganizationCondition[] | undefined;
  let capturedOffset: number | undefined;
  let capturedLimit: number | undefined;
  let capturedProjection: Readonly<Record<string, 1>> | undefined;

  const fakeQuery: OrganizationQuery = {
    where(path: string) {
      calls.push(`where:${path}`);
      return fakeQuery;
    },
    equals(value: null) {
      calls.push("equals");
      capturedDeletedAtFilter = value;
      return fakeQuery;
    },
    or(conditions: readonly OrganizationCondition[]) {
      calls.push("or");
      capturedOrFilter = conditions;
      return fakeQuery;
    },
    select(projection) {
      capturedProjection = projection;
      return fakeQuery;
    },
    sort() {
      calls.push("sort");
      return fakeQuery;
    },
    skip(offset) {
      capturedOffset = offset;
      return fakeQuery;
    },
    limit(count) {
      capturedLimit = count;
      return fakeQuery;
    },
    lean: () => Promise.resolve([]),
    explain: (): Promise<QueryPlanExplanation> => Promise.resolve({})
  };
  const model = { find: () => fakeQuery };
  const gateway = createOrganizationGateway({ model });

  await gateway.listOrganizationsForPrincipal({
    userId: "user-1",
    workspaceIds: ["ws-a", "ws-b"]
  }, 100);

  assert.equal(capturedDeletedAtFilter, null);
  assert.deepEqual(capturedOrFilter, [
    { ownerId: "user-1" },
    { workspaceIds: { $in: ["ws-a", "ws-b"] } },
    { members: { $elemMatch: { userId: "user-1" } } }
  ]);
  const deletedAtIndex = calls.indexOf("where:deletedAt");
  const orIndex = calls.indexOf("or");
  assert.ok(deletedAtIndex < orIndex);
  assert.equal(calls.includes("where:workspaceIds"), false);
  assert.equal(capturedOffset, 100);
  assert.equal(capturedLimit, 51);
  assert.deepEqual(capturedProjection, { _id: 1, name: 1, archivedAt: 1 });
});

void test("persists organization operations and enforces tenant isolation in last-used order", async (context): Promise<void> => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const mongoIntegration = createMongoDbIntegration({
    uri: mongo.getUri(),
    logger: {
      info: (): void => undefined,
      warn: (): void => undefined,
      error: (): void => undefined
    }
  });
  context.after(async () => {
    await mongoIntegration.disconnect();
    await mongo.stop();
  });

  await mongoIntegration.connect();
  await OrganizationModel.init();
  const lastUsedAt = new Date("2026-09-30T12:00:00.000Z");
  await OrganizationModel.create({
    _id: "000000000000000000000001",
    name: "Owned organization",
    ownerId: "current-user",
    workspaceIds: [],
    lastUsedAt: new Date("2026-09-29T12:00:00.000Z")
  });
  await OrganizationModel.create({
    _id: "000000000000000000000002",
    name: "Member organization",
    ownerId: "another-user",
    workspaceIds: ["workspace-current"],
    lastUsedAt
  });
  await OrganizationModel.insertMany(
    Array.from({ length: 498 }, (_, index) => ({
      _id: String(index + 2_000).padStart(24, "0"),
      name: `Member organization ${String(index).padStart(2, "0")}`,
      ownerId: `member-owner-${String(index)}`,
      workspaceIds: [],
      members: [{
        userId: "current-user",
        email: "current-user@example.test",
        role: "member",
        joinedAt: new Date("2026-09-28T12:00:00.000Z")
      }],
      lastUsedAt: new Date("2026-09-28T12:00:00.000Z"),
      deletedAt: null
    }))
  );
  await OrganizationModel.insertMany(
    Array.from({ length: 50 }, (_, index) => ({
      _id: String(index + 4_000).padStart(24, "0"),
      name: `Exactly fifty organization ${String(index).padStart(2, "0")}`,
      ownerId: `exact-owner-${String(index)}`,
      workspaceIds: ["workspace-exactly-fifty"],
      lastUsedAt: new Date("2026-09-27T12:00:00.000Z"),
      deletedAt: null
    }))
  );
  await OrganizationModel.create({
    name: "Other workspace organization",
    ownerId: "other-user",
    workspaceIds: ["workspace-other"]
  });

  await OrganizationModel.insertMany(
    Array.from({ length: 64 }, (_, index) => ({
      _id: String(index + 1_000).padStart(24, "0"),
      name: `Unrelated organization ${String(index)}`,
      ownerId: `unrelated-user-${String(index)}`,
      workspaceIds: [`workspace-unrelated-${String(index)}`],
      lastUsedAt: new Date(),
      deletedAt: null
    }))
  );
  const principal = {
    userId: "current-user",
    workspaceIds: ["workspace-current"]
  } as const;
  const gateway = createOrganizationGateway();
  const created = await gateway.createOrganizationForPrincipal(
    { userId: "created-user", workspaceIds: [] },
    "Gateway-created organization"
  );
  assert.equal(created.name, "Gateway-created organization");
  assert.equal(created.ownerId, "created-user");

  await gateway.upsertPreviewOrganization("000000000000000000000003", {
    name: "Preview fixture organization",
    ownerId: "fixture-owner",
    workspaceIds: [],
    lastUsedAt,
    deletedAt: null
  });
  const fixtures = await gateway.listOrganizationsForPrincipal({ userId: "fixture-owner", workspaceIds: [] }, 0);
  assert.equal(fixtures.organizations[0]?.name, "Preview fixture organization");

  const firstPage = await gateway.listOrganizationsForPrincipal(principal, 0);

  assert.equal(firstPage.organizations.length, 50);
  assert.equal(firstPage.nextOffset, 50);
  assert.deepEqual(firstPage.organizations.slice(0, 2).map(({ _id }) => String(_id)), [
    "000000000000000000000002",
    "000000000000000000000001"
  ]);
  assert.ok(firstPage.organizations.every(({ name }) => name !== "Unrelated organization"));
  const secondPage = await gateway.listOrganizationsForPrincipal(principal, 50);
  assert.equal(secondPage.organizations.length, 50);
  assert.equal(secondPage.nextOffset, 100);
  assert.equal(new Set([...firstPage.organizations, ...secondPage.organizations].map(({ _id }) => String(_id))).size, 100);

  const exactFiftyPage = await gateway.listOrganizationsForPrincipal({
    userId: "exact-fifty-user",
    workspaceIds: ["workspace-exactly-fifty"]
  }, 0);
  assert.equal(exactFiftyPage.organizations.length, 50);
  assert.equal(exactFiftyPage.nextOffset, null, "exactly 50 results must not advertise another page");

  const durations: number[] = [];
  for (let index = 0; index < 200; index += 1) {
    const startedAt = performance.now();
    await gateway.listOrganizationsForPrincipal(principal, 0);
    durations.push(performance.now() - startedAt);
  }
  durations.sort((left, right) => left - right);
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  assert.ok(p95 !== undefined && p95 < 700, `first-page query p95 for 500 organizations was ${String(p95)} ms.`);

  const explanation = await buildOrganizationQueryForPrincipal(principal).explain("queryPlanner");
  const winningPlanUsesMembershipIndex = (value: QueryPlanValue | undefined): boolean => {
    if (Array.isArray(value)) {
      return value.some(winningPlanUsesMembershipIndex);
    }
    if (value === null || value === undefined || !isQueryPlanNode(value)) {
      return false;
    }

    return (
      (value.stage === "IXSCAN" && (value.indexName === "workspace_list_page" || value.indexName === "member_list_page")) ||
      Object.values(value).some(winningPlanUsesMembershipIndex)
    );
  };

  assert.ok(
    winningPlanUsesMembershipIndex(explanation.queryPlanner?.winningPlan),
    "the query planner should use an organization membership list-page index"
  );
});
