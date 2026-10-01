import test from "node:test";
import assert from "node:assert/strict";
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

void test("gateway applies deletedAt exclusion and workspace scope last", async (): Promise<void> => {
  const calls: string[] = [];
  let capturedDeletedAtFilter: null | undefined;
  let capturedOrFilter: readonly OrganizationCondition[] | undefined;
  let capturedWorkspaceFilter: readonly string[] | undefined;

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
    in(values: readonly string[]) {
      calls.push("in");
      capturedWorkspaceFilter = values;
      return fakeQuery;
    },
    sort() {
      calls.push("sort");
      return fakeQuery;
    },
    lean: (): Promise<OrganizationDocument[]> => Promise.resolve([]),
    explain: (): Promise<QueryPlanExplanation> => Promise.resolve({}),
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
  assert.deepEqual(capturedWorkspaceFilter, ["ws-a", "ws-b"]);

  const deletedAtIndex = calls.indexOf("where:deletedAt");
  const orIndex = calls.indexOf("or");
  const workspaceScopeIndex = calls.indexOf("where:workspaceIds");

  assert.ok(deletedAtIndex < workspaceScopeIndex);
  assert.ok(orIndex < workspaceScopeIndex);
});

void test("returns no organizations belonging to another workspace", async (context): Promise<void> => {
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
  await OrganizationModel.create({
    name: "Other workspace organization",
    ownerId: "other-user",
    workspaceIds: ["workspace-other"]
  });

  await OrganizationModel.insertMany(
    Array.from({ length: 64 }, (_, index) => ({
      _id: String(index).padStart(24, "0"),
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
  const organizations = await createOrganizationGateway().listOrganizationsForPrincipal(principal);

  assert.deepEqual(organizations, []);

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
