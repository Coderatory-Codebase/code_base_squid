import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { validateModuleGovernance } from "./module-governance.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const seedWorkspace = async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "module-governance-acceptance-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "architecture"), { recursive: true });
  for (const file of ["deps.json", "collections.json", "exceptions.json"]) {
    const source = await readFile(path.join(repositoryRoot, "architecture", file), "utf8");
    await writeFile(path.join(root, "architecture", file), source, "utf8");
  }
  return {
    root,
    architecture: { foundation: { ignoredDirectories: ["node_modules", "dist", "build"] } },
    projects: [{ name: "api", type: "server", root: "servers/api" }]
  };
};

const writeFixture = async (workspace, relativePath, contents) => {
  const filePath = path.join(workspace.root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
};

test("TC-01.4.06-S1-1: published-interface dependency passes dependency and collection checks", async (context) => {
  const workspace = await seedWorkspace(context);
  await writeFixture(workspace, "servers/api/features/workspace/index.ts", "import '../identity/index.js';\n");
  await writeFixture(workspace, "servers/api/features/identity/index.ts", "export {};\n");
  await writeFixture(
    workspace,
    "servers/api/features/workspace/integrations/workspaces.mongo.ts",
    "db.collection('workspaces').insertOne({ name: 'General' });\n"
  );

  assert.deepEqual(await validateModuleGovernance(workspace), []);
});

test("TC-01.4.06-S1-2: private db import fails with both module names and file", async (context) => {
  const workspace = await seedWorkspace(context);
  await writeFixture(workspace, "servers/api/features/workspace/domain/read.ts", "import '../../identity/db/users.js';\n");

  const findings = await validateModuleGovernance(workspace);
  const finding = findings.find(({ rule }) => rule === "module-private-import");
  assert.ok(finding, "expected the private module entry to be rejected");
  assert.match(finding.message, /Workspace/);
  assert.match(finding.message, /Identity/);
  assert.match(finding.message, /servers\/api\/features\/workspace\/domain\/read\.ts/);
});

test("TC-01.4.06-S1-3: foreign collection write fails with collection and owner", async (context) => {
  const workspace = await seedWorkspace(context);
  await writeFixture(
    workspace,
    "servers/api/features/workspace/integrations/users.mongo.ts",
    "db.collection('users').insertOne({ email: 'person@example.test' });\n"
  );

  const findings = await validateModuleGovernance(workspace);
  const finding = findings.find(({ rule }) => rule === "collection-owner");
  assert.ok(finding, "expected the foreign collection write to be rejected");
  assert.match(finding.message, /users/);
  assert.match(finding.message, /Identity/);
});
