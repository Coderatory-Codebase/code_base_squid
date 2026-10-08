import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathExists, toPosixPath, walkFiles } from "../utilities/fs.mjs";

const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"]);
const importPattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)["']\s*\)/g;
const getImports = (source) => [...source.matchAll(importPattern)].map((match) => match[1] ?? match[2] ?? match[3]);
const normalize = (value) => toPosixPath(value).split("/").filter(Boolean);
const issue = (file, rule, message) => ({ level: "error", rule, file, message: `${file}: ${message}` });
const isTestFile = (filePath) => {
  const segments = normalize(filePath);
  return segments.includes("tests") || segments.includes("__tests__")
    || /\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(filePath);
};

const readPolicy = async (workspaceRoot, file, findings) => {
  const absolutePath = path.join(workspaceRoot, file);
  if (!(await pathExists(absolutePath))) {
    findings.push(issue(file, "module-policy-input", `required architecture register is missing: ${file}.`));
    return undefined;
  }
  try {
    return JSON.parse(await readFile(absolutePath, "utf8"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    findings.push(issue(file, "module-policy-input", `cannot read valid JSON from ${file}: ${detail}`));
    return undefined;
  }
};

const validateDependencyRegister = (register, file, findings) => {
  if (!register || register.version !== 1 || !Array.isArray(register.modules)) {
    findings.push(issue(file, "module-policy-shape", "expected version 1 and a modules array."));
    return undefined;
  }
  const byId = new Map();
  for (const module of register.modules) {
    if (!module || typeof module.id !== "string" || typeof module.name !== "string" || !Array.isArray(module.dependsOn)) {
      findings.push(issue(file, "module-policy-shape", "each module needs string id/name and a dependsOn array."));
      continue;
    }
    if (byId.has(module.id)) findings.push(issue(file, "module-policy-duplicate", `module ${module.id} is registered more than once.`));
    byId.set(module.id, module);
  }
  for (const module of byId.values()) {
    if (new Set(module.dependsOn).size !== module.dependsOn.length) {
      findings.push(issue(file, "module-policy-duplicate", `${module.name} repeats a dependency.`));
    }
    for (const dependency of module.dependsOn) {
      if (!byId.has(dependency)) findings.push(issue(file, "module-policy-binding", `${module.name} depends on unregistered module ${dependency}.`));
      if (dependency === module.id) findings.push(issue(file, "module-policy-cycle", `${module.name} cannot depend on itself.`));
    }
  }
  for (const dependency of register.foundationDependencies ?? []) {
    if (!byId.has(dependency)) findings.push(issue(file, "module-policy-binding", `foundation dependency ${dependency} is not registered.`));
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (id, chain) => {
    if (visiting.has(id)) {
      findings.push(issue(file, "module-policy-cycle", `dependency cycle: ${[...chain, id].join(" -> ")}.`));
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const module = byId.get(id);
    for (const dependency of module?.dependsOn ?? []) if (byId.has(dependency)) visit(dependency, [...chain, id]);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of byId.keys()) visit(id, []);
  return byId;
};

const validateCollectionRegister = (register, modules, file, findings) => {
  if (!register || register.version !== 1 || !Array.isArray(register.collections)) {
    findings.push(issue(file, "collection-policy-shape", "expected version 1 and a collections array."));
    return undefined;
  }
  const byName = new Map();
  for (const collection of register.collections) {
    if (!collection || typeof collection.name !== "string" || typeof collection.owner !== "string") {
      findings.push(issue(file, "collection-policy-shape", "each collection needs string name and owner fields."));
      continue;
    }
    if (byName.has(collection.name)) findings.push(issue(file, "collection-policy-owner", `collection ${collection.name} has more than one writing owner.`));
    if (!modules.has(collection.owner)) findings.push(issue(file, "collection-policy-binding", `${collection.name} names unregistered owner ${collection.owner}.`));
    byName.set(collection.name, collection);
  }

  return byName;
};

const validateExceptionRegister = (register, collections, modules, file, findings) => {
  if (!register || register.version !== 1 || !Array.isArray(register.exceptions)) {
    findings.push(issue(file, "exception-policy-shape", "expected version 1 and an exceptions array."));
    return undefined;
  }
  const exceptionIds = new Set();
  for (const exception of register.exceptions) {
    if (!exception || typeof exception.id !== "string" || typeof exception.collection !== "string") {
      findings.push(issue(file, "exception-policy-shape", "each exception needs an id and collection."));
      continue;
    }
    if (exceptionIds.has(exception.id)) findings.push(issue(file, "exception-policy-binding", `exception ${exception.id} is duplicated.`));
    exceptionIds.add(exception.id);
    const owner = collections.get(exception.collection)?.owner;
    if (!owner || owner !== exception.owner) findings.push(issue(file, "exception-policy-binding", `${exception.id} owner must match registered owner ${owner ?? "(missing)"} of ${exception.collection}.`));
    if (!["open", "closed"].includes(exception.status)) findings.push(issue(file, "exception-policy-binding", `${exception.id} status must be open or closed.`));
    if (exception.expiresAt !== null && (typeof exception.expiresAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(exception.expiresAt) || Number.isNaN(Date.parse(`${exception.expiresAt}T00:00:00Z`)))) {
      findings.push(issue(file, "exception-policy-binding", `${exception.id} expiresAt must be an ISO date or null.`));
    }
    if (!Array.isArray(exception.operations) || exception.operations.length === 0) {
      findings.push(issue(file, "exception-policy-binding", `${exception.id} must name its permitted operations.`));
    }
    const writers = [exception.writer, exception.relayWriter].filter((value) => typeof value === "string");
    if (writers.some((writer) => !modules.has(writer))) {
      findings.push(issue(file, "exception-policy-binding", `${exception.id} names an unregistered writer.`));
    }
    if (exception.writers !== undefined && exception.writers !== "all-modules") {
      findings.push(issue(file, "exception-policy-binding", `${exception.id} has an unsupported writers scope.`));
    }
    if (exception.writers === "all-modules" && !Array.isArray(exception.operations)) {
      findings.push(issue(file, "exception-policy-binding", `${exception.id} must define operations for its all-module scope.`));
    }
  }
  return new Map(register.exceptions.map((exception) => [exception.id, exception]));
};

const moduleForPath = (workspaceRoot, filePath, modules, dependencyRegister) => {
  const relativeSegments = normalize(path.relative(workspaceRoot, filePath));
  const kernelRoot = normalize(dependencyRegister.sharedKernel?.packageRoot ?? "packages/kernel");
  if (kernelRoot.every((segment, index) => relativeSegments[index] === segment)) {
    return modules.get(dependencyRegister.sharedKernel?.id ?? "shared-kernel");
  }
  const featureIndex = relativeSegments.indexOf(dependencyRegister.featureRoot ?? "features");
  return featureIndex >= 0 ? modules.get(relativeSegments[featureIndex + 1]) : undefined;
};

const resolveWorkspaceImport = ({ workspaceRoot, projectRoot, sourceFile, specifier }) => {
  if (specifier.startsWith(".")) return path.resolve(path.dirname(sourceFile), specifier);
  if (specifier.startsWith("@/")) return path.resolve(workspaceRoot, projectRoot, specifier.slice(2));
  const firstSegment = specifier.split("/")[0];
  if (["apps", "servers", "packages", "prebuilt"].includes(firstSegment)) return path.resolve(workspaceRoot, specifier);
  return undefined;
};

const packageExports = async (workspaceRoot, project) => {
  const packageJsonPath = path.join(workspaceRoot, project.root, "package.json");
  if (!(await pathExists(packageJsonPath))) return undefined;
  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    return typeof packageJson.name === "string"
      ? { name: packageJson.name, exports: Object.keys(packageJson.exports ?? { ".": true }) }
      : undefined;
  } catch {
    return undefined;
  }
};

const packageExported = (specifier, descriptor) => {
  if (!descriptor || !(specifier === descriptor.name || specifier.startsWith(`${descriptor.name}/`))) return false;
  const subpath = specifier === descriptor.name ? "." : `./${specifier.slice(descriptor.name.length + 1)}`;
  return descriptor.exports.some((key) => key === subpath || (key.endsWith("/*") && subpath.startsWith(key.slice(0, -1))));
};

const featureImportIsPublic = (workspaceRoot, targetPath, moduleId, register) => {
  const segments = normalize(path.relative(workspaceRoot, targetPath));
  const featureIndex = segments.indexOf(register.featureRoot ?? "features");
  if (featureIndex < 0 || segments[featureIndex + 1] !== moduleId) return false;
  const remainder = segments.slice(featureIndex + 2).join("/").replace(/\.[^/.]+$/, "");
  return remainder === "" || remainder === "index" || remainder === "public";
};

const collectionMarkers = (source) => {
  const found = [];
  const declarationPattern = /\bcollection\s*:\s*["']([^"']+)["']/g;
  for (const match of source.matchAll(declarationPattern)) found.push({ name: match[1], operation: "declare", offset: match.index ?? 0 });

  const modelPattern = /\bmodel(?:\s*<[^>]*>)?\s*\(([^)]*)\)/gs;
  for (const match of source.matchAll(modelPattern)) {
    const argumentsList = match[1].split(",");
    const collection = argumentsList[2]?.trim().match(/^["']([^"']+)["']$/)?.[1];
    if (collection) found.push({ name: collection, operation: "declare", offset: match.index ?? 0 });
  }

  const accessPattern = /\.collection(?:\s*<[^>]+>)?\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const match of source.matchAll(accessPattern)) {
    const end = (match.index ?? 0) + match[0].length;
    const tail = source.slice(end, end + 500);
    const operationMatch = tail.match(/\.(insertOne|insertMany|create|updateOne|updateMany|findOneAndUpdate|replaceOne|deleteOne|deleteMany)\s*\(/);
    const method = operationMatch?.[1];
    const operation = method && ["insertOne", "insertMany", "create"].includes(method)
      ? "append"
      : method && ["updateOne", "updateMany", "findOneAndUpdate", "replaceOne"].includes(method)
        ? "update"
        : "reference";
    const updateStart = operationMatch ? tail.indexOf("(", operationMatch.index) + 1 : -1;
    const updateFields = operation === "update" && updateStart >= 0
      ? extractUpdateFields(tail.slice(updateStart))
      : [];
    found.push({ name: match[1], operation, fields: updateFields, offset: match.index ?? 0 });
  }
  return found;
};

const extractUpdateFields = (source) => {
  const update = source.match(/,\s*\{([\s\S]*?)\}\s*\)/)?.[1];
  if (!update) return [];
  if (/\$(?!set\b)[\w]+\s*:/.test(update)) return [];
  const set = update.match(/\$set\s*:\s*\{([^{}]*)\}/)?.[1];
  if (!set) return [];
  return [...set.matchAll(/["']?([A-Za-z_$][\w$]*)["']?\s*:/g)].map((match) => match[1]);
};

const insideTransaction = (source, offset) => {
  const calls = [...source.matchAll(/(?:\.\s*)?withTransaction\s*\(/g)];
  return calls.some((call) => {
    const open = source.indexOf("{", (call.index ?? 0) + call[0].length);
    if (open < 0 || open > offset) return false;
    let depth = 0;
    for (let index = open; index < source.length; index += 1) {
      if (source[index] === "{") depth += 1;
      if (source[index] === "}" && --depth === 0) return offset >= open && offset < index;
    }
    return false;
  });
};

const exceptionAllows = ({ exceptions, moduleId, collection, operation, fields, transactional, now }) => exceptions.some((exception) => {
  const expired = exception.expiresAt !== null && Date.parse(`${exception.expiresAt}T00:00:00Z`) <= now;
  if (exception.status !== "open" || expired || exception.collection !== collection || !exception.operations.includes(operation)) return false;
  if (exception.writers === "all-modules" && operation === "append") return transactional;
  if (exception.writer === moduleId && operation === "update") {
    return fields.length > 0 && fields.every((field) => exception.fields?.includes(field));
  }
  return exception.relayWriter === moduleId && operation === "update"
    && fields.length > 0 && fields.every((field) => exception.relayFields?.includes(field));
});

export const validateModuleGovernance = async (workspace) => {
  const findings = [];
  const dependenciesFile = "architecture/deps.json";
  const collectionsFile = "architecture/collections.json";
  const exceptionsFile = "architecture/exceptions.json";
  const dependencyRegister = await readPolicy(workspace.root, dependenciesFile, findings);
  if (!dependencyRegister) return findings;
  const modules = validateDependencyRegister(dependencyRegister, dependenciesFile, findings);
  if (!modules) return findings;
  const collectionRegister = await readPolicy(workspace.root, collectionsFile, findings);
  if (!collectionRegister) return findings;
  const collections = validateCollectionRegister(collectionRegister, modules, collectionsFile, findings);
  if (!collections) return findings;
  const exceptionRegister = await readPolicy(workspace.root, exceptionsFile, findings);
  if (!exceptionRegister) return findings;
  validateExceptionRegister(exceptionRegister, collections, modules, exceptionsFile, findings);
  const exceptions = exceptionRegister.exceptions ?? [];
  const now = typeof workspace.now === "function" ? workspace.now().getTime() : Date.now();

  const projectsWithPackages = await Promise.all(workspace.projects.map(async (project) => ({
    ...project,
    package: await packageExports(workspace.root, project)
  })));
  const kernelProject = projectsWithPackages.find((project) => project.root === dependencyRegister.sharedKernel?.packageRoot);
  const kernelPackageName = kernelProject?.package?.name;
  const kernelModule = modules.get(dependencyRegister.sharedKernel?.id ?? "shared-kernel");
  const collectionFindings = new Set();

  for (const project of projectsWithPackages) {
    const projectRoot = path.resolve(workspace.root, project.root);
    const files = (await walkFiles(projectRoot, {
      ignoredDirectories: new Set(workspace.architecture?.foundation?.ignoredDirectories ?? [])
    })).filter((filePath) => sourceExtensions.has(path.extname(filePath)));
    for (const filePath of files) {
      const relativeFile = toPosixPath(path.relative(workspace.root, filePath));
      const sourceModule = moduleForPath(workspace.root, filePath, modules, dependencyRegister);
      if (!sourceModule) continue;
      const source = await readFile(filePath, "utf8");
      const moduleName = sourceModule.name;

      if (normalize(filePath).includes("domain")) {
        for (const specifier of getImports(source)) {
          if (specifier.startsWith("next/")) {
            findings.push(issue(relativeFile, "module-domain-framework-import", `${moduleName} domain code imports forbidden next/* package ${specifier} (ARC-001).`));
          }
        }
      }

      for (const specifier of getImports(source)) {
        let targetModule;
        let isPublic = false;
        let targetPath = resolveWorkspaceImport({
          workspaceRoot: workspace.root,
          projectRoot: project.root,
          sourceFile: filePath,
          specifier
        });

        if (kernelPackageName && (specifier === kernelPackageName || specifier.startsWith(`${kernelPackageName}/`))) {
          targetModule = kernelModule;
          isPublic = packageExported(specifier, kernelProject.package);
        } else if (targetPath) {
          targetModule = moduleForPath(workspace.root, targetPath, modules, dependencyRegister);
          if (targetModule) isPublic = featureImportIsPublic(workspace.root, targetPath, targetModule.id, dependencyRegister);
        }
        if (!targetModule || targetModule.id === sourceModule.id) continue;

        const allowedDependencies = new Set([
          ...sourceModule.dependsOn,
          ...(dependencyRegister.foundationDependencies ?? [])
        ]);
        if (!allowedDependencies.has(targetModule.id)) {
          findings.push(issue(relativeFile, "module-dependency", `${moduleName} imports module ${targetModule.name}, which is not in its allowed dependency list.`));
        }
        if (!isPublic) {
          findings.push(issue(relativeFile, "module-private-import", `${moduleName} imports private internals of module ${targetModule.name}; use its published interface.`));
        }
      }

      if (isTestFile(filePath)) continue;
      for (const access of collectionMarkers(source)) {
        const ownership = collections.get(access.name);
        const key = `${sourceModule.id}:${relativeFile}:${access.name}`;
        if (collectionFindings.has(key)) continue;
        if (!ownership) {
          collectionFindings.add(key);
          findings.push(issue(relativeFile, "collection-policy-binding", `${moduleName} gateway names unregistered collection ${access.name}; its owner is unknown.`));
          continue;
        }
        if (ownership.owner === sourceModule.id) continue;
        if (exceptionAllows({ exceptions, moduleId: sourceModule.id, collection: access.name, operation: access.operation, fields: access.fields ?? [], transactional: insideTransaction(source, access.offset), now })) continue;
        collectionFindings.add(key);
        const ownerName = modules.get(ownership.owner)?.name ?? ownership.owner;
        const matchingException = exceptions.find((exception) => exception.collection === access.name);
        const exceptionDetail = matchingException
          ? `; ${matchingException.id} does not cover this module and operation (its outbox exception is append-only)`
          : "";
        findings.push(issue(relativeFile, "collection-owner", `${moduleName} gateway names collection ${access.name}, owned by ${ownerName}${exceptionDetail}.`));
      }
    }
  }

  return findings;
};
