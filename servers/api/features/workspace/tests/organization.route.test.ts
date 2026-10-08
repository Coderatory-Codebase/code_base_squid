import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import type { Logger } from "@workspace/logging";
import { createApp, createServer } from "../../../bootstrap/index.js";
import type { ApiConfig } from "../../../types/index.js";
import type { OrganizationGateway } from "../db/organization.gateway.js";
import type { MembersService } from "../services/members.service.js";
import type { OrganizationLifecycleService } from "../services/organization-lifecycle.service.js";
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
  options: Readonly<{
    gateway: OrganizationGateway;
    membersService?: MembersService;
    lifecycleService?: OrganizationLifecycleService;
    authenticated?: boolean;
    logger?: Logger;
  }>
): Promise<string> => {
  const requestLogger = options.logger ?? logger;
  const server = createServer({
    app: createApp({
      config,
      logger: requestLogger,
      organizationGateway: options.gateway,
      ...(options.membersService ? { membersService: options.membersService } : {}),
      ...(options.lifecycleService ? { lifecycleService: options.lifecycleService } : {}),
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

void test("organization query returns a terminal empty page for an authenticated principal", async (context) => {
  const url = await startApi(context, {
    gateway: gatewayFor((receivedPrincipal, offset) => {
      assert.deepEqual(receivedPrincipal, principal);
      assert.equal(offset, 0);
      return Promise.resolve({ organizations: [], nextOffset: null });
    })
  });
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { organizations: [], nextOffset: null });
});

void test("organization query returns a validated page for an authenticated principal", async (context) => {
  const url = await startApi(context, {
    gateway: gatewayFor((_receivedPrincipal, offset) => {
      assert.equal(offset, 50);
      return Promise.resolve({
        organizations: [{
          _id: "organization-1",
          name: "Member organization",
          ownerId: "owner-2",
          workspaceIds: ["workspace-1"],
          lastUsedAt: new Date("2026-09-30T12:00:00Z"),
          deletedAt: null
        }],
        nextOffset: null
      });
    })
  });
  const response = await fetch(`${url}?offset=50`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    organizations: [{ id: "organization-1", name: "Member organization", status: "active", archivedAt: null }],
    nextOffset: null
  });
});

void test("organization query rejects invalid page offsets without calling its gateway", async (context) => {
  let gatewayCalls = 0;
  const url = await startApi(context, {
    gateway: gatewayFor(() => {
      gatewayCalls += 1;
      return Promise.resolve({ organizations: [], nextOffset: null });
    })
  });
  for (const offset of ["-1", "1.5", "500001", "not-a-number", "0&unexpected=true"]) {
    const response = await fetch(`${url}?offset=${encodeURIComponent(offset)}`);
    assert.equal(response.status, 400);
  }
  assert.equal(gatewayCalls, 0);
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
  const response = await fetch(`${url}?offset=50`);
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
  assert.equal(signal.context.pageOffset, 50);
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
    gateway: gatewayFor(() => Promise.resolve({ organizations: [], nextOffset: null }))
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
    ...gatewayFor(() => Promise.resolve({ organizations: [], nextOffset: null })),
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
    getDashboard: () => Promise.resolve({
      organization: { id: "000000000000000000000041", name: "Member organization" },
      lifecycle: { status: "active", version: 0, archivedAt: null, archivedBy: null, deletedAt: null },
      metrics: { activeTeamMembers: 2, linkedWorkspaces: 0 },
      viewerRole: "member",
      members: [],
      activity: []
    }),
    inviteMember: () => {
      mutationCalls += 1;
      return Promise.resolve({ token: "a".repeat(43), expiresAt: new Date() });
    },
    acceptInvitation: () => Promise.resolve({ id: "000000000000000000000041", name: "Member organization" }),
    updateMemberRole: () => { mutationCalls += 1; return Promise.resolve(); },
    removeMember: () => { mutationCalls += 1; return Promise.resolve(); }
  };
  const root = await startApi(context, { gateway: gatewayFor(() => Promise.resolve({ organizations: [], nextOffset: null })), membersService });
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
    getDashboard: () => Promise.resolve({
      organization: { id: "000000000000000000000042", name: "Admin organization" },
      lifecycle: { status: "active", version: 0, archivedAt: null, archivedBy: null, deletedAt: null },
      metrics: { activeTeamMembers: 2, linkedWorkspaces: 0 },
      viewerRole: "admin",
      members: [],
      activity: []
    }),
    inviteMember: () => Promise.resolve({
      token: "a".repeat(43),
      expiresAt: new Date("2026-10-14T12:00:00.000Z")
    }),
    acceptInvitation: () => Promise.resolve({ id: "000000000000000000000042", name: "Admin organization" }),
    updateMemberRole: (_organizationId, _principal, memberId, role) => {
      mutations.push(`role:${memberId}:${role}`);
      return Promise.resolve();
    },
    removeMember: (_organizationId, _principal, memberId) => {
      mutations.push(`remove:${memberId}`);
      return Promise.resolve();
    }
  };
  const root = await startApi(context, { gateway: gatewayFor(() => Promise.resolve({ organizations: [], nextOffset: null })), membersService });
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

void test("organization lifecycle route validates requests and returns transition results", async (context) => {
  const calls: Array<Readonly<{ organizationId: string; actor: Principal; action: "archive" | "restore" | "delete"; version: number }>> = [];
  const lifecycleService: OrganizationLifecycleService = {
    transition: (organizationId, actor, action, version) => {
      calls.push({ organizationId, actor, action, version });
      if (action !== "archive" || version !== 0) {
        return Promise.resolve({
          ok: false,
          code: "conflict",
          message: "The organization changed while this request was being saved. Review its current state.",
          current: {
            status: "archived",
            version: 1,
            archivedAt: new Date("2026-10-07T12:00:00.000Z"),
            archivedBy: principal.userId,
            deletedAt: null
          }
        });
      }
      return Promise.resolve({
        ok: true,
        lifecycle: {
          status: "archived",
          version: 1,
          archivedAt: new Date("2026-10-07T12:00:00.000Z"),
          archivedBy: principal.userId,
          deletedAt: null
        }
      });
    }
  };
  const root = await startApi(context, {
    gateway: gatewayFor(() => Promise.resolve({ organizations: [], nextOffset: null })),
    lifecycleService
  });
  const endpoint = `${root}/000000000000000000000071/lifecycle`;
  const headers = { "content-type": "application/json" };

  for (const body of [
    { action: "purge", expectedVersion: 0 },
    { action: "archive", expectedVersion: -1 },
    { action: "archive", expectedVersion: 0.5 }
  ]) {
    const response = await fetch(endpoint, { method: "PATCH", headers, body: JSON.stringify(body) });
    assert.equal(response.status, 400);
  }
  assert.equal(calls.length, 0);

  const archived = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ action: "archive", expectedVersion: 0 })
  });
  assert.equal(archived.status, 200);
  assert.deepEqual(await archived.json(), {
    lifecycle: {
      status: "archived",
      version: 1,
      archivedAt: "2026-10-07T12:00:00.000Z",
      archivedBy: principal.userId,
      deletedAt: null
    }
  });

  const conflict = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ action: "restore", expectedVersion: 0 })
  });
  assert.equal(conflict.status, 409);
  assert.deepEqual(await conflict.json(), {
    error: { code: "conflict", message: "The organization changed while this request was being saved. Review its current state." },
    current: {
      status: "archived",
      version: 1,
      archivedAt: "2026-10-07T12:00:00.000Z",
      archivedBy: principal.userId,
      deletedAt: null
    }
  });
  assert.deepEqual(calls.map(({ action, version }) => [action, version]), [["archive", 0], ["restore", 0]]);
});

void test("organization lifecycle route requires an authenticated principal", async (context) => {
  let transitionCalls = 0;
  const lifecycleService: OrganizationLifecycleService = {
    transition: () => {
      transitionCalls += 1;
      return Promise.resolve({
        ok: false,
        code: "forbidden",
        message: "Only the organization owner can change its lifecycle."
      });
    }
  };
  const root = await startApi(context, {
    authenticated: false,
    gateway: gatewayFor(() => Promise.resolve({ organizations: [], nextOffset: null })),
    lifecycleService
  });
  const response = await fetch(`${root}/000000000000000000000071/lifecycle`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "archive", expectedVersion: 0 })
  });
  assert.equal(response.status, 401);
  assert.equal(transitionCalls, 0);
});
