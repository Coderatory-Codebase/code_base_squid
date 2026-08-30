#!/usr/bin/env node
// Deterministic check of the two parts of architecture.yaml's boundary
// model that don't require any application source to verify: forbidden
// top-level directories, and undeclared top-level directories. See
// .project/specs/SPEC-009-repository-structure-git-governance-and-quality-enforcement.md
// -> "Architecture validation" for scope and limits — this does not (and
// cannot yet) check dependency direction or ownership; nothing exists
// under apps/servers/agents/packages/ to check yet.
//
// Deliberately parses architecture.yaml with small, targeted regexes
// rather than adding a YAML-parsing dependency for one controlled,
// self-authored file — see .agent/instructions/implementation.md ->
// "Extend before adding". Revisit if architecture.yaml's shape stops
// being this regular.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const architectureYaml = readFileSync(path.join(repoRoot, "architecture.yaml"), "utf8");

// Directories that exist for reasons this model doesn't govern (VCS,
// editor/agent tooling, package manager state) — never boundary or
// forbidden-dir candidates.
const NOT_BOUNDARIES = new Set([".git", ".github", ".claude", "node_modules"]);

function extractSection(text, startMarker, endMarkers) {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return "";
  const afterStart = text.slice(startIndex + startMarker.length);
  let endIndex = afterStart.length;
  for (const marker of endMarkers) {
    const found = afterStart.indexOf(marker);
    if (found !== -1 && found < endIndex) endIndex = found;
  }
  return afterStart.slice(0, endIndex);
}

function extractBoundaryPaths(text) {
  const section = extractSection(text, "\nboundaries:", ["\nforbidden_top_level_dirs:"]);
  const matches = [...section.matchAll(/- path:\s*([^\s#]+)/g)];
  return matches.map((m) => m[1].replace(/\/$/, ""));
}

function extractForbiddenDirs(text) {
  const section = extractSection(text, "\nforbidden_top_level_dirs:", ["\ndependency_direction:"]);
  const matches = [...section.matchAll(/^\s*-\s+([a-zA-Z0-9_-]+)\s*$/gm)];
  return matches.map((m) => m[1]);
}

function actualTopLevelDirs() {
  return readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith(".") || name === ".agent" || name === ".project")
    .filter((name) => !NOT_BOUNDARIES.has(name));
}

function main() {
  const boundaryDirs = new Set(extractBoundaryPaths(architectureYaml));
  const forbiddenDirs = extractForbiddenDirs(architectureYaml);
  const actualDirs = actualTopLevelDirs();

  const problems = [];

  for (const dir of forbiddenDirs) {
    if (actualDirs.includes(dir)) {
      problems.push(
        `"${dir}/" exists but is forbidden (architecture.yaml -> forbidden_top_level_dirs).`,
      );
    }
  }

  for (const dir of actualDirs) {
    if (!boundaryDirs.has(dir)) {
      problems.push(
        `"${dir}/" exists at the repository root but is not a declared boundary ` +
          `(architecture.yaml -> boundaries). A new top-level directory is an ` +
          `architectural decision — see .agent/instructions/boundaries.md.`,
      );
    }
  }

  if (problems.length === 0) {
    console.log(
      `validate:architecture — ${actualDirs.length} top-level director${actualDirs.length === 1 ? "y" : "ies"} checked, all declared, none forbidden.`,
    );
    process.exit(0);
  }

  console.error("\nvalidate:architecture — boundary violation(s):\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error();
  process.exit(1);
}

main();
