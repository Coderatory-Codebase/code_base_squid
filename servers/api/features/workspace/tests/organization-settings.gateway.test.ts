import test from "node:test";
import assert from "node:assert/strict";
import type { LogContext, Logger } from "@workspace/logging";
import {
  buildOrganizationQueryForPrincipal,
  createOrganizationGateway,
  type QueryPlanValue,
  isQueryPlanNode
} from "../db/organization.gateway.js";
import {
  buildOrganizationSettingsQueryFor,
  explainOrganizationSettingsQueryFor,
  settingsOf
} from "../db/organization-setting.gateway.js";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createMongoDbIntegration } from "../../../integrations/mongodb/index.js";
import { OrganizationModel } from "../integrations/organization.model.js";

void test("a workspace member sees the owner's setting and defaults against a replica set", async (context): Promise<void> => {
  const mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [{ launchTimeout: 60_000 }]
  });
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
      ownerId: "organization-owner",
      workspaceIds: ["workspace-current"],
      settings: { timeZone: "Europe/London" }
    },
    {
      name: "Deleted current workspace organization",
      ownerId: "current-user",
      workspaceIds: ["workspace-current"],
      settings: { timeZone: "Asia/Karachi" },
      deletedAt: new Date("2026-10-06T00:00:00.000Z")
    }
  ]);

  await OrganizationModel.insertMany(
    Array.from({ length: 64 }, (_, index) => ({
      _id: String(index).padStart(24, "0"),
      name: `Unrelated organization ${String(index)}`,
      ownerId: `unrelated-user-${String(index)}`,
      workspaceIds: [`workspace-unrelated-${String(index)}`],
      lastUsedAt: new Date("2026-10-06T00:00:00.000Z"),
      deletedAt: null
    }))
  );
  const principal = {
    userId: "workspace-member",
    workspaceIds: ["workspace-current"]
  } as const;
  const organizations = await createOrganizationGateway().listOrganizationsForPrincipal(principal, 0);
  const signals: { level: "info" | "error"; message: string; context: LogContext | undefined }[] = [];
  const logger: Logger = {
    info: (message, context) => { signals.push({ level: "info", message, context }); },
    warn: (): void => undefined,
    error: (message, context) => { signals.push({ level: "error", message, context }); }
  };

  assert.equal(organizations.organizations.length, 1);
  assert.equal(organizations.organizations[0]?.name, "Acme Design");

  const settings = await settingsOf(principal, logger);
  const organization = await OrganizationModel.findOne({ name: "Acme Design" }).select({ _id: 1 }).lean().exec();
  assert.ok(organization);
  assert.deepEqual(settings, [
    {
      timeZone: { value: "Europe/London", source: "owner" },
      weekStart: { value: "Monday", source: "default" },
      dateFormat: { value: "DD/MM/YYYY", source: "default" },
      workspaceSetupRule: { value: "any member", source: "default" },
      organizationId: String(organization._id),
      name: "Acme Design",
      version: 1,
      canUpdate: false
    }
  ]);
  assert.equal(signals.length, 1);
  const signal = signals[0];
  assert.ok(signal);
  assert.ok(signal.context);
  assert.equal(signal.level, "info");
  assert.equal(signal.message, "Organization settings read completed.");
  assert.equal(signal.context.module, "workspace");
  assert.equal(signal.context.feature, "organization-settings");
  assert.deepEqual(signal.context.workspaceIds, ["workspace-current"]);
  assert.equal(signal.context.outcome, "success");
  assert.equal(typeof signal.context.durationMs, "number");
  assert.ok(Number(signal.context.durationMs) >= 0);
  assert.equal(
    await OrganizationModel.countDocuments({ name: "Deleted current workspace organization" }),
    1,
    "the settings read excludes soft-deleted rows without purging retained organization data"
  );

  const explanation = await buildOrganizationQueryForPrincipal(principal, 0).explain("queryPlanner");
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
      planContainsIndex(explanation.queryPlanner?.winningPlan, "workspace_settings_live_cover") ||
      planContainsIndex(explanation.queryPlanner?.winningPlan, "workspace_list_page"),
    "the organization query planner should use an index beginning with workspaceIds"
  );
  const settingsQuery = buildOrganizationSettingsQueryFor(principal);
  const settingsQueryFilter = settingsQuery.getFilter();
  assert.deepEqual(Object.keys(settingsQueryFilter), ["deletedAt", "workspaceIds"]);
  assert.deepEqual(settingsQueryFilter, {
    deletedAt: null,
    workspaceIds: { $in: [...principal.workspaceIds] }
  });
  assert.deepEqual(settingsQuery.projection(), { settings: 1, _id: 1, ownerId: 1, version: 1, name: 1 });

  assert.equal(OrganizationModel.collection.name, "organizations");

  const indexes = await OrganizationModel.collection.indexes();
  const settingsIndex = indexes.find(({ name }) => name === "workspace_settings_live_cover");
  assert.ok(settingsIndex);
  assert.deepEqual(settingsIndex.key, { workspaceIds: 1, settings: 1, _id: 1, ownerId: 1, version: 1, name: 1 });
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

  await OrganizationModel.deleteOne({ name: "Acme Design" });
  assert.deepEqual(
    await settingsOf(principal, logger),
    [],
    "a principal scoped to the current workspace gets no rows when only other-workspace organizations remain"
  );
});

void test("TC-01.1.03-S1-T1 scoping: a principal from another workspace reads zero organization settings", async (context): Promise<void> => {
  const mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [{ launchTimeout: 60_000 }]
  });
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
    name: "Acme Design",
    ownerId: "organization-owner",
    workspaceIds: ["workspace-acme"],
    settings: { timeZone: "Europe/London" }
  });

  const otherWorkspacePrincipal = {
    userId: "unrelated-member",
    workspaceIds: ["workspace-other"]
  } as const;
  const logger: Logger = {
    info: (): void => undefined,
    warn: (): void => undefined,
    error: (): void => undefined
  };

  assert.deepEqual(await settingsOf(otherWorkspacePrincipal, logger), []);
  assert.equal(await OrganizationModel.countDocuments({}), 1, "scoped reads do not remove the foreign organization");
});
