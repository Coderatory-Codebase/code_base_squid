import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { systemClock } from "@workspace/kernel";
import type { LogContext, Logger } from "@workspace/logging";
import {
  buildOrganizationOwnerSettingsQueryFor,
  buildOrganizationSettingsQueryFor,
  explainOrganizationOwnerSettingsQueryFor,
  explainOrganizationSettingsQueryFor,
  settingsOf
} from "../db/organization-setting.gateway.js";
import { MongoMemoryReplSet, MongoMemoryServer } from "mongodb-memory-server";
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
      lastUsedAt: new Date(systemClock.now()),
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
void test("TC-01.1.03-S1-T4 emits a labelled failure signal when an organization settings read fails", async (context): Promise<void> => {
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
    name: "Invalid settings organization",
    ownerId: "organization-owner",
    workspaceIds: ["workspace-failed-read"],
    settings: { timeZone: "Not/A_Time_Zone" }
  });

  const signals: { level: "info" | "error"; message: string; context: LogContext | undefined }[] = [];
  const logger: Logger = {
    info: (message, context): void => { signals.push({ level: "info", message, context }); },
    warn: (): void => undefined,
    error: (message, context): void => { signals.push({ level: "error", message, context }); }
  };

  await assert.rejects(
    settingsOf({ userId: "workspace-member", workspaceIds: ["workspace-failed-read"] }, logger),
    /invalid stored value/
  );

  assert.equal(signals.length, 1);
  const signal = signals[0];
  assert.ok(signal);
  assert.ok(signal.context);
  assert.equal(signal.level, "error");
  assert.equal(signal.message, "Organization settings read failed.");
  assert.equal(signal.context.module, "workspace");
  assert.equal(signal.context.feature, "organization-settings");
  assert.equal(signal.context.operation, "read");
  assert.deepEqual(signal.context.workspaceIds, ["workspace-failed-read"]);
  assert.equal(signal.context.outcome, "failure");
  assert.equal(typeof signal.context.durationMs, "number");
  assert.ok(Number(signal.context.durationMs) >= 0);
  assert.match(String(signal.context.reason), /invalid stored value/);
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

void test("TC-01.1.03-S1-T3 permission refusal: a principal without workspace access reads no settings", async (context): Promise<void> => {
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
    name: "Restricted organization",
    ownerId: "organization-owner",
    workspaceIds: ["workspace-restricted"],
    settings: { timeZone: "Europe/London" }
  });

  const principalWithoutWorkspaceAccess = {
    userId: "unassigned-user",
    workspaceIds: []
  } as const;
  const logger: Logger = {
    info: (): void => undefined,
    warn: (): void => undefined,
    error: (): void => undefined
  };

  assert.deepEqual(await settingsOf(principalWithoutWorkspaceAccess, logger), []);
  assert.equal(
    await OrganizationModel.countDocuments({ name: "Restricted organization" }),
    1,
    "a refused settings read must not remove or mutate the organization"
  );
});
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

  await OrganizationModel.create({
    name: "Owned before workspace setup",
    ownerId: principal.userId,
    workspaceIds: [],
    settings: {}
  });
  const settings = await settingsOf(principal, logger);
  const settingOrganization = await OrganizationModel.findOne({ name: "Acme Design" })
    .select({ _id: 1, version: 1 })
    .lean()
    .exec();
  assert.ok(settingOrganization);
  assert.deepEqual(settings.find(({ name }) => name === "Acme Design"), {
    organizationId: String(settingOrganization._id),
    name: "Acme Design",
    version: 1,
    canUpdate: false,
    timeZone: { value: "Europe/London", source: "owner" },
    weekStart: { value: "Monday", source: "default" },
    dateFormat: { value: "DD/MM/YYYY", source: "default" },
    workspaceSetupRule: { value: "any member", source: "default" }
  });
  const ownedSetting = settings.find(({ name }) => name === "Owned before workspace setup");
  assert.ok(ownedSetting);
  assert.equal(ownedSetting.canUpdate, true);
  assert.equal(ownedSetting.workspaceSetupRule.value, "any member");
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
  const softDeletedOrganization = await OrganizationModel.findOne({ name: "Deleted current workspace organization" })
    .lean()
    .exec();
  assert.ok(softDeletedOrganization);
  assert.equal(softDeletedOrganization.deletedAt?.toISOString(), "2026-10-06T00:00:00.000Z");
  assert.equal(
    softDeletedOrganization.settings.timeZone,
    "Asia/Karachi",
    "soft deletion hides the organization from live settings reads but retains its settings with the organization"
  );

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

  const settingsQuery = buildOrganizationSettingsQueryFor(principal);
  const settingsQueryFilter = settingsQuery.getFilter();
  assert.deepEqual(Object.keys(settingsQueryFilter), ["deletedAt", "workspaceIds"]);
  assert.deepEqual(settingsQueryFilter, {
    deletedAt: null,
    workspaceIds: { $in: [...principal.workspaceIds] }
  });
  assert.deepEqual(settingsQuery.projection(), { settings: 1, _id: 1, ownerId: 1, version: 1, name: 1 });
  const ownerSettingsQuery = buildOrganizationOwnerSettingsQueryFor(principal);
  assert.deepEqual(ownerSettingsQuery.getFilter(), { deletedAt: null, ownerId: principal.userId });
  assert.deepEqual(ownerSettingsQuery.projection(), { settings: 1, _id: 1, ownerId: 1, version: 1, name: 1 });

  assert.equal(OrganizationModel.collection.name, "organizations");

  const indexes = await OrganizationModel.collection.indexes();
  const settingsIndex = indexes.find(({ name }) => name === "workspace_settings_live_cover");
  assert.ok(settingsIndex);
  assert.deepEqual(settingsIndex.key, { workspaceIds: 1, settings: 1, _id: 1, ownerId: 1, version: 1, name: 1 });
  assert.deepEqual(settingsIndex.partialFilterExpression, { deletedAt: null });
  const ownerSettingsIndex = indexes.find(({ name }) => name === "owner_settings_live_cover");
  assert.ok(ownerSettingsIndex);
  assert.deepEqual(ownerSettingsIndex.key, { ownerId: 1, settings: 1, _id: 1, version: 1, name: 1 });
  assert.deepEqual(ownerSettingsIndex.partialFilterExpression, { deletedAt: null });

  const settingsExplanation = await explainOrganizationSettingsQueryFor(principal);
  const settingsWinningPlan = settingsExplanation.queryPlanner?.winningPlan;

  assert.ok(
    planContainsIndex(settingsWinningPlan, "workspace_settings_live_cover"),
    `the settings query planner should use the workspace settings covering index: ${JSON.stringify(settingsWinningPlan)}`
  );
  assert.equal(
    planContainsStage(settingsWinningPlan, "FETCH"),
    false,
    `the settings query should be covered without fetching organization documents: ${JSON.stringify(settingsWinningPlan)}`
  );
  const ownerSettingsExplanation = await explainOrganizationOwnerSettingsQueryFor(principal);
  const ownerSettingsWinningPlan = ownerSettingsExplanation.queryPlanner?.winningPlan;
  assert.ok(
    planContainsIndex(ownerSettingsWinningPlan, "owner_settings_live_cover"),
    `the owner settings query planner should use the owner covering index: ${JSON.stringify(ownerSettingsWinningPlan)}`
  );
  assert.equal(
    planContainsStage(ownerSettingsWinningPlan, "FETCH"),
    false,
    `the owner settings query should be covered without fetching organization documents: ${JSON.stringify(ownerSettingsWinningPlan)}`
  );

  await OrganizationModel.deleteOne({ name: "Acme Design" });
  await OrganizationModel.deleteOne({ name: "Owned before workspace setup" });
  assert.deepEqual(
    await settingsOf(principal, logger),
    [],
    "a principal scoped to the current workspace gets no rows when only other-workspace organizations remain"
  );
});
