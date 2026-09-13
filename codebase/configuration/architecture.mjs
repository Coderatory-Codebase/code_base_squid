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

export const createArchitectureContext = (architecture) => ({
  ignoredDirectories: new Set(architecture.foundation.ignoredDirectories ?? []),
  projectTypeByRoot: architecture.foundation.projectRoots ?? {},
  projectRoots: Object.keys(architecture.foundation.projectRoots ?? {}),
  requiredRoots: architecture.foundation.requiredRoots ?? [],
  requiredFiles: architecture.foundation.requiredFiles ?? []
});
