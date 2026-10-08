import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Request } from "express";
import type { LogContext, Logger } from "@workspace/logging";
import { createApp, createServer } from "../../../bootstrap/index.js";
import { createMongoDbIntegration } from "../../../integrations/mongodb/index.js";
import type { ApiConfig } from "../../../types/index.js";
import { settingsOf } from "../db/organization-setting.gateway.js";
import { OrganizationModel } from "../integrations/organization.model.js";
import { WorkspaceModel } from "../integrations/workspace.model.js";

type MemoryMongoServer = Readonly<{
  getUri: () => string;
  stop: () => Promise<void>;
}>;

type MemoryMongoServerModule = Readonly<{
  MongoMemoryServer: Readonly<{
    create: (options: Readonly<{ instance: Readonly<{ launchTimeout: number }> }>) => Promise<MemoryMongoServer>;
  }>;
}>;

const signals: Array<{ message: string; context: LogContext | undefined }> = [];
const logger: Logger = {
  info: (message, context) => { signals.push({ message, context }); },
  warn: () => undefined,
  error: () => undefined
};
const config: ApiConfig = {
  environment: "test",
  host: "127.0.0.1",
  port: 0,
  webOrigin: "http://localhost:3000",
  logLevel: "silent"
};
const organizationId = "000000000000000000000061";
const organizationName = "Acme Design";
const initialSettings = {
  timeZone: "Europe/London",
  weekStart: "Monday" as const,
  dateFormat: "DD/MM/YYYY" as const,
  workspaceSetupRule: "any member" as const
};

const responseJson = async (response: unknown): Promise<unknown> => {
  if (typeof response !== "object" || response === null || !("json" in response)) {
    throw new Error("Expected an HTTP response with a JSON body.");
  }
  const json = response.json;
  if (typeof json !== "function") throw new Error("Expected an HTTP response with a JSON body.");
  return await (json as () => Promise<unknown>).call(response);
};

let mongo: MemoryMongoServer | undefined;
let database: ReturnType<typeof createMongoDbIntegration> | undefined;
let server: ReturnType<typeof createServer> | undefined;
let settingsUrl = "";

before(async () => {
  const importedModule: unknown = await import("mongodb-memory-server");
  const memoryServerFactory = (importedModule as MemoryMongoServerModule).MongoMemoryServer;
  const mongoServer = await memoryServerFactory.create({ instance: { launchTimeout: 60_000 } });
  mongo = mongoServer;
  const mongoDatabase = createMongoDbIntegration({ uri: mongoServer.getUri(), logger });
  database = mongoDatabase;
  await mongoDatabase.connect();
  await OrganizationModel.init();
  const apiServer = createServer({
    app: createApp({
      config,
      logger,
      resolvePrincipal: (request: Request) => {
        const token = (request as unknown as { headers: { authorization?: string } }).headers.authorization;
        if (token === "Bearer owner") return { userId: "owner-1", workspaceIds: ["workspace-1"] };
        if (token === "Bearer member") return { userId: "member-1", workspaceIds: ["workspace-1"] };
        return null;
      }
    }),
    config,
    logger
  });
  server = apiServer;
  await apiServer.start();
  const address = apiServer.raw.address();
  assert.ok(address && typeof address === "object");
  settingsUrl = `http://127.0.0.1:${String(address.port)}/organizations/${organizationId}/settings`;
});

after(async () => {
  if (server?.raw.listening) await server.stop();
  await database?.disconnect();
  await mongo?.stop();
});

const ownerHeaders = { authorization: "Bearer owner", "content-type": "application/json" };
const memberPrincipal = { userId: "member-1", workspaceIds: ["workspace-1"] } as const;
const workspaceSetupConsumerContract = (
  name: string,
  settings: Awaited<ReturnType<typeof settingsOf>>[number]
): Readonly<{ status: "allowed" } | { status: "forbidden"; message: string }> =>
  settings.workspaceSetupRule.value === "owner only" && !settings.canUpdate
    ? { status: "forbidden", message: `Only the owner of ${name} can set up workspaces` }
    : { status: "allowed" };

const resetOrganization = async (): Promise<void> => {
  signals.length = 0;
  await OrganizationModel.deleteMany({ _id: organizationId });
  await OrganizationModel.create({
    _id: organizationId,
    name: organizationName,
    ownerId: "owner-1",
    workspaceIds: ["workspace-1"],
    settings: initialSettings,
    version: 1,
    deletedAt: null,
    members: [{
      userId: "member-1",
      email: "member@example.test",
      role: "member",
      joinedAt: new Date("2026-10-01T00:00:00.000Z")
    }]
  });
};

void test("owner saves settings and receives the incremented version", async () => {
  await resetOrganization();
  const response = await fetch(settingsUrl, {
    method: "PATCH",
    headers: ownerHeaders,
    body: JSON.stringify({
      expectedVersion: 1,
      settings: { timeZone: "Asia/Karachi", dateFormat: "YYYY-MM-DD" }
    })
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await responseJson(response), {
    status: "updated",
    current: {
      settings: {
        timeZone: { value: "Asia/Karachi", source: "owner" },
        weekStart: { value: "Monday", source: "owner" },
        dateFormat: { value: "YYYY-MM-DD", source: "owner" },
        workspaceSetupRule: { value: "any member", source: "owner" }
      },
      version: 2
    }
  });
  const signal = signals.find(({ message, context }) =>
    message === "organization.request.signal" && context?.operation === "update"
  );
  assert.ok(signal);
  assert.ok(signal.context);
  assert.equal(signal.context.feature, "organization-settings");
  assert.equal(signal.context.outcome, "success");
  assert.equal(typeof signal.context.durationMs, "number");
});

void test("TC-01.1.03-S2-1 owner changes time zone and week start; owner and member reads see both persisted values", async () => {
  await resetOrganization();
  const response = await fetch(settingsUrl, {
    method: "PATCH",
    headers: ownerHeaders,
    body: JSON.stringify({
      expectedVersion: 1,
      settings: { timeZone: "America/New_York", weekStart: "Sunday" }
    })
  });
  assert.equal(response.status, 200);

  for (const principal of [
    { userId: "owner-1", workspaceIds: ["workspace-1"] },
    memberPrincipal
  ]) {
    const rows = await settingsOf(principal, logger);
    const setting = rows.find(({ organizationId: id }) => id === organizationId);
    assert.ok(setting);
    assert.deepEqual(setting.timeZone, { value: "America/New_York", source: "owner" });
    assert.deepEqual(setting.weekStart, { value: "Sunday", source: "owner" });
  }
});

void test("TC-01.1.03-S2-2 changing organization defaults does not mutate existing workspace data", async () => {
  await resetOrganization();
  const existingWorkspaceId = "existing-studio";
  await WorkspaceModel.create({
    _id: existingWorkspaceId,
    status: "ACTIVE",
    defaultRole: "member",
    members: [],
    appliedEventIds: [],
    notAppliedEvents: []
  });
  const existingWorkspaceBefore = await WorkspaceModel.findById(existingWorkspaceId).lean().exec();
  assert.ok(existingWorkspaceBefore);

  const response = await fetch(settingsUrl, {
    method: "PATCH",
    headers: ownerHeaders,
    body: JSON.stringify({ expectedVersion: 1, settings: { timeZone: "America/New_York" } })
  });
  assert.equal(response.status, 200);
  const existingWorkspace = await WorkspaceModel.findById(existingWorkspaceId).lean().exec();
  assert.ok(existingWorkspace);
  assert.deepEqual(existingWorkspace, existingWorkspaceBefore);
  const newDefaults = await settingsOf(memberPrincipal, logger);
  assert.equal(newDefaults.find(({ organizationId: id }) => id === organizationId)?.timeZone.value, "America/New_York");
  await WorkspaceModel.deleteOne({ _id: existingWorkspaceId });
});

void test("TC-01.1.03-S3-1 owner changes the setup rule and a member settingsOf read returns the owner value", async () => {
  await resetOrganization();
  const response = await fetch(settingsUrl, {
    method: "PATCH",
    headers: ownerHeaders,
    body: JSON.stringify({ expectedVersion: 1, settings: { workspaceSetupRule: "owner only" } })
  });
  assert.equal(response.status, 200);

  const memberSettings = await settingsOf(memberPrincipal, logger);
  const organizationSettings = memberSettings.find(({ organizationId: id }) => id === organizationId);
  assert.ok(organizationSettings);
  assert.deepEqual(organizationSettings.workspaceSetupRule, { value: "owner only", source: "owner" });
  assert.equal(organizationSettings.canUpdate, false);
});

void test("TC-01.1.03-S3-2 workspace setup consumer contract returns the owner-only refusal text", async () => {
  await resetOrganization();
  const response = await fetch(settingsUrl, {
    method: "PATCH",
    headers: ownerHeaders,
    body: JSON.stringify({ expectedVersion: 1, settings: { workspaceSetupRule: "owner only" } })
  });
  assert.equal(response.status, 200);

  const memberSettings = await settingsOf(memberPrincipal, logger);
  const organizationSettings = memberSettings.find(({ organizationId: id }) => id === organizationId);
  assert.ok(organizationSettings);
  assert.deepEqual(workspaceSetupConsumerContract(organizationName, organizationSettings), {
    status: "forbidden",
    message: "Only the owner of Acme Design can set up workspaces"
  });
});

void test("TC-01.1.03-S2-3 each invalid setting is rejected without changing persisted state", async () => {
  const invalidSettings = [
    { field: "timeZone", allowedValues: ["A valid IANA time-zone identifier"], settings: { timeZone: "Mars/Olympus" } },
    { field: "weekStart", allowedValues: ["Monday", "Sunday"], settings: { weekStart: "Tuesday" } },
    { field: "dateFormat", allowedValues: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], settings: { dateFormat: "DD.MM.YY" } },
    { field: "workspaceSetupRule", allowedValues: ["owner only", "any member"], settings: { workspaceSetupRule: "admins only" } }
  ] as const;

  for (const invalid of invalidSettings) {
    await resetOrganization();
    const response = await fetch(settingsUrl, {
      method: "PATCH",
      headers: ownerHeaders,
      body: JSON.stringify({ expectedVersion: 1, settings: invalid.settings })
    });
    assert.equal(response.status, 400, `${invalid.field} should be rejected`);
    const stored = await OrganizationModel.findById(organizationId).lean().exec();
    assert.ok(stored);
    assert.equal(stored.version, 1, `${invalid.field} must not increment the version`);
    assert.deepEqual(stored.settings, initialSettings, `${invalid.field} must not change any stored setting`);
    const body: unknown = await responseJson(response);
    assert.equal(typeof body, "object");
    assert.deepEqual(body, {
      status: "invalid_value",
      field: invalid.field,
      allowedValues: invalid.allowedValues
    });
  }
});

void test("stale version returns Conflict with the current server value", async () => {
  await resetOrganization();
  await OrganizationModel.updateOne({ _id: organizationId }, {
    $set: { "settings.timeZone": "Asia/Karachi" },
    $inc: { version: 1 }
  }).exec();
  const response = await fetch(settingsUrl, {
    method: "PATCH",
    headers: ownerHeaders,
    body: JSON.stringify({ expectedVersion: 1, settings: { weekStart: "Sunday" } })
  });
  assert.equal(response.status, 409);
  assert.deepEqual(await responseJson(response), {
    status: "conflict",
    current: {
      settings: {
        timeZone: { value: "Asia/Karachi", source: "owner" },
        weekStart: { value: "Monday", source: "owner" },
        dateFormat: { value: "DD/MM/YYYY", source: "owner" },
        workspaceSetupRule: { value: "any member", source: "owner" }
      },
      version: 2
    }
  });
});

void test("TC-01.1.03-S2-5 concurrent saves from one read version produce one update and one conflict", async () => {
  await resetOrganization();
  const save = (settings: { weekStart: "Sunday" } | { dateFormat: "YYYY-MM-DD" }) => fetch(settingsUrl, {
    method: "PATCH",
    headers: ownerHeaders,
    body: JSON.stringify({ expectedVersion: 1, settings })
  });
  const responses = await Promise.all([save({ weekStart: "Sunday" }), save({ dateFormat: "YYYY-MM-DD" })]);
  assert.deepEqual(responses.map(({ status }) => status).sort(), [200, 409]);
  const stored = await OrganizationModel.findById(organizationId).lean().exec();
  assert.ok(stored);
  assert.equal(stored.version, 2);
  assert.ok(
    (stored.settings.weekStart === "Sunday" && stored.settings.dateFormat === "DD/MM/YYYY")
      || (stored.settings.weekStart === "Monday" && stored.settings.dateFormat === "YYYY-MM-DD")
  );
});

void test("TC-01.1.03-S3-3 member is forbidden from changing the setup rule and it remains unchanged", async () => {
  await resetOrganization();
  const response = await fetch(settingsUrl, {
    method: "PATCH",
    headers: { authorization: "Bearer member", "content-type": "application/json" },
    body: JSON.stringify({ expectedVersion: 1, settings: { workspaceSetupRule: "owner only" } })
  });
  assert.equal(response.status, 403);
  const stored = await OrganizationModel.findById(organizationId).lean().exec();
  assert.ok(stored);
  assert.equal(stored.version, 1);
  assert.equal(stored.settings.workspaceSetupRule, "any member");
});

void test("TC-01.1.03-S2-4 a member settings update is forbidden and leaves the organization unchanged", async () => {
  await resetOrganization();
  const response = await fetch(settingsUrl, {
    method: "PATCH",
    headers: { authorization: "Bearer member", "content-type": "application/json" },
    body: JSON.stringify({ expectedVersion: 1, settings: { timeZone: "America/New_York" } })
  });
  assert.equal(response.status, 403);
  const stored = await OrganizationModel.findById(organizationId).lean().exec();
  assert.ok(stored);
  assert.equal(stored.version, 1);
  assert.deepEqual(stored.settings, initialSettings);
});
