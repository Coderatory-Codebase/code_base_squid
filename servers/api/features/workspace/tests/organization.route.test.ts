import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import type { Logger } from "@workspace/logging";
import { createApp, createServer } from "../../../bootstrap/index.js";
import type { ApiConfig } from "../../../types/index.js";
import type { OrganizationGateway } from "../db/organization.gateway.js";
import type { MembersService } from "../services/members.service.js";
import type { Principal } from "../types.js";

const logger: Logger = { info: () => undefined, warn: () => undefined, error: () => undefined };
const config: ApiConfig = {
  environment: "test",
  host: "127.0.0.1",
  port: 0,
  webOrigin: "http://localhost:3000",
  logLevel: "silent"
};
const principal: Principal = { userId: "user-1", workspaceIds: ["workspace-1"] };

const startApi = async (
  context: TestContext,
  options: Readonly<{ gateway: OrganizationGateway; membersService?: MembersService; authenticated?: boolean; logger?: Logger }>
): Promise<string> => {
  const requestLogger = options.logger ?? logger;
  const server = createServer({
    app: createApp({
      config,
      logger: requestLogger,
      organizationGateway: options.gateway,
      ...(options.membersService ? { membersService: options.membersService } : {}),
      resolvePrincipal: () => options.authenticated === false ? null : principal
    }),
    config,
    logger
  });

  await server.start();
  context.after(async () => { await server.stop(); });
  const address = server.raw.address();
  assert.ok(address && typeof address === "object");
  return `http://127.0.0.1:${String(address.port)}/organizations`;
};

const gatewayFor = (query: OrganizationGateway["listOrganizationsForPrincipal"]): OrganizationGateway => ({
  listOrganizationsForPrincipal: query,
  createOrganizationForPrincipal: (_receivedPrincipal, name) => Promise.resolve({
    _id: "organization-created",
    name,
    ownerId: principal.userId,
    workspaceIds: [],
    lastUsedAt: new Date(),
    deletedAt: null
  }),
  upsertPreviewOrganization: () => Promise.resolve()
});

void test("organization query returns an empty list for an authenticated principal", async (context) => {
  const url = await startApi(context, {
    gateway: gatewayFor((receivedPrincipal) => {
      assert.deepEqual(receivedPrincipal, principal);
      return Promise.resolve([]);
    })
  });
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});

void test("organization query returns only gateway results for an authenticated principal", async (context) => {
  const url = await startApi(context, {
    gateway: gatewayFor(() => Promise.resolve([{
      _id: "organization-1",
      name: "Member organization",
      ownerId: "owner-2",
      workspaceIds: ["workspace-1"],
      lastUsedAt: new Date("2026-09-30T12:00:00Z"),
      deletedAt: null
    }]))
  });
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ id: "organization-1", name: "Member organization" }]);
});

void test("organization query rejects unauthenticated requests and emits a failed boundary signal", async (context) => {
  const signals: Array<{ message: string; context: Record<string, unknown> }> = [];
  const signalLogger: Logger = {
    info: (message, values = {}) => signals.push({ message, context: values }),
    warn: () => undefined,
    error: () => undefined
  };
  const url = await startApi(context, {
    authenticated: false,
    logger: signalLogger,
    gateway: gatewayFor(() => Promise.reject(new Error("Gateway must not be called")))
  });
  const response = await fetch(url);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: { code: "unauthorized", message: "Sign in to view your organizations." }
  });
  const signal = signals.find(({ message }) => message === "organization.request.signal");
  assert.ok(signal);
  assert.equal(signal.context.workspace, "Platform");
  assert.equal(signal.context.module, "workspace");
  assert.equal(signal.context.statusCode, 401);
  assert.equal(signal.context.outcome, "error");
  assert.equal(typeof signal.context.durationMs, "number");
});

void test("organization query returns an error without partial results when the gateway fails", async (context) => {
  const url = await startApi(context, {
    gateway: gatewayFor(() => Promise.reject(new Error("Database unavailable")))
  });
  const response = await fetch(url);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: { code: "internal_error", message: "An unexpected error occurred." }
  });
});

void test("organization setup requires an authenticated policy-bearing command and returns the created organization", async (context) => {
  const url = await startApi(context, {
    gateway: gatewayFor(() => Promise.resolve([]))
  });
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "New organization" })
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id: "organization-created", name: "New organization" });
});

void test("organization setup rejects empty and overlong names before persistence", async (context) => {
  let createCalls = 0;
  const gateway: OrganizationGateway = {
    ...gatewayFor(() => Promise.resolve([])),
    createOrganizationForPrincipal: () => {
      createCalls += 1;
      return Promise.reject(new Error("Invalid names must not reach persistence"));
    }
  };
  const url = await startApi(context, { gateway });

  for (const name of ["", "a".repeat(81)]) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name })
    });
    assert.equal(response.status, 400);
    const payload: unknown = await response.json();
    assert.equal(typeof payload, "object");
    assert.notEqual(payload, null);
    assert.equal(createCalls, 0);
  }
});

void test("member role is denied invitation creation with HTTP 403 before mutation", async (context) => {
  let mutationCalls = 0;
  const membersService: MembersService = {
    getDashboard: async () => ({
      organization: { id: "000000000000000000000041", name: "Member organization" },
      metrics: { activeTeamMembers: 2, linkedWorkspaces: 0 },
      viewerRole: "member",
      members: [],
      activity: []
    }),
    inviteMember: async () => {
      mutationCalls += 1;
      return { token: "a".repeat(43), expiresAt: new Date() };
    },
    acceptInvitation: async () => ({ id: "000000000000000000000041", name: "Member organization" }),
    updateMemberRole: async () => { mutationCalls += 1; },
    removeMember: async () => { mutationCalls += 1; }
  };
  const root = await startApi(context, { gateway: gatewayFor(() => Promise.resolve([])), membersService });
  const basePath = `${root}/000000000000000000000041`;
  const responses = await Promise.all([
    fetch(`${basePath}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "invitee@example.test", role: "member" })
    }),
    fetch(`${basePath}/members/member-2`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "admin" })
    }),
    fetch(`${basePath}/members/member-2`, { method: "DELETE" })
  ]);
  assert.deepEqual(responses.map(({ status }) => status), [403, 403, 403]);
  assert.equal(mutationCalls, 0);
});

void test("admin role can create an invitation link", async (context) => {
  const mutations: string[] = [];
  const membersService: MembersService = {
    getDashboard: async () => ({
      organization: { id: "000000000000000000000042", name: "Admin organization" },
      metrics: { activeTeamMembers: 2, linkedWorkspaces: 0 },
      viewerRole: "admin",
      members: [],
      activity: []
    }),
    inviteMember: async () => ({
      token: "a".repeat(43),
      expiresAt: new Date("2026-10-14T12:00:00.000Z")
    }),
    acceptInvitation: async () => ({ id: "000000000000000000000042", name: "Admin organization" }),
    updateMemberRole: async (_organizationId, _principal, memberId, role) => { mutations.push(`role:${memberId}:${role}`); },
    removeMember: async (_organizationId, _principal, memberId) => { mutations.push(`remove:${memberId}`); }
  };
  const root = await startApi(context, { gateway: gatewayFor(() => Promise.resolve([])), membersService });
  const response = await fetch(`${root}/000000000000000000000042/invitations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "invitee@example.test", role: "admin" })
  });
  assert.equal(response.status, 201);
  const payload = await response.json() as { token: string; expiresAt: string; url: string };
  assert.equal(payload.token, "a".repeat(43));
  assert.equal(payload.expiresAt, "2026-10-14T12:00:00.000Z");
  assert.equal(new URL(payload.url).origin, config.webOrigin);
  assert.equal(new URL(payload.url).searchParams.get("token"), payload.token);
  const basePath = `${root}/000000000000000000000042/members/member-2`;
  const roleResponse = await fetch(basePath, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role: "admin" })
  });
  const removeResponse = await fetch(basePath, { method: "DELETE" });
  assert.equal(roleResponse.status, 204);
  assert.equal(removeResponse.status, 204);
  assert.deepEqual(mutations, ["role:member-2:admin", "remove:member-2"]);
});
