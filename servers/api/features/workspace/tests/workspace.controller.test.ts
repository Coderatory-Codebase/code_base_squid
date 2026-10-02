import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceController } from "../controllers/workspace.controller.js";
import { HTTP_STATUS } from "../../../constants/index.js";
import type { Request, Response } from "express";

void test("Workspace controller: 401 when principal missing", async () => {
  const controller = createWorkspaceController({
    service: { getOrganizationProfile: () => Promise.resolve(null) },
    resolveWorkspacePrincipal: () => null
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
    error: { code: "unauthorized", message: "Sign in required." }
  });
});

void test("Workspace controller: 404 when profile not found", async () => {
  const controller = createWorkspaceController({
    service: { getOrganizationProfile: () => Promise.resolve(null) },
    resolveWorkspacePrincipal: () => ({ userId: "u-1" })
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
      state: { kind: "ACTIVE" }
    }) },
    resolveWorkspacePrincipal: () => ({ userId: "u-1" })
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
    state: { kind: "ACTIVE" }
  });
});
