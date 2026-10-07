import { createServer } from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import type { TestContext } from "node:test";
import express from "express";
import type { Express } from "express";
import type { Logger } from "@workspace/logging";
import { createApp } from "../../../bootstrap/index.js";
import { HTTP_STATUS } from "../../../constants/index.js";
import { createWorkspaceRoutes } from "../index.js";
import type { WorkspaceRepository } from "../workspace.repository.js";
import type { ApiConfig } from "../../../types/index.js";

const startExpressApp = async (context: TestContext, app: Express): Promise<string> => {
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  context.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  }));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return `http://127.0.0.1:${String(address.port)}`;
};

const startWorkspaceApp = async (
  context: TestContext,
  repository: WorkspaceRepository,
  resolveWorkspacePrincipal: Parameters<typeof createWorkspaceRoutes>[0]["resolveWorkspacePrincipal"]
): Promise<string> => {
  const app = express();
  app.use(createWorkspaceRoutes({ repository, resolveWorkspacePrincipal, logger }));
  return startExpressApp(context, app);
};

const apiConfig: ApiConfig = {
  environment: "test",
  host: "127.0.0.1",
  port: 0,
  webOrigin: "http://localhost:3000",
  logLevel: "silent"
};

const logger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};

void test("application default principal resolver returns 401 for organization profile", async (context) => {
  const baseUrl = await startExpressApp(context, createApp({ config: apiConfig, logger }));
  const response = await fetch(`${baseUrl}/workspace/organization-profile/organization-1`);

  assert.equal(response.status, HTTP_STATUS.unauthorized);
  assert.deepEqual(await response.json(), {
    error: { code: "unauthorized", message: "Sign in required." }
  });
});

void test("GET organization profile returns 401 when the principal resolver returns null", async (context) => {
  let repositoryCalls = 0;
  const repository: WorkspaceRepository = {
    findOrganizationProfile: () => {
      repositoryCalls += 1;
      return Promise.resolve(null);
    }
  };
  const baseUrl = await startWorkspaceApp(context, repository, () => null);
  const response = await fetch(`${baseUrl}/workspace/organization-profile/organization-1`);

  assert.equal(response.status, HTTP_STATUS.unauthorized);
  assert.equal(repositoryCalls, 0);
  assert.deepEqual(await response.json(), {
    error: { code: "unauthorized", message: "Sign in required." }
  });
});

void test("GET organization profile returns the shared serialized profile contract", async (context) => {
  const createdAt = new Date("2025-01-15T12:00:00.000Z");
  const effectiveOn = new Date("2025-03-15T12:00:00.000Z");
  const repository: WorkspaceRepository = {
    findOrganizationProfile: (principal, organizationId) => {
      assert.deepEqual(principal, { userId: "user-1" });
      assert.equal(organizationId, "organization-1");
      return Promise.resolve({
        id: "organization-1",
        name: "Example Organization",
        ownerId: "owner-1",
        createdAt,
        state: { kind: "DELETION_SCHEDULED", effectiveOn },
        workspaces: [{ id: "workspace-1", name: "Studio", state: "ACTIVE", activeMemberCount: 12 }]
      });
    }
  };
  const baseUrl = await startWorkspaceApp(context, repository, () => ({ userId: "user-1" }));
  const response = await fetch(`${baseUrl}/workspace/organization-profile/organization-1`);

  assert.equal(response.status, HTTP_STATUS.ok);
  assert.deepEqual(await response.json(), {
    id: "organization-1",
    name: "Example Organization",
    ownerId: "owner-1",
    createdAt: createdAt.toISOString(),
    state: { kind: "DELETION_SCHEDULED", effectiveOn: effectiveOn.toISOString() },
    workspaces: [{ id: "workspace-1", name: "Studio", state: "ACTIVE", activeMemberCount: 12 }]
  });
});

void test("GET organization profile returns the same 404 response for every unavailable profile", async (context) => {
  const repository: WorkspaceRepository = { findOrganizationProfile: () => Promise.resolve(null) };
  const baseUrl = await startWorkspaceApp(context, repository, () => ({ userId: "user-1" }));
  const unavailableOrganizationIds = ["non-member", "unknown", "deleted", "malformed-id"];

  for (const organizationId of unavailableOrganizationIds) {
    const response = await fetch(`${baseUrl}/workspace/organization-profile/${organizationId}`);
    assert.equal(response.status, HTTP_STATUS.notFound);
    assert.deepEqual(await response.json(), {
      error: { code: "not_found", message: "Resource not found." }
    });
  }
});

void test("AC-3 contract: another-organization member and unknown id return identical Not found responses without organization data", async (context) => {
  const repository: WorkspaceRepository = { findOrganizationProfile: () => Promise.resolve(null) };
  const baseUrl = await startWorkspaceApp(context, repository, () => ({ userId: "user-other-org" }));

  const requests = [
    `${baseUrl}/workspace/organization-profile/organization-1`,
    `${baseUrl}/workspace/organization-profile/unknown-organization-id`
  ];

  const payloads: unknown[] = [];
  for (const url of requests) {
    const response = await fetch(url);
    assert.equal(response.status, HTTP_STATUS.notFound);
    const body = await response.json();
    payloads.push(body);

    assert.deepEqual(body, {
      error: { code: "not_found", message: "Resource not found." }
    });
    assert.equal("id" in body, false);
    assert.equal("name" in body, false);
    assert.equal("ownerId" in body, false);
  }

  assert.deepEqual(payloads[0], payloads[1]);
});

void test("permission refusal: signed-in user cannot retrieve a different organization profile", async (context) => {
  const repository: WorkspaceRepository = { findOrganizationProfile: () => Promise.resolve(null) };
  const baseUrl = await startWorkspaceApp(context, repository, () => ({ userId: "user-2" }));
  const response = await fetch(`${baseUrl}/workspace/organization-profile/organization-1`);

  assert.equal(response.status, HTTP_STATUS.notFound);
  assert.deepEqual(await response.json(), {
    error: { code: "not_found", message: "Resource not found." }
  });
});
