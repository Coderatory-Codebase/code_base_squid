import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import type { Logger } from "@workspace/logging";
import { createApp, createServer } from "../../../bootstrap/index.js";
import type { ApiConfig } from "../../../types/index.js";
import type { OrganizationGateway } from "../db/organization.gateway.js";
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
  options: Readonly<{ gateway: OrganizationGateway; authenticated?: boolean; logger?: Logger }>
): Promise<string> => {
  const requestLogger = options.logger ?? logger;
  const server = createServer({
    app: createApp({
      config,
      logger: requestLogger,
      organizationGateway: options.gateway,
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
