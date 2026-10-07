import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import test from "node:test";
import type { OrganizationBrandingReadSignal } from "../telemetry.js";
import { createTemporaryOrganizationBrandingRoutes } from "../routes.js";

const config = Object.freeze({
  email: "demo@example.local",
  password: "local-demo-password-123",
  workspaceId: "workspace-demo",
  sessionSecret: "local-only-random-secret-with-at-least-32-characters"
});

void test("temporary login issues a signed session and list reads only its configured workspace", async (context) => {
  let requestedWorkspaceId = "";
  const app = express();
  app.use(express.json());
  const signals: OrganizationBrandingReadSignal[] = [];
  app.use(createTemporaryOrganizationBrandingRoutes({
    config,
    emitReadSignal: (signal) => { signals.push(signal); },
    reader: {
      listForWorkspace: (workspaceId) => {
        requestedWorkspaceId = workspaceId;
        return Promise.resolve([{ organizationId: "org-one", logoUrl: null, accentColor: "#123456" }]);
      }
    }
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise<void>((resolve, reject) => server.close((error) => {
    if (error) reject(error);
    else resolve();
  })));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${String(address.port)}`;

  const rejected = await fetch(`${baseUrl}/temporary/organization-branding/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.email, password: "wrong-password-123456" })
  });
  assert.equal(rejected.status, 401);

  const login = await fetch(`${baseUrl}/temporary/organization-branding/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.email, password: config.password })
  });
  assert.equal(login.status, 200);
  const { token } = await login.json() as { token: string };
  assert.ok(token);

  const organizations = await fetch(`${baseUrl}/temporary/organization-branding/organizations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(organizations.status, 200);
  assert.equal(requestedWorkspaceId, config.workspaceId);
  assert.deepEqual(await organizations.json(), {
    organizations: [{
      organizationId: "org-one",
      organizationName: "org-one",
      workspaceName: config.workspaceId,
      workspaceId: config.workspaceId,
      logoUrl: null,
      accentColor: "#123456"
    }]
  });
  assert.equal(signals.length, 1);
  assert.deepEqual(signals[0], {
    event: "organization_branding.read",
    outcome: "success",
    durationMs: signals[0]?.durationMs,
    resultCount: 1,
    budgetMs: 700,
    withinBudget: true
  });
});

void test("temporary branding list rejects absent and invalid session tokens", async (context) => {
  const app = express();
  app.use(createTemporaryOrganizationBrandingRoutes({ config, emitReadSignal: () => undefined, reader: { listForWorkspace: () => Promise.resolve([]) } }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise<void>((resolve, reject) => server.close((error) => {
    if (error) reject(error);
    else resolve();
  })));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const response = await fetch(`http://127.0.0.1:${String(address.port)}/temporary/organization-branding/organizations`, {
    headers: { Authorization: "Bearer invalid" }
  });
  assert.equal(response.status, 401);
});
