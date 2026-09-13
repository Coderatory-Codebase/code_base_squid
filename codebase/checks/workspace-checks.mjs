import path from "node:path";
import { projectManifestFileName, validateProjectManifest } from "../projects/manifest.mjs";
import { workspaceRoots } from "../workspace/discovery.mjs";
import { createDependencyGraph, findGraphIssues, topologicalProjectOrder } from "../graph/dependency-graph.mjs";
import { pathExists } from "../utilities/fs.mjs";
import { validateArchitectureBoundaries } from "../validators/architecture-boundaries.mjs";
import { createExecutionPlan, listTasks } from "../execution/tasks.mjs";

export const checkWorkspaceStructure = async (workspace) => {
  const missingRoots = workspace.roots
    .filter((root) => !root.exists)
    .map((root) => ({ level: "error", message: `Missing required root directory: ${root.name}` }));

  const rootFileStatuses = await Promise.all(
    workspace.architecture.foundation.requiredFiles.map(async (fileName) => ({
      fileName,
      exists: await pathExists(path.join(workspace.root, fileName))
    }))
  );

  const missingRootFiles = rootFileStatuses
    .filter((file) => !file.exists)
    .map((file) => ({ level: "error", message: `Missing required root file: ${file.fileName}` }));

  return [...missingRoots, ...missingRootFiles];
};

export const checkProjectManifests = (workspace) =>
  workspace.projects.flatMap((project) => validateProjectManifest(project));

export const checkProjectRegistry = (workspace) => {
  const issues = [];
  const projectsByName = new Map();
  const expectedTypes = workspace.architecture.foundation.projectRoots;

  for (const project of workspace.projects) {
    const existing = projectsByName.get(project.name);
    if (existing) {
      issues.push({ level: "error", message: `Duplicate project name ${project.name}: ${existing.root} and ${project.root}.` });
    } else {
      projectsByName.set(project.name, project);
    }
    const rootName = project.root.split("/")[0];
    if (expectedTypes[rootName] !== project.type) {
      issues.push({ level: "error", message: `${project.name} is type ${project.type} but its root ${rootName}/ owns ${expectedTypes[rootName] ?? "no project type"}.` });
    }
    if (project.internalDependencies.includes(project.name)) {
      issues.push({ level: "error", message: `${project.name} cannot depend on itself.` });
    }
    for (const field of ["internalDependencies", "externalDependencies", "capabilities"]) {
      const values = project[field];
      if (new Set(values).size !== values.length) {
        issues.push({ level: "error", message: `${project.name} contains duplicate values in ${field}.` });
      }
    }
  }
  return issues;
};

export const checkDependencyGraph = (workspace) => {
  const graph = createDependencyGraph(workspace.projects);
  const graphIssues = findGraphIssues(graph);
  const order = topologicalProjectOrder(graph);
  const cycleIssues = order.cycles.map((name) => ({
    level: "error",
    message: `Project dependency cycle includes ${name}.`
  }));

  return [...graphIssues, ...cycleIssues];
};

export const checkReservedControlPlaneDependencies = async (workspace) => {
  const disallowed = new Set(workspace.architecture.foundation.disallowedOrchestrators ?? []);
  const packageJsonPath = path.join(workspace.root, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return [];
  }

  const { readJsonFile } = await import("../utilities/fs.mjs");
  const packageJson = await readJsonFile(packageJsonPath);
  const dependencyNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {})
  ];

  return dependencyNames
    .filter((name) => disallowed.has(name))
    .map((name) => ({
      level: "error",
      message: `Disallowed monorepo orchestration dependency found in root package.json: ${name}`
    }));
};

export const checkTaskGraph = (workspace) => {
  const graph = createDependencyGraph(workspace.projects);
  const tasks = listTasks(workspace.projects);
  const messages = new Set();
  for (const task of tasks) {
    try {
      createExecutionPlan({ graph, projects: workspace.projects, tasks, taskName: task.id });
    } catch (error) {
      messages.add(error instanceof Error ? error.message : String(error));
    }
  }
  return [...messages].map((message) => ({ level: "error", message }));
};

export const runWorkspaceChecks = async (workspace) => [
  ...(await checkWorkspaceStructure(workspace)),
  ...checkProjectManifests(workspace),
  ...checkProjectRegistry(workspace),
  ...checkDependencyGraph(workspace),
  ...checkTaskGraph(workspace),
  ...(await checkReservedControlPlaneDependencies(workspace)),
  ...(await validateArchitectureBoundaries(workspace))
];

export const requiredProjectManifestPath = (project) => `${project.root}/${projectManifestFileName}`;

export { workspaceRoots };
