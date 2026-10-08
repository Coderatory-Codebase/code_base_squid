import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { validateModuleGovernance } from "./module-governance.mjs";

const makeWorkspace = async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "repo-module-governance-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "architecture"), { recursive: true });
  await writeFile(path.join(root, "architecture", "deps.json"), JSON.stringify({
    version: 1,
    featureRoot: "features",
    sharedKernel: { id: "shared-kernel", packageRoot: "packages/kernel" },
    foundationDependencies: ["shared-kernel"],
    modules: [
      { id: "identity", name: "Identity", dependsOn: [] },
      { id: "workspace", name: "Workspace", dependsOn: ["identity"] },
      { id: "forms", name: "Forms", dependsOn: [] },
      { id: "billing", name: "Billing", dependsOn: ["workspace"] },
      { id: "shared-kernel", name: "Shared Kernel", dependsOn: [] }
    ]
  }), "utf8");
  await writeFile(path.join(root, "architecture", "collections.json"), JSON.stringify({
    version: 1,
    collections: [
      { name: "users", owner: "identity" },
      { name: "workspaces", owner: "workspace" },
      { name: "outbox", owner: "shared-kernel" }
    ]
  }), "utf8");
  await writeFile(path.join(root, "architecture", "exceptions.json"), JSON.stringify({
    version: 1,
    exceptions: [
      { id: "EX-01", status: "open", expiresAt: null, collection: "outbox", owner: "shared-kernel", writers: "all-modules", operations: ["append"], relayWriter: "shared-kernel", relayFields: ["publishedAt"] },
      { id: "EX-02", status: "open", expiresAt: null, collection: "workspaces", owner: "workspace", writer: "billing", operations: ["update"], fields: ["entitlements"] }
    ]
  }), "utf8");
  return {
    root,
    architecture: { foundation: { ignoredDirectories: [] } },
    projects: [{ name: "api", type: "server", root: "servers/api" }],
    now: () => new Date("2026-10-05T00:00:00Z")
  };
};

const writeSource = async (workspace, relativePath, source) => {
  const filePath = path.join(workspace.root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, source, "utf8");
};

test("allows a declared dependency through its published feature API", async (context) => {
  const workspace = await makeWorkspace(context);
  await writeSource(workspace, "servers/api/features/workspace/index.ts", "import '../identity/public.js';\n");
  await writeSource(workspace, "servers/api/features/identity/index.ts", "export {};\n");
  await writeSource(workspace, "servers/api/features/identity/public.ts", "export {};\n");

  assert.deepEqual(await validateModuleGovernance(workspace), []);
});

test("rejects a cross-module import of private db internals and names both modules", async (context) => {
  const workspace = await makeWorkspace(context);
  await writeSource(workspace, "servers/api/features/workspace/domain/read.ts", "import '../../identity/db/users.js';\n");

  const findings = await validateModuleGovernance(workspace);
  assert.ok(findings.some(({ rule, message }) => rule === "module-private-import"
    && message.includes("Workspace") && message.includes("Identity") && message.includes("read.ts")));
});

test("rejects an undeclared cross-module dependency", async (context) => {
  const workspace = await makeWorkspace(context);
  await writeSource(workspace, "servers/api/features/forms/index.ts", "import '../identity/index.js';\n");
  await writeSource(workspace, "servers/api/features/identity/index.ts", "export {};\n");

  const findings = await validateModuleGovernance(workspace);
  assert.ok(findings.some(({ rule, message }) => rule === "module-dependency"
    && message.includes("Forms") && message.includes("Identity")));
});

test("rejects a module gateway naming a collection owned by another module", async (context) => {
  const workspace = await makeWorkspace(context);
  await writeSource(workspace, "servers/api/features/workspace/integrations/workspace.mongo.ts", "const users = model('User', schema, 'users');\n");

  const findings = await validateModuleGovernance(workspace);
  assert.ok(findings.some(({ rule, message }) => rule === "collection-owner"
    && message.includes("Workspace") && message.includes("users") && message.includes("Identity")));
});

test("rejects next imports from domain code", async (context) => {
  const workspace = await makeWorkspace(context);
  await writeSource(workspace, "servers/api/features/workspace/domain/request.ts", "import { headers } from 'next/headers';\n");

  const findings = await validateModuleGovernance(workspace);
  assert.ok(findings.some(({ rule, message }) => rule === "module-domain-framework-import"
    && message.includes("next/headers") && message.includes("Workspace")));
});

test("honors only transaction-bound outbox appends and entitlement copy scope", async (context) => {
  const workspace = await makeWorkspace(context);
  await writeSource(workspace, "servers/api/features/identity/outbox.ts", "await session.withTransaction(async () => { db.collection('outbox').insertOne({ type: 'UserCreated' }); });\n");
  await writeSource(workspace, "servers/api/features/billing/workspaces.ts", "db.collection('workspaces').updateOne({}, { $set: { entitlements: true } });\n");

  assert.deepEqual(await validateModuleGovernance(workspace), []);
});

test("rejects an outbox append outside a transaction", async (context) => {
  const workspace = await makeWorkspace(context);
  await writeSource(workspace, "servers/api/features/identity/outbox.ts", "db.collection('outbox').insertOne({ type: 'UserCreated' });\n");
  assert.ok((await validateModuleGovernance(workspace)).some(({ rule }) => rule === "collection-owner"));
});

test("an expired exception no longer permits its write", async (context) => {
  const workspace = await makeWorkspace(context);
  const file = path.join(workspace.root, "architecture", "exceptions.json");
  const register = JSON.parse(await (await import("node:fs/promises")).readFile(file, "utf8"));
  register.exceptions[1].expiresAt = "2026-10-04";
  await writeFile(file, JSON.stringify(register));
  await writeSource(workspace, "servers/api/features/billing/workspaces.ts", "db.collection('workspaces').updateOne({}, { $set: { entitlements: true } });\n");
  assert.ok((await validateModuleGovernance(workspace)).some(({ rule, message }) => rule === "collection-owner" && message.includes("EX-02")));
});

test("does not let an exception authorize a broader foreign-collection write", async (context) => {
  const workspace = await makeWorkspace(context);
  await writeSource(workspace, "servers/api/features/billing/workspaces.ts", "db.collection('workspaces').updateOne({}, { $set: { entitlements: true, name: 'wrong' } });\n");

  const findings = await validateModuleGovernance(workspace);
  assert.ok(findings.some(({ rule, message }) => rule === "collection-owner"
    && message.includes("Billing") && message.includes("workspaces") && message.includes("exception")));
});
