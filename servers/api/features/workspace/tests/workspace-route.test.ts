import assert from "node:assert/strict";
import express from "express";
import test from "node:test";
import type { Logger } from "@workspace/logging";
import { createErrorHandler } from "../../../middleware/index.js";
import { createWorkspaceRoutes } from "../routes/workspace.route.js";
import type { WorkspaceLanding, WorkspacePort } from "../workspace.js";
import { createWorkspaceService } from "../workspace.js";

const logger: Logger = { info: () => undefined, warn: () => undefined, error: () => undefined };

const withServer = async (app: express.Express, operation: (origin: string) => Promise<void>): Promise<void> => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    await operation(`http://127.0.0.1:${String(address.port)}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => {
      if (error) reject(error);
      else resolve();
    }));
  }
};

const createWorkspaceApp = (port: WorkspacePort, sessionUserId: (cookie: string | undefined) => string | null) => {
  const app = express();
  app.use(express.json());
  app.use(createWorkspaceRoutes({
    resolveSession: (cookie) => Promise.resolve(sessionUserId(cookie) ? { userId: sessionUserId(cookie) as string } : null),
    service: createWorkspaceService({ workspaces: port, createId: () => "workspace-new" })
  }));
  app.use(createErrorHandler({ logger }));
  return app;
};

void test("AC-1: an authenticated owner without a workspace is offered creation", async () => {
  const landing: WorkspaceLanding = { kind: "create-workspace", organizationName: "Design" };
  const app = createWorkspaceApp({
    landingForOwner: () => Promise.resolve(landing),
    createForOwner: () => Promise.resolve(null)
  }, (cookie) => cookie === "squid_session=owner" ? "owner" : null);

  await withServer(app, async (origin) => {
    const response = await fetch(`${origin}/workspace`, { headers: { cookie: "squid_session=owner" } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), landing);
  });
});

void test("AC-2: successful creation returns the new workspace as ready", async () => {
  let createdFor: string | undefined;
  const workspace = { workspaceId: "workspace-new", organizationId: "org-1", name: "Design" };
  const app = createWorkspaceApp({
    landingForOwner: () => Promise.resolve({ kind: "create-workspace", organizationName: "Design" }),
    createForOwner: (input) => {
      createdFor = input.userId;
      return Promise.resolve(workspace);
    }
  }, (cookie) => cookie === "squid_session=owner" ? "owner-1" : null);

  await withServer(app, async (origin) => {
    const response = await fetch(`${origin}/workspace`, {
      method: "POST",
      headers: { cookie: "squid_session=owner", "content-type": "application/json" },
      body: JSON.stringify({ name: "  Design  " })
    });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { kind: "ready", workspace });
    assert.equal(createdFor, "owner-1");
  });
});

void test("AC-3: storage failure reports no success and leaves creation retryable", async () => {
  const app = createWorkspaceApp({
    landingForOwner: () => Promise.resolve({ kind: "create-workspace", organizationName: "Design" }),
    createForOwner: () => Promise.reject(new Error("database unavailable"))
  }, (cookie) => cookie === "squid_session=owner" ? "owner-1" : null);

  await withServer(app, async (origin) => {
    const response = await fetch(`${origin}/workspace`, {
      method: "POST",
      headers: { cookie: "squid_session=owner", "content-type": "application/json" },
      body: JSON.stringify({ name: "Design" })
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: { code: "internal_error", message: "An unexpected error occurred." } });
  });
});

void test("AC-authorization: unauthenticated sessions, members, guests, and API keys cannot create", async () => {
  for (const actor of ["anonymous", "member", "guest", "api-key"] as const) {
    const userIdFor = (cookie: string | undefined): string | null => cookie === "squid_session=member" ? "member"
      : cookie === "squid_session=guest" ? "guest" : null;
    const app = createWorkspaceApp({
      landingForOwner: () => Promise.resolve(null),
      createForOwner: () => Promise.resolve(null)
    }, userIdFor);
    const credential = actor === "member" ? "squid_session=member" : actor === "guest" ? "squid_session=guest" : undefined;

    await withServer(app, async (origin) => {
      const headers = new Headers({ "content-type": "application/json" });
      if (credential) headers.set("cookie", credential);
      if (actor === "api-key") headers.set("authorization", "Bearer api-key-value");
      const response = await fetch(`${origin}/workspace`, { method: "POST", headers, body: JSON.stringify({ name: "Design" }) });
      assert.equal(response.status, actor === "anonymous" || actor === "api-key" ? 401 : 403);
    });
  }
});
