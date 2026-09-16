import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { checkMissingProjectManifests } from "./workspace-checks.mjs";

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
