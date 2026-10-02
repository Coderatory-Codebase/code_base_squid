import test from "node:test";
import assert from "node:assert/strict";
import {
  buildOrganizationSettingsQueryFor,
  explainOrganizationSettingsQueryFor,
  settingsOf
} from "../db/organization-setting.gateway.js";
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

void test("returns live settings only for principal workspaces with a covered query", async (context): Promise<void> => {
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
  await OrganizationModel.create([
    {
      name: "Other workspace organization",
      ownerId: "other-user",
      workspaceIds: ["workspace-other"],
      settings: { timeZone: "America/New_York" }
    },
    {
      name: "Acme Design",
      ownerId: "current-user",
      workspaceIds: ["workspace-current"],
      settings: { timeZone: "Europe/London" }
    },
    {
      name: "Deleted current workspace organization",
      ownerId: "current-user",
      workspaceIds: ["workspace-current"],
      settings: { timeZone: "Asia/Karachi" },
      deletedAt: new Date()
    }
  ]);

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

  assert.equal(organizations.length, 1);
  assert.equal(organizations[0]?.name, "Acme Design");

  const settings = await settingsOf(principal);
  assert.deepEqual(settings, [
    {
      timeZone: { value: "Europe/London", source: "owner" },
      weekStart: { value: "Monday", source: "default" },
      dateFormat: { value: "DD/MM/YYYY", source: "default" },
      workspaceSetupRule: { value: "any member", source: "default" }
    }
  ]);
  assert.equal(
    await OrganizationModel.countDocuments({ name: "Deleted current workspace organization" }),
    1,
    "the settings read excludes soft-deleted rows without purging retained organization data"
  );

  const explanation = await buildOrganizationQueryForPrincipal(principal).explain("queryPlanner");
  const planContainsIndex = (
    value: QueryPlanValue | undefined,
    expectedIndexName: string
  ): boolean => {
    if (Array.isArray(value)) {
      const children = value as readonly QueryPlanValue[];
      return children.some((child) => planContainsIndex(child, expectedIndexName));
    }
    if (value === null || value === undefined || !isQueryPlanNode(value)) {
      return false;
    }

    return (
      (value.stage === "IXSCAN" && value.indexName === expectedIndexName) ||
      Object.values(value).some((child) => planContainsIndex(child, expectedIndexName))
    );
  };

  const planContainsStage = (
    value: QueryPlanValue | undefined,
    expectedStage: string
  ): boolean => {
    if (Array.isArray(value)) {
      const children = value as readonly QueryPlanValue[];
      return children.some((child) => planContainsStage(child, expectedStage));
    }
    if (value === null || value === undefined || !isQueryPlanNode(value)) {
      return false;
    }

    return (
      value.stage === expectedStage ||
      Object.values(value).some((child) => planContainsStage(child, expectedStage))
    );
  };

  assert.ok(
    planContainsIndex(explanation.queryPlanner?.winningPlan, "workspaceIds_1") ||
      planContainsIndex(explanation.queryPlanner?.winningPlan, "workspace_settings_live_cover"),
    "the organization query planner should use an index beginning with workspaceIds"
  );
  const settingsQuery = buildOrganizationSettingsQueryFor(principal);
  const settingsQueryFilter = settingsQuery.getFilter();
  assert.deepEqual(Object.keys(settingsQueryFilter), ["deletedAt", "workspaceIds"]);
  assert.deepEqual(settingsQueryFilter, {
    deletedAt: null,
    workspaceIds: { $in: [...principal.workspaceIds] }
  });
  assert.deepEqual(settingsQuery.projection(), { settings: 1, _id: 0 });

  assert.equal(OrganizationModel.collection.name, "organizations");

  const indexes = await OrganizationModel.collection.indexes();
  const settingsIndex = indexes.find(({ name }) => name === "workspace_settings_live_cover");
  assert.ok(settingsIndex);
  assert.deepEqual(settingsIndex.key, { workspaceIds: 1, settings: 1 });
  assert.deepEqual(settingsIndex.partialFilterExpression, { deletedAt: null });

  const settingsExplanation = await explainOrganizationSettingsQueryFor(principal);
  const settingsWinningPlan = settingsExplanation.queryPlanner?.winningPlan;

  assert.ok(
    planContainsIndex(settingsWinningPlan, "workspace_settings_live_cover"),
    "the settings query planner should use the settings covering index"
  );
  assert.equal(
    planContainsStage(settingsWinningPlan, "FETCH"),
    false,
    `the settings query should be covered without fetching organization documents: ${JSON.stringify(settingsWinningPlan)}`
  );
});
