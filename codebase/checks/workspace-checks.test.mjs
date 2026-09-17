import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  checkMissingProjectManifests,
  checkTypeScriptArchitecture,
  checkTypeScriptConfiguration,
  checkTypeScriptTaskCoverage
} from "./workspace-checks.mjs";

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

test("requires lint and typecheck tasks plus ESLint configuration for TypeScript workspace units", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "repo-typescript-task-coverage-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const projectRoot = path.join(root, "apps", "web");
  await mkdir(projectRoot, { recursive: true });
  await writeFile(path.join(projectRoot, "index.ts"), "export const value = 1;\n", "utf8");

  const issues = await checkTypeScriptTaskCoverage({
    root,
    architecture: { foundation: { ignoredDirectories: [] } },
    projects: [{ name: "web", root: "apps/web", tasks: [{ name: "lint", command: "eslint ." }] }]
  });

  assert.equal(issues.length, 2);
  assert.ok(issues.some((issue) => issue.message.includes("typecheck task")));
  assert.ok(issues.some((issue) => issue.message.includes("eslint.config.mjs")));
});

test("rejects explicit any and environment defaults in TypeScript workspace units", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "repo-typescript-architecture-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const projectRoot = path.join(root, "apps", "web");
  await mkdir(path.join(projectRoot, "validation"), { recursive: true });
  await mkdir(path.join(projectRoot, "types"), { recursive: true });
  await writeFile(path.join(projectRoot, "types", "index.ts"), "export type Value = any;\n", "utf8");
  await writeFile(path.join(projectRoot, "validation", "env.validation.ts"), "const port = z.number().default(4000);\n", "utf8");

  const issues = await checkTypeScriptArchitecture({
    root,
    architecture: {
      foundation: { ignoredDirectories: [] },
      typescript: { disallowExplicitAny: true, requiredTypeBoundaryProjectTypes: ["app"] },
      configuration: {
        environmentValidationFile: "validation/env.validation.ts",
        forbidDefaultsInEnvironmentValidation: true,
        validationPackages: ["zod"]
      }
    },
    projects: [{ name: "web", type: "app", root: "apps/web" }]
  });

  assert.equal(issues.length, 2);
  assert.ok(issues.some((issue) => issue.message.includes("explicit any")));
  assert.ok(issues.some((issue) => issue.message.includes("embeds a default")));
});

test("requires type boundaries and keeps runtime schemas outside config", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "repo-type-boundary-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const projectRoot = path.join(root, "servers", "api");
  await mkdir(path.join(projectRoot, "config"), { recursive: true });
  await writeFile(path.join(projectRoot, "config", "env.ts"), "import { z } from 'zod';\nexport const schema = z.object({});\n", "utf8");

  const issues = await checkTypeScriptArchitecture({
    root,
    architecture: {
      foundation: { ignoredDirectories: [] },
      typescript: { disallowExplicitAny: true, requiredTypeBoundaryProjectTypes: ["server"] },
      configuration: {
        environmentValidationFile: "validation/env.validation.ts",
        forbidDefaultsInEnvironmentValidation: true,
        validationPackages: ["zod"]
      }
    },
    projects: [{ name: "api", type: "server", root: "servers/api" }]
  });

  assert.equal(issues.length, 2);
  assert.ok(issues.some((issue) => issue.message.includes("types/index.ts")));
  assert.ok(issues.some((issue) => issue.message.includes("inside config")));
});
