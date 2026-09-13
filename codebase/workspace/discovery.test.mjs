import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { discoverWorkspace } from "./discovery.mjs";

test("discovers projects nested below an ownership group", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "repo-discovery-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const architecture = {
    version: 1,
    foundation: {
      projectRoots: { apps: "app" },
      requiredRoots: ["apps"],
      requiredFiles: [],
      ignoredDirectories: ["node_modules"]
    },
    boundaries: {}
  };
  const projectRoot = path.join(root, "apps", "store", "web");
  await mkdir(projectRoot, { recursive: true });
  await writeFile(path.join(root, "architecture.yaml"), JSON.stringify(architecture), "utf8");
  await writeFile(path.join(projectRoot, "project.json"), JSON.stringify({
    name: "store-web",
    type: "app",
    tasks: {}
  }), "utf8");

  const workspace = await discoverWorkspace({ workspaceRoot: root });
  assert.equal(workspace.projects.length, 1);
  assert.equal(workspace.projects[0].root, "apps/store/web");
});
