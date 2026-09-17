import { runDependencyScan } from "./dependency-scan.mjs";
import { runSecretScan } from "./secret-scan.mjs";

export const runWorkspaceScans = async (workspace, dependencies = {}) => {
  const minimumSeverity = workspace.architecture.security?.dependencyAudit?.minimumSeverity ?? "high";
  const [dependencyScan, secretScan] = await Promise.all([
    runDependencyScan({ workspaceRoot: workspace.root, minimumSeverity, ...dependencies }),
    runSecretScan({ workspaceRoot: workspace.root, ...dependencies })
  ]);
  const tools = [dependencyScan.result, secretScan.result];
  return {
    ok: tools.every(({ status }) => status === "passed"),
    tools,
    issues: [...dependencyScan.issues, ...secretScan.issues]
  };
};
