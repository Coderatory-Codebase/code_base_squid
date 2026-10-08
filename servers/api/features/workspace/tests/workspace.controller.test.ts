import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceController } from "../controllers/workspace.controller.js";
import { ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import type { Request, Response } from "express";
import type { Logger, LogContext } from "@workspace/logging";

const logger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};

void test("Workspace controller: 401 when principal missing", async () => {
  const controller = createWorkspaceController({
    service: { getOrganizationProfile: () => Promise.resolve(null) },
    resolveWorkspacePrincipal: () => null,
    logger
  });

  let status = 0;
  let json: unknown = null;

  const request = {} as Request;
  const response = {
    status: (code: number) => { status = code; return response; },
    json: (body: unknown) => { json = body; }
  } as unknown as Response;

  await controller(request, response, () => {});

  assert.equal(status, HTTP_STATUS.unauthorized);
  assert.deepEqual(json, {
    error: { code: "unauthorized", message: ERROR_MESSAGES.unauthorized }
  });
});

void test("Workspace controller: 404 when profile not found", async () => {
  const controller = createWorkspaceController({
    service: { getOrganizationProfile: () => Promise.resolve(null) },
    resolveWorkspacePrincipal: () => ({ userId: "u-1" }),
    logger
  });

  let status = 0;
  const request = { params: { organizationId: "org-1" } } as unknown as Request;
  const response = {
    status: (code: number) => { status = code; return response; },
    json: () => undefined
  } as unknown as Response;

  await controller(request, response, () => {});

  assert.equal(status, HTTP_STATUS.notFound);
});

void test("Workspace controller: 200 with formatted dates when profile found", async () => {
  const date = new Date("2025-01-01T00:00:00Z");
  const controller = createWorkspaceController({
    service: { getOrganizationProfile: () => Promise.resolve({
      id: "org-1",
      name: "Org 1",
      ownerId: "u-1",
      createdAt: date,
      state: { kind: "ACTIVE" },
      workspaces: [{ id: "ws-1", name: "Studio", state: "ACTIVE", activeMemberCount: 12 }]
    }) },
    resolveWorkspacePrincipal: () => ({ userId: "u-1" }),
    logger
  });

  let status = 0;
  let json: unknown = null;

  const request = { params: { organizationId: "org-1" } } as unknown as Request;
  const response = {
    status: (code: number) => { status = code; return response; },
    json: (body: unknown) => { json = body; }
  } as unknown as Response;

  await controller(request, response, () => {});

  assert.equal(status, HTTP_STATUS.ok);
  assert.deepEqual(json, {
    id: "org-1",
    name: "Org 1",
    ownerId: "u-1",
    createdAt: "2025-01-01T00:00:00.000Z",
    state: { kind: "ACTIVE" },
    workspaces: [{ id: "ws-1", name: "Studio", state: "ACTIVE", activeMemberCount: 12 }]
  });
});

void test("organization profile signal is emitted for a successful run", async () => {
  const events: Array<Readonly<{ message: string; context?: LogContext }>> = [];
  const signalLogger: Logger = {
    info: (message, context) => events.push({ message, ...(context ? { context } : {}) }),
    warn: () => undefined,
    error: () => undefined
  };
  const controller = createWorkspaceController({
    service: { getOrganizationProfile: () => Promise.resolve({
      id: "org-1",
      name: "Org 1",
      ownerId: "u-1",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      state: { kind: "ACTIVE" },
      workspaces: [{ id: "ws-1", name: "Studio", state: "ACTIVE", activeMemberCount: 12 }]
    }) },
    resolveWorkspacePrincipal: () => ({ userId: "u-1" }),
    logger: signalLogger
  });
  const request = { params: { organizationId: "org-1" } } as unknown as Request;
  const response = {
    status: () => response,
    json: () => undefined
  } as unknown as Response;

  await controller(request, response, () => {});

  assert.deepEqual(events, [{
    message: "organization_profile.run",
    context: {
      event: "organization_profile.run",
      workspace: "api",
      module: "organization-profile",
      outcome: "success"
    }
  }]);
});

void test("organization profile signal is emitted when a run fails", async () => {
  const events: Array<Readonly<{ message: string; context?: LogContext }>> = [];
  const signalLogger: Logger = {
    info: (message, context) => events.push({ message, ...(context ? { context } : {}) }),
    warn: () => undefined,
    error: () => undefined
  };
  const failure = new Error("injected profile failure");
  const controller = createWorkspaceController({
    service: { getOrganizationProfile: () => Promise.reject(failure) },
    resolveWorkspacePrincipal: () => ({ userId: "u-1" }),
    logger: signalLogger
  });
  const request = { params: { organizationId: "org-1" } } as unknown as Request;
  const response = {
    status: () => response,
    json: () => undefined
  } as unknown as Response;
  let forwardedError: unknown;

  await controller(request, response, error => { forwardedError = error; });

  assert.equal(forwardedError, failure);
  assert.deepEqual(events, [{
    message: "organization_profile.run",
    context: {
      event: "organization_profile.run",
      workspace: "api",
      module: "organization-profile",
      outcome: "failure"
    }
  }]);
});
