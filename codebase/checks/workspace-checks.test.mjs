import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { checkMissingProjectManifests, checkTypeScriptConfiguration } from "./workspace-checks.mjs";

test("reports package-defined workspace units without a project manifest", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "repo-missing-manifest-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "apps", "web"), { recursive: true });
  await writeFile(path.join(root, "apps", "web", "package.json"), "{}", "utf8");
  const issues = await checkMissingProjectManifests({
    root,
    architecture: { foundation: { projectRoots: { apps: "app" }, ignoredDirectories: [] } },
    projects: []
  });
  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /apps\/web\/package.json has no project.json/);
});

test("requires configured strict TypeScript options in TypeScript workspace units", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "repo-typescript-config-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const projectRoot = path.join(root, "apps", "web");
  await mkdir(projectRoot, { recursive: true });
  await writeFile(path.join(projectRoot, "index.ts"), "export const value = 1;\n", "utf8");
  await writeFile(path.join(projectRoot, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true } }), "utf8");

  const issues = await checkTypeScriptConfiguration({
    root,
    architecture: {
      foundation: { ignoredDirectories: [] },
      typescript: { requiredCompilerOptions: ["strict", "noImplicitAny"] }
    },
    projects: [{ name: "web", root: "apps/web" }]
  });

  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /compilerOptions\.noImplicitAny/);
});

test("requires a tsconfig for TypeScript workspace units", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "repo-typescript-missing-config-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const projectRoot = path.join(root, "packages", "shared");
  await mkdir(projectRoot, { recursive: true });
  await writeFile(path.join(projectRoot, "index.ts"), "export {};\n", "utf8");

  const issues = await checkTypeScriptConfiguration({
    root,
    architecture: { foundation: { ignoredDirectories: [] }, typescript: { requiredCompilerOptions: ["strict"] } },
    projects: [{ name: "shared", root: "packages/shared" }]
  });

  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /has no tsconfig\.json/);
});
