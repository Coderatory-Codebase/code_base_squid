import path from "node:path";
import { readFile } from "node:fs/promises";
import { toPosixPath, walkFiles } from "../utilities/fs.mjs";

const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"]);
const importPattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)["']\s*\)/g;

const getImports = (source) => [...source.matchAll(importPattern)].map((match) => match[1] ?? match[2] ?? match[3]);
const segmentsOf = (value) => toPosixPath(value).split("/").filter(Boolean);
const includesSegment = (segments, candidates) => segments.some((segment) => candidates.includes(segment));
const fileRole = (filePath) => {
  const match = path.basename(filePath).match(/\.([a-z]+)(?:\.[cm]?[jt]sx?)?$/i);
  return match?.[1]?.toLowerCase();
};

const resolveWorkspaceImport = ({ workspaceRoot, sourceFile, specifier }) => {
  if (specifier.startsWith(".")) return path.resolve(path.dirname(sourceFile), specifier);
  const firstSegment = specifier.split("/")[0];
  if (["apps", "servers", "packages", "prebuilt"].includes(firstSegment)) {
    return path.resolve(workspaceRoot, specifier);
  }
  return undefined;
};

const featureIdentity = (segments) => {
  const index = segments.indexOf("features");
  return index >= 0 && segments[index + 1]
    ? { name: segments[index + 1], index }
    : undefined;
};

const issue = (workspaceRoot, sourceFile, specifier, rule, detail) => ({
  level: "error",
  rule,
  file: toPosixPath(path.relative(workspaceRoot, sourceFile)),
  message: `${toPosixPath(path.relative(workspaceRoot, sourceFile))} imports "${specifier}": ${detail}`
});

export const validateArchitectureBoundaries = async (workspace) => {
  const policy = workspace.architecture.boundaries ?? {};
  const dependencyDirection = {
    app: ["servers", "prebuilt"],
    server: ["apps", "prebuilt"],
    package: policy.packagesCannotImport ?? ["apps", "servers", "prebuilt"],
    ...(policy.workspaceUnitCannotImport ?? {})
  };
  const ignoredDirectories = new Set(workspace.architecture.foundation?.ignoredDirectories ?? []);
  const projectFiles = await Promise.all(workspace.projects.map(async (project) => {
    const root = path.resolve(workspace.root, project.root);
    const files = await walkFiles(root, { ignoredDirectories });
    return files
      .filter((filePath) => sourceExtensions.has(path.extname(filePath)))
      .map((filePath) => ({ project, filePath }));
  }));
  const findings = [];

  for (const { project, filePath } of projectFiles.flat()) {
    const source = await readFile(filePath, "utf8");
    const sourceSegments = segmentsOf(path.relative(workspace.root, filePath));
    const sourceFeature = featureIdentity(sourceSegments);

    for (const specifier of getImports(source)) {
      const targetPath = resolveWorkspaceImport({ workspaceRoot: workspace.root, sourceFile: filePath, specifier });
      const targetSegments = targetPath ? segmentsOf(path.relative(workspace.root, targetPath)) : [];
      const targetFileRole = targetPath ? fileRole(targetPath) : undefined;

      const forbiddenRoots = dependencyDirection[project.type] ?? [];
      if (targetSegments.length > 0 && forbiddenRoots.includes(targetSegments[0])) {
        const rule = project.type === "package" ? "packages-dependency-direction" : `${project.type}-dependency-direction`;
        findings.push(issue(workspace.root, filePath, specifier, rule, `${project.type} workspace units cannot import ${targetSegments[0]} workspace units.`));
      }

      if (sourceSegments.includes("domain")) {
        const externalRoot = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
        const importsForbiddenRole = (policy.domainCannotImportFileRoles ?? []).includes(targetFileRole);
        if ((policy.domainCannotImportPackages ?? []).includes(externalRoot) || includesSegment(targetSegments, policy.domainCannotImportSegments ?? []) || importsForbiddenRole) {
          findings.push(issue(workspace.root, filePath, specifier, "domain-isolation", "domain code cannot depend on protocol, persistence-model, or infrastructure implementation details."));
        }
      }

      if (includesSegment(sourceSegments, policy.uiSegments ?? []) && (includesSegment(targetSegments, policy.persistenceSegments ?? []) || (policy.persistenceFileRoles ?? []).includes(targetFileRole))) {
        findings.push(issue(workspace.root, filePath, specifier, "ui-persistence-boundary", "UI code cannot import persistence implementation directly."));
      }

      const sourceIsService = sourceSegments.includes("services") || fileRole(filePath) === "service";
      const serviceImportsForbiddenRole = (policy.serviceCannotImportFileRoles ?? []).includes(targetFileRole);
      if (sourceIsService && (includesSegment(targetSegments, policy.serviceCannotImportSegments ?? ["routes", "controllers", "ui", "components"]) || serviceImportsForbiddenRole)) {
        findings.push(issue(workspace.root, filePath, specifier, "service-isolation", "service code cannot depend on delivery or UI layers."));
      }

      const targetFeature = featureIdentity(targetSegments);
      if (sourceFeature && targetFeature && sourceFeature.name !== targetFeature.name) {
        const targetRemainder = targetSegments.slice(targetFeature.index + 2);
        const targetsPublicModule = targetRemainder.length === 1 && /^public(?:\.[^.]+)?$/.test(targetRemainder[0]);
        if (!targetsPublicModule) {
          findings.push(issue(workspace.root, filePath, specifier, "feature-private-import", `feature ${sourceFeature.name} cannot import private internals of feature ${targetFeature.name}; expose an explicit public module.`));
        }
      }
    }
  }

  return findings;
};
