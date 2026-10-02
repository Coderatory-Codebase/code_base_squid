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
import type { OrganizationDocument } from "../integrations/organization.model.js";

void test("gateway scopes by ownership or membership and excludes deleted organizations", async (): Promise<void> => {
  const calls: string[] = [];
  let capturedDeletedAtFilter: null | undefined;
  let capturedOrFilter: readonly OrganizationCondition[] | undefined;

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
    sort() {
      calls.push("sort");
      return fakeQuery;
    },
    lean: (): Promise<OrganizationDocument[]> => Promise.resolve([]),
    explain: (): Promise<QueryPlanExplanation> => Promise.resolve({})
  };
  const model = { find: () => fakeQuery };
  const gateway = createOrganizationGateway({ model });

  await gateway.listOrganizationsForPrincipal({
    userId: "user-1",
    workspaceIds: ["ws-a", "ws-b"]
  });

  assert.equal(capturedDeletedAtFilter, null);
  assert.deepEqual(capturedOrFilter, [
    { ownerId: "user-1" },
    { workspaceIds: { $in: ["ws-a", "ws-b"] } }
  ]);
  const deletedAtIndex = calls.indexOf("where:deletedAt");
  const orIndex = calls.indexOf("or");
  assert.ok(deletedAtIndex < orIndex);
  assert.equal(calls.includes("where:workspaceIds"), false);
});

void test("enforces tenant isolation and lists owned and member organizations in last-used order", async (context): Promise<void> => {
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
    Array.from({ length: 48 }, (_, index) => ({
      _id: String(index + 2_000).padStart(24, "0"),
      name: `Member organization ${String(index).padStart(2, "0")}`,
      ownerId: `member-owner-${String(index)}`,
      workspaceIds: ["workspace-current"],
      lastUsedAt: new Date("2026-09-28T12:00:00.000Z"),
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
  const organizations = await gateway.listOrganizationsForPrincipal(principal);

  assert.equal(organizations.length, 50);
  assert.deepEqual(organizations.slice(0, 2).map(({ _id }) => String(_id)), [
    "000000000000000000000002",
    "000000000000000000000001"
  ]);
  assert.ok(organizations.every(({ ownerId, workspaceIds, deletedAt }) =>
    (ownerId === principal.userId || workspaceIds.includes("workspace-current")) && deletedAt === null
  ));

  const durations: number[] = [];
  for (let index = 0; index < 200; index += 1) {
    const startedAt = performance.now();
    await gateway.listOrganizationsForPrincipal(principal);
    durations.push(performance.now() - startedAt);
  }
  durations.sort((left, right) => left - right);
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  assert.ok(p95 !== undefined && p95 < 700, `50-organization query p95 was ${String(p95)} ms.`);

  const explanation = await buildOrganizationQueryForPrincipal(principal).explain("queryPlanner");
  const winningPlanUsesWorkspaceIndex = (value: QueryPlanValue | undefined): boolean => {
    if (Array.isArray(value)) {
      return value.some(winningPlanUsesWorkspaceIndex);
    }
    if (value === null || value === undefined || !isQueryPlanNode(value)) {
      return false;
    }

    return (
      (value.stage === "IXSCAN" && value.indexName === "workspaceIds_1") ||
      Object.values(value).some(winningPlanUsesWorkspaceIndex)
    );
  };

  assert.ok(
    winningPlanUsesWorkspaceIndex(explanation.queryPlanner?.winningPlan),
    "the query planner should use the workspaceIds_1 index"
  );
});
