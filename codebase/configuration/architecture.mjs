import path from "node:path";
import { readJsonFile } from "../utilities/fs.mjs";

export const architectureFileName = "architecture.yaml";

export const readArchitecture = async (workspaceRoot) => {
  const filePath = path.join(workspaceRoot, architectureFileName);

  try {
    return await readJsonFile(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load architecture policy: ${message}`);
  }
};

export const createArchitectureContext = (architecture) => {
  const foundation = architecture?.foundation ?? {};
  const asArray = (value) => Array.isArray(value) ? value : [];
  const projectRootConfiguration = foundation.projectRoots && typeof foundation.projectRoots === "object" && !Array.isArray(foundation.projectRoots)
    ? foundation.projectRoots
    : {};
  return {
    ignoredDirectories: new Set(asArray(foundation.ignoredDirectories)),
    projectTypeByRoot: projectRootConfiguration,
    projectRoots: Object.keys(projectRootConfiguration),
    requiredRoots: asArray(foundation.requiredRoots),
    requiredFiles: asArray(foundation.requiredFiles)
  };
};

export const validateArchitectureConfiguration = (architecture) => {
  const issues = [];
  if (!architecture || typeof architecture !== "object") {
    return [{ level: "error", message: "Architecture policy must be an object." }];
  }
  if (!Number.isInteger(architecture.version) || architecture.version < 1) {
    issues.push({ level: "error", message: "Architecture policy requires a positive integer version." });
  }
  if (!architecture.foundation || typeof architecture.foundation !== "object") {
    issues.push({ level: "error", message: "Architecture policy is missing foundation configuration." });
    return issues;
  }
  const roots = architecture.foundation.projectRoots;
  if (!roots || typeof roots !== "object" || Array.isArray(roots)) {
    issues.push({ level: "error", message: "Architecture policy requires a projectRoots object." });
  } else {
    for (const [root, type] of Object.entries(roots)) {
      if (!root || root.includes("..") || path.isAbsolute(root)) {
        issues.push({ level: "error", message: `Invalid workspace unit root: ${root || "(empty)"}.` });
      }
      if (!["app", "server", "package", "prebuilt"].includes(type)) {
        issues.push({ level: "error", message: `Workspace unit root ${root} has invalid type ${type}.` });
      }
    }
  }
  for (const field of ["requiredRoots", "requiredFiles", "ignoredDirectories", "disallowedOrchestrators"]) {
    const value = architecture.foundation[field];
    if (value !== undefined && !Array.isArray(value)) {
      issues.push({ level: "error", message: `Architecture foundation.${field} must be an array.` });
    }
  }
  if (!architecture.boundaries || typeof architecture.boundaries !== "object") {
    issues.push({ level: "error", message: "Architecture policy is missing boundary configuration." });
  }
  if (architecture.workspaceModel?.repositoryIsWorkspace !== true || architecture.workspaceModel?.mandatoryProjectNamespace !== false) {
    issues.push({ level: "error", message: "Architecture workspace model must define the repository as the workspace without a mandatory project namespace." });
  }
  if (architecture.featureModel?.ownership !== "feature-first" || architecture.featureModel?.serverLayout !== "flat-files-by-default") {
    issues.push({ level: "error", message: "Architecture feature model must be feature-first with flat server files by default." });
  }
  return issues;
};
