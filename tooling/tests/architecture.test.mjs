import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function readRepoFile(...parts) {
  return readFileSync(path.join(repoRoot, ...parts), "utf8");
}

function markdownSection(text, heading) {
  const match = text.match(new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function assertArchitectureBoundary(text) {
  assert.match(text, /Implementation Planning: not created/i);
  assert.match(text, /Implementation: not started/i);
  assert.match(text, /Engineering tasks\/jobs: not created/i);
  assert.match(text, /API implementation: not created/i);
  assert.match(text, /Database implementation: not created/i);
  assert.match(text, /UI implementation: not created/i);
  assert.match(text, /Application source: not changed/i);
  assert.match(text, /Roles\/jobs\/skills: not created/i);
  assert.match(
    text,
    /Duplicate architecture\/backlog\/state\/contract\/traceability framework:\s+not created/i,
  );
}

test("Architecture workflow is agent-operated and not a standalone subsystem", () => {
  const workflow = readRepoFile(".agent", "workflows", "architecture.md");
  const spec = readRepoFile(".project", "specs", "SPEC-020-architecture-lifecycle-phase.md");
  const artifactTypes = readRepoFile(".project", "ARTIFACT-TYPES.md");
  const packageJson = readRepoFile("package.json");

  assert.match(workflow, /agent performs Architecture directly/i);
  assert.match(workflow, /no Architecture\s+CLI, engine, registry, manager, state machine/i);
  assert.match(spec, /Evidence-First Architecture/i);
  assert.match(spec, /Feature Mapping/i);
  assert.match(artifactTypes, /Architecture\s+\|\s+`ARCH-`/i);
  assert.match(packageJson, /"test:architecture"/);
  assert.doesNotMatch(workflow, /architecture\.mjs|ArchitectureEngine|ArchitectureManager/i);
  assert.doesNotMatch(spec, /ArchitectureRegistry|ArchitectureStateMachine|FEATURE-\d+/i);
});

test("actual ARCH-001 consumes Discovery, Specification, Decomposition, and backlog Features", () => {
  const architecture = readRepoFile(
    ".project",
    "architecture",
    "ARCH-001-personal-notes-baseline.md",
  );

  assert.match(architecture, /^id: ARCH-001/m);
  assert.match(architecture, /^type: architecture/m);
  assert.match(architecture, /^status: complete/m);
  assert.match(markdownSection(architecture, "Inputs"), /DISC-001/);
  assert.match(markdownSection(architecture, "Inputs"), /SPEC-018/);
  assert.match(markdownSection(architecture, "Inputs"), /DECOMP-001/);
  assert.match(markdownSection(architecture, "Inputs"), /BACKLOG-013/);
  assert.match(markdownSection(architecture, "Inputs"), /BACKLOG-014/);
  assert.match(markdownSection(architecture, "Inputs"), /BACKLOG-015/);
  assert.match(markdownSection(architecture, "Inputs"), /BACKLOG-016/);
  assert.match(
    markdownSection(architecture, "Traceability"),
    /DISC-001 -> SPEC-018 -> DECOMP-001 -> ARCH-001/i,
  );
});

test("actual ARCH-001 maps every decomposed Feature to architectural treatment", () => {
  const architecture = readRepoFile(
    ".project",
    "architecture",
    "ARCH-001-personal-notes-baseline.md",
  );
  const mapping = markdownSection(architecture, "Feature Mapping");

  for (const featureId of ["BACKLOG-014", "BACKLOG-015", "BACKLOG-016"]) {
    assert.match(mapping, new RegExp(featureId));
  }

  assert.match(mapping, /BACKLOG-014[\s\S]*web[\s\S]*API[\s\S]*domain[\s\S]*persistence/i);
  assert.match(mapping, /BACKLOG-015[\s\S]*authentication[\s\S]*owner-scoped/i);
  assert.match(mapping, /BACKLOG-016[\s\S]*authenticated workspace/i);
});

test("actual ARCH-001 is grounded in Discovery and targeted source evidence", () => {
  const architecture = readRepoFile(
    ".project",
    "architecture",
    "ARCH-001-personal-notes-baseline.md",
  );
  const currentState = markdownSection(architecture, "Current State");

  assert.match(currentState, /DISC-001/);
  assert.match(currentState, /PROJECT-test/);
  assert.match(currentState, /apps\/test\/web\/src\/app\/dashboard\/page\.tsx/);
  assert.match(currentState, /apps\/test\/web\/src\/app\/notes\/page\.tsx/);
  assert.match(
    currentState,
    /apps\/test\/web\/src\/lib\/notes-client\.tsx|apps\/test\/web\/src\/lib\/notes-client\.ts/,
  );
  assert.match(currentState, /servers\/test\/api\/src\/app\.ts/);
  assert.match(currentState, /servers\/test\/api\/src\/domains\/notes\/notes\.routes\.ts/);
  assert.match(currentState, /servers\/test\/api\/src\/domains\/notes\/notes\.service\.ts/);
  assert.match(currentState, /servers\/test\/api\/src\/domains\/notes\/notes\.model\.ts/);
});

test("actual ARCH-001 distinguishes current state from target architecture", () => {
  const architecture = readRepoFile(
    ".project",
    "architecture",
    "ARCH-001-personal-notes-baseline.md",
  );

  assert.match(markdownSection(architecture, "Current State"), /Current technical reality/i);
  assert.match(
    markdownSection(architecture, "Target State"),
    /Reuse the existing project-owned two-deployable architecture/i,
  );
  assert.match(
    markdownSection(architecture, "Target State"),
    /No new application, server, package/i,
  );
});

test("actual ARCH-001 records evidence-backed architecture decisions and trade-offs", () => {
  const architecture = readRepoFile(
    ".project",
    "architecture",
    "ARCH-001-personal-notes-baseline.md",
  );
  const decisions = markdownSection(architecture, "Decisions");
  const tradeOffs = markdownSection(architecture, "Trade-Offs");

  for (const decisionId of ["A001", "A002", "A003", "A004"]) {
    assert.match(decisions, new RegExp(`${decisionId}[\\s\\S]*Decision:`));
    assert.match(decisions, new RegExp(`${decisionId}[\\s\\S]*Evidence:`));
    assert.match(decisions, new RegExp(`${decisionId}[\\s\\S]*Rationale:`));
    assert.match(decisions, new RegExp(`${decisionId}[\\s\\S]*Affected Features:`));
  }

  assert.match(tradeOffs, /Reuse vs\. new construction[\s\S]*Reuse wins/i);
  assert.match(tradeOffs, /Simplicity vs\. extensibility[\s\S]*Simplicity wins/i);
  assert.match(tradeOffs, /Security vs\. convenience[\s\S]*owner isolation/i);
});

test("actual ARCH-001 does not assume one Feature equals one technical component", () => {
  const architecture = readRepoFile(
    ".project",
    "architecture",
    "ARCH-001-personal-notes-baseline.md",
  );
  const mapping = markdownSection(architecture, "Feature Mapping");

  assert.match(mapping, /not one-to-one/i);
  assert.match(mapping, /BACKLOG-014`\s+crosses web,\s+API, domain, and data boundaries/i);
  assert.match(
    mapping,
    /BACKLOG-014`\s+and `BACKLOG-015`\s+both use\s+the existing notes API\/domain\/persistence architecture/i,
  );
  assert.match(mapping, /No technical\s+component is created merely because a Feature exists/i);
});

test("actual ARCH-001 demonstrates reuse behavior and preserves open decisions", () => {
  const architecture = readRepoFile(
    ".project",
    "architecture",
    "ARCH-001-personal-notes-baseline.md",
  );
  const target = markdownSection(architecture, "Target State");
  const risks = markdownSection(architecture, "Risks / Open Decisions");

  assert.match(target, /Reuse the existing project-owned two-deployable architecture/i);
  assert.match(target, /No new application, server, package, persistence store/i);
  assert.match(risks, /BACKLOG-009/);
  assert.match(risks, /BACKLOG-005/);
  assert.match(risks, /does not block/i);
  assert.match(risks, /Future search, tags, sharing/i);
});

test("actual ARCH-001 provides downstream handoff without implementation tasks", () => {
  const architecture = readRepoFile(
    ".project",
    "architecture",
    "ARCH-001-personal-notes-baseline.md",
  );
  const handoff = markdownSection(architecture, "Downstream Handoff");

  assert.match(handoff, /Feature-scoped System Design may use this information/i);
  assert.match(handoff, /existing `test` project-owned web\/API boundaries/i);
  assert.match(handoff, /This is not a System Design artifact, implementation plan/i);
  assert.doesNotMatch(handoff, /Task \d+|TASK-\d+|modify .*\.ts|create .* endpoint|write .* test/i);
});

test("actual ARCH-001 preserves implementation and framework boundaries", () => {
  const architecture = readRepoFile(
    ".project",
    "architecture",
    "ARCH-001-personal-notes-baseline.md",
  );

  assertArchitectureBoundary(markdownSection(architecture, "Boundary Check"));
  assert.doesNotMatch(architecture, /^## Implementation Plan$/im);
  assert.doesNotMatch(architecture, /^## Task Breakdown$/im);
  assert.doesNotMatch(architecture, /^## API Implementation$/im);
  assert.doesNotMatch(architecture, /ArchitectureEngine|ArchitectureRegistry|ArchitectureCLI/i);
  assert.doesNotMatch(architecture, /TASK-\d+|Modify .*\.tsx|Write endpoint|Create MongoDB index/i);
});

test("state and architecture metadata show Phase 5 complete and System Design handed off", () => {
  const state = readRepoFile(".project", "state", "PROJECT-STATE.md");
  const repoArchitecture = readRepoFile("architecture.yaml");
  const trace = readRepoFile(".project", "traces", "TRACE-027-architecture-phase.md");

  assert.match(state, /ARCH-001/);
  assert.match(state, /Architecture is complete with readiness for Feature-scoped System Design/i);
  assert.match(state, /SD-001/);
  assert.match(state, /ENG-001/);
  assert.match(state, /Implementation has not started/i);
  assert.match(repoArchitecture, /id: ARCHITECTURE/);
  assert.match(repoArchitecture, /SPEC-020/);
  assert.match(trace, /REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> ARCH-001/i);
  assert.match(trace, /No Implementation Planning, Implementation/i);
});

test("architecture behavior rejects invalid upstream chains", () => {
  const invalidSpec = architectFixture({
    discovery: { status: "complete" },
    specification: { status: "draft", readiness: "needs-clarification" },
    decomposition: { status: "complete", readiness: "ready-for-architecture" },
    backlogRows: [{ id: "BACKLOG-X001", level: "feature", status: "ready" }],
  });

  assert.equal(invalidSpec.status, "blocked");
  assert.equal(invalidSpec.next, "specification-clarification");

  const invalidDecomposition = architectFixture({
    discovery: { status: "complete" },
    specification: { status: "active", readiness: "ready-for-decomposition" },
    decomposition: { status: "needs-clarification", readiness: "blocked" },
    backlogRows: [{ id: "BACKLOG-X001", level: "feature", status: "ready" }],
  });

  assert.equal(invalidDecomposition.status, "blocked");
  assert.equal(invalidDecomposition.next, "decomposition-rework");

  const missingFeatures = architectFixture({
    discovery: { status: "complete" },
    specification: { status: "active", readiness: "ready-for-decomposition" },
    decomposition: { status: "complete", readiness: "ready-for-architecture" },
    backlogRows: [],
  });

  assert.equal(missingFeatures.status, "blocked");
  assert.equal(missingFeatures.next, "decomposition-rework");
});

test("architecture directory exists only because ARCH-001 is real", () => {
  assert.equal(existsSync(path.join(repoRoot, ".project", "architecture")), true);
  assert.equal(existsSync(path.join(repoRoot, ".agent", "roles", "system-architect")), false);
  assert.equal(existsSync(path.join(repoRoot, ".agent", "jobs", "architecture")), false);
});

function architectFixture({ discovery, specification, decomposition, backlogRows }) {
  if (discovery.status !== "complete") {
    return { status: "blocked", next: "discovery-rework" };
  }

  if (specification.status !== "active" || specification.readiness !== "ready-for-decomposition") {
    return { status: "blocked", next: "specification-clarification" };
  }

  if (decomposition.status !== "complete" || decomposition.readiness !== "ready-for-architecture") {
    return { status: "blocked", next: "decomposition-rework" };
  }

  if (!backlogRows.some((row) => row.level === "feature" && row.status === "ready")) {
    return { status: "blocked", next: "decomposition-rework" };
  }

  return {
    status: "complete",
    readiness: "ready-for-system-design",
    next: "implementation-planning",
  };
}
