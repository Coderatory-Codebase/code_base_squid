import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { validateModuleGovernance } from "./module-governance.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const seedWorkspace = async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "module-governance-s2-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "architecture"), { recursive: true });
  for (const file of ["deps.json", "collections.json", "exceptions.json"]) {
    await writeFile(path.join(root, "architecture", file), await readFile(path.join(repositoryRoot, "architecture", file), "utf8"));
  }
  return {
    root,
    now: () => new Date("2026-10-05T00:00:00Z"),
    architecture: { foundation: { ignoredDirectories: ["node_modules", "dist", "build"] } },
    projects: [{ name: "api", type: "server", root: "servers/api" }]
  };
};
const writeFixture = async (workspace, relativePath, contents) => {
  const filePath = path.join(workspace.root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
};

test("TC-01.4.06-S2-1: transaction-bound outbox append passes under EX-01", async (context) => {
  const workspace = await seedWorkspace(context);
  await writeFixture(workspace, "servers/api/features/workspace/outbox.ts", "await session.withTransaction(async () => { db.collection('outbox').insertOne({ type: 'WorkspaceCreated' }); });\n");
  assert.deepEqual(await validateModuleGovernance(workspace), []);
});

test("TC-01.4.06-S2-2: Workspace cannot update publishedAt under append-only EX-01", async (context) => {
  const workspace = await seedWorkspace(context);
  await writeFixture(workspace, "servers/api/features/workspace/outbox.ts", "db.collection('outbox').updateOne({}, { $set: { publishedAt: new Date() } });\n");
  const finding = (await validateModuleGovernance(workspace)).find(({ rule }) => rule === "collection-owner");
  assert.ok(finding);
  assert.match(finding.message, /outbox/);
  assert.match(finding.message, /Shared Kernel/);
  assert.match(finding.message, /EX-01/);
  assert.match(finding.message, /append-only/);
});

test("TC-01.4.06-S2-3: Identity domain framework import fails with ARC-001", async (context) => {
  const workspace = await seedWorkspace(context);
  const file = "servers/api/features/identity/domain/request.ts";
  await writeFixture(workspace, file, "import { headers } from 'next/headers';\n");
  const finding = (await validateModuleGovernance(workspace)).find(({ rule }) => rule === "module-domain-framework-import");
  assert.ok(finding);
  assert.match(finding.message, /Identity/);
  assert.match(finding.message, /servers\/api\/features\/identity\/domain\/request\.ts/);
  assert.match(finding.message, /ARC-001/);
});

test("TC-01.4.06-S2-4: closing EX-02 rejects every remaining Billing entitlement write", async (context) => {
  const workspace = await seedWorkspace(context);
  const registerPath = path.join(workspace.root, "architecture", "exceptions.json");
  const register = JSON.parse(await readFile(registerPath, "utf8"));
  register.exceptions.find(({ id }) => id === "EX-02").status = "closed";
  await writeFile(registerPath, JSON.stringify(register), "utf8");
  for (const name of ["reconcile.ts", "sync.ts"]) {
    await writeFixture(workspace, `servers/api/features/billing/${name}`, "db.collection('workspaces').updateOne({}, { $set: { entitlements: true } });\n");
  }
  const findings = (await validateModuleGovernance(workspace)).filter(({ rule }) => rule === "collection-owner");
  assert.equal(findings.length, 2);
  for (const finding of findings) {
    assert.match(finding.message, /workspaces/);
    assert.match(finding.message, /Workspace/);
  }
});
