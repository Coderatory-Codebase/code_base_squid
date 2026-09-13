import { spawn } from "node:child_process";
import path from "node:path";
import { fingerprintTask, hasReusableTaskResult, recordTaskResult } from "../cache/task-cache.mjs";

const runCommand = ({ command, cwd, captureOutput }) => new Promise((resolve, reject) => {
  const child = spawn(command, {
    cwd,
    shell: true,
    env: process.env,
    stdio: captureOutput ? ["ignore", "pipe", "pipe"] : "inherit"
  });
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => { stdout += chunk; });
  child.stderr?.on("data", (chunk) => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", (exitCode, signal) => resolve({ exitCode: exitCode ?? 1, signal, stdout, stderr }));
});

export const executePlan = async ({ workspace, plan, dryRun = false, captureOutput = false }) => {
  const results = [];
  const dependencyFingerprints = new Map();
  const ignoredDirectories = new Set(workspace.architecture.foundation.ignoredDirectories ?? []);

  for (const task of plan) {
    if (dryRun) {
      results.push({ task: task.id, status: "planned", command: task.command });
      continue;
    }
    const fingerprint = await fingerprintTask({
      workspaceRoot: workspace.root,
      task,
      dependencyFingerprints,
      ignoredDirectories
    });
    dependencyFingerprints.set(task.id, fingerprint);
    if (await hasReusableTaskResult({ workspaceRoot: workspace.root, task, fingerprint })) {
      results.push({ task: task.id, status: "cached", exitCode: 0 });
      continue;
    }
    const result = await runCommand({
      command: task.command,
      cwd: path.resolve(workspace.root, task.projectRoot),
      captureOutput
    });
    await recordTaskResult({ workspaceRoot: workspace.root, task, fingerprint, exitCode: result.exitCode });
    results.push({ task: task.id, status: result.exitCode === 0 ? "passed" : "failed", ...result });
    if (result.exitCode !== 0) break;
  }
  return results;
};
