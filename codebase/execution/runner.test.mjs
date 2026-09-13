import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { executePlan } from "./runner.mjs";

test("executes a cacheable task once and reuses its result", async (context) => {
  const root = await mkdtemp(path.join(process.cwd(), ".test-tmp-runner-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const projectRoot = path.join(root, "packages", "fixture");
  await mkdir(projectRoot, { recursive: true });
  await writeFile(path.join(projectRoot, "task.mjs"), [
    "import { mkdir, readFile, writeFile } from 'node:fs/promises';",
    "await mkdir('dist', { recursive: true });",
    "const count = Number(await readFile('count.txt', 'utf8').catch(() => '0')) + 1;",
    "await writeFile('count.txt', String(count));",
    "await writeFile('dist/result.txt', 'complete');"
  ].join("\n"), "utf8");

  const workspace = {
    root,
    architecture: { foundation: { ignoredDirectories: [".repo-cache", "dist"] } }
  };
  const plan = [{
    id: "fixture:build",
    project: "fixture",
    projectRoot: "packages/fixture",
    name: "build",
    command: `"${process.execPath}" task.mjs`,
    inputs: ["task.mjs"],
    outputs: ["dist"],
    cache: true,
    taskDependencies: []
  }];

  const first = await executePlan({ workspace, plan, captureOutput: true });
  const second = await executePlan({ workspace, plan, captureOutput: true });
  assert.equal(first[0].status, "passed", first[0].stderr);
  assert.equal(second[0].status, "cached");
  assert.equal(await readFile(path.join(projectRoot, "count.txt"), "utf8"), "1");
});
