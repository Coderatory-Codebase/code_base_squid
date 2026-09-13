import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultTasksByType = {
  app: {
    dev: { command: "npm run dev" },
    build: { command: "npm run build" },
    test: { command: "npm test" }
  },
  server: {
    dev: { command: "npm run dev" },
    build: { command: "npm run build" },
    test: { command: "npm test" }
  },
  package: {
    build: { command: "npm run build" },
    test: { command: "npm test" },
    lint: { command: "npm run lint" }
  },
  prebuilt: {
    check: { command: "npm run check" }
  }
};

export const createProjectManifest = ({ name, type, description = "" }) => ({
  name,
  type,
  description,
  internalDependencies: [],
  externalDependencies: [],
  capabilities: [],
  tasks: defaultTasksByType[type] ?? {}
});

export const generateProject = async ({ workspaceRoot, architecture, name, type }) => {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error("Project name must be lowercase kebab-case.");
  }
  const rootByProjectType = Object.fromEntries(
    Object.entries(architecture.foundation.projectRoots).map(([rootName, projectType]) => [projectType, rootName])
  );
  const rootName = rootByProjectType[type];

  if (!rootName) {
    throw new Error(`Unsupported project type: ${type}`);
  }

  const projectRoot = path.join(workspaceRoot, rootName, name);
  await mkdir(projectRoot, { recursive: true });

  const manifest = createProjectManifest({ name, type });
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(path.join(projectRoot, "project.json"), manifestText, { flag: "wx" });

  return { root: projectRoot, manifest };
};
