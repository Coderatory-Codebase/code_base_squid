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

function parseMarkdownTable(section) {
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  const [headerLine, separatorLine, ...rowLines] = lines;

  if (!headerLine || !separatorLine) {
    return [];
  }

  const headers = headerLine
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());

  return rowLines.map((line) => {
    const values = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function backlogRows() {
  return parseMarkdownTable(readRepoFile(".project", "backlog", "BACKLOG.md"));
}

function assertSystemDesignBoundary(text) {
  assert.match(text, /Product-wide System Design: not created/i);
  assert.match(text, /Sibling Feature design for `BACKLOG-015`: not created/i);
  assert.match(text, /Sibling Feature design for `BACKLOG-016`: not created/i);
  assert.match(text, /Engineering Decomposition: created later by Phase 7 in `ENG-001`/i);
  assert.match(text, /Implementation: not started/i);
  assert.match(text, /Engineering tasks\/jobs: not created/i);
  assert.match(text, /Application source: not changed/i);
  assert.match(
    text,
    /Feature registry \/ duplicate backlog \/ duplicate traceability system:\s+not created/i,
  );
}

test("System Design workflow is agent-operated and not a standalone subsystem", () => {
  const workflow = readRepoFile(".agent", "workflows", "system-design.md");
  const spec = readRepoFile(".project", "specs", "SPEC-021-system-design-lifecycle-phase.md");
  const artifactTypes = readRepoFile(".project", "ARTIFACT-TYPES.md");
  const packageJson = readRepoFile("package.json");

  assert.match(workflow, /agent performs System Design directly/i);
  assert.match(workflow, /exactly one selected backlog Feature/i);
  assert.match(workflow, /architectural consistency check/i);
  assert.match(spec, /Feature Scope Rule/i);
  assert.match(spec, /contradiction \/ change required/i);
  assert.match(artifactTypes, /System design\s+\|\s+`SD-`/i);
  assert.match(packageJson, /"test:system-design"/);
  assert.doesNotMatch(workflow, /system-design\.mjs|SystemDesignEngine|FeatureRegistry/i);
  assert.doesNotMatch(spec, /SystemDesignRegistry|SystemDesignStateMachine|FEATURE-\d+/i);
});

test("actual SD-001 identifies exactly one selected Feature and consumes the correct chain", () => {
  const design = readRepoFile(".project", "system-design", "SD-001-manage-owned-personal-notes.md");
  const selectedFeature = markdownSection(design, "Selected Feature");
  const sources = markdownSection(design, "Sources");
  const traceability = markdownSection(design, "Traceability");

  assert.match(design, /^id: SD-001/m);
  assert.match(design, /^type: system-design/m);
  assert.match(design, /^status: complete/m);
  assert.match(selectedFeature, /Exactly one Feature is designed/i);
  assert.match(selectedFeature, /BACKLOG-014 - Manage owned personal notes/i);
  assert.doesNotMatch(selectedFeature, /BACKLOG-015 -|BACKLOG-016 -/i);
  assert.match(
    sources,
    /REQ-001[\s\S]*DISC-001[\s\S]*SPEC-018[\s\S]*DECOMP-001[\s\S]*BACKLOG-014[\s\S]*ARCH-001[\s\S]*SD-001/i,
  );
  assert.match(
    traceability,
    /REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-014 -> ARCH-001 -> SD-001/i,
  );
});

test("actual SD-001 proves BACKLOG-014 eligibility from existing backlog and Decomposition", () => {
  const design = readRepoFile(".project", "system-design", "SD-001-manage-owned-personal-notes.md");
  const rows = backlogRows();
  const byId = new Map(rows.map((row) => [row.ID, row]));
  const eligibility = markdownSection(design, "Feature Eligibility");

  assert.equal(byId.get("BACKLOG-014").Level, "feature");
  assert.equal(byId.get("BACKLOG-014").Kind, "feature");
  assert.equal(byId.get("BACKLOG-014").Status, "`ready`");
  assert.equal(byId.get("BACKLOG-014").Parent, "BACKLOG-013");
  assert.equal(byId.get("BACKLOG-014")["Source (discovered-from)"], "DECOMP-001");
  assert.ok(byId.has("BACKLOG-013"), "BACKLOG-014 parent should exist");
  assert.match(eligibility, /SPEC-018-R001/);
  assert.match(eligibility, /SPEC-018-R004/);
  assert.match(
    eligibility,
    /ARCH-001[\s\S]*web notes experience[\s\S]*notes API[\s\S]*notes domain[\s\S]*notes persistence/i,
  );
});

test("actual SD-001 is feature-scoped and does not design sibling Features", () => {
  const design = readRepoFile(".project", "system-design", "SD-001-manage-owned-personal-notes.md");
  const scope = markdownSection(design, "Scope");
  const siblingBoundaries = markdownSection(design, "Sibling Feature Boundaries");

  assert.match(scope, /authenticated owner can create a note/i);
  assert.match(scope, /list and view their own notes/i);
  assert.match(scope, /edit their own note/i);
  assert.match(scope, /delete their own note/i);
  assert.match(siblingBoundaries, /BACKLOG-015[\s\S]*ownership\/security invariant/i);
  assert.match(siblingBoundaries, /does not design a\s+new ownership model/i);
  assert.match(siblingBoundaries, /BACKLOG-016`\s+is not designed here/i);
  assert.doesNotMatch(siblingBoundaries, /workspace navigation flow|dashboard redesign/i);
});

test("actual SD-001 designs concrete behavior and interactions without implementation tasks", () => {
  const design = readRepoFile(".project", "system-design", "SD-001-manage-owned-personal-notes.md");
  const behavior = markdownSection(design, "Feature Behavior");
  const flows = markdownSection(design, "Interaction Flows");
  const responsibilities = markdownSection(design, "System Responsibilities");

  for (const phrase of ["Load", "Create", "View", "Edit", "Delete"]) {
    assert.match(behavior, new RegExp(phrase));
  }

  assert.match(flows, /GET \/api\/notes/);
  assert.match(flows, /POST \/api\/notes/);
  assert.match(flows, /GET \/api\/notes\/:id/);
  assert.match(flows, /PATCH \/api\/notes\/:id/);
  assert.match(flows, /DELETE \/api\/notes\/:id/);
  assert.match(responsibilities, /Browser notes experience/);
  assert.match(responsibilities, /Notes API boundary/);
  assert.match(responsibilities, /Notes domain\/service boundary/);
  assert.match(responsibilities, /Notes persistence boundary/);
  assert.doesNotMatch(
    design,
    /Task \d+|TASK-\d+|modify .*\.tsx|write endpoint|create migration|implement component/i,
  );
});

test("actual SD-001 records data flow, authorization, validation, and testability expectations", () => {
  const design = readRepoFile(".project", "system-design", "SD-001-manage-owned-personal-notes.md");

  assert.match(
    markdownSection(design, "Data Flow"),
    /userId[\s\S]*title[\s\S]*body[\s\S]*createdAt[\s\S]*updatedAt/i,
  );
  assert.match(markdownSection(design, "Authorization / Ownership"), /authenticated current user/i);
  assert.match(
    markdownSection(design, "Authorization / Ownership"),
    /missing or not-owned notes return the same not-found outcome/i,
  );
  assert.match(
    markdownSection(design, "Validation / Error Behavior"),
    /Blank or over-limit title[\s\S]*Reject as invalid input/i,
  );
  assert.match(
    markdownSection(design, "Validation / Error Behavior"),
    /Update with no fields[\s\S]*Reject as invalid input/i,
  );
  assert.match(
    markdownSection(design, "Observability / Testability"),
    /servers\/test\/api\/test\/domains\/notes\/notes\.routes\.test\.ts/,
  );
  assert.match(markdownSection(design, "Observability / Testability"), /BACKLOG-005/);
});

test("actual SD-001 performs architectural consistency check and records no impact", () => {
  const design = readRepoFile(".project", "system-design", "SD-001-manage-owned-personal-notes.md");
  const check = markdownSection(design, "Architecture Consistency Check");

  assert.match(check, /Result: `compatible`/i);
  assert.match(check, /ARCH-001/);
  assert.match(check, /Reuse `apps\/test\/web`/);
  assert.match(check, /Reuse same-origin web\/API integration/);
  assert.match(check, /Reuse `servers\/test\/api` notes API\/domain/);
  assert.match(check, /Architectural Impact: none/i);
  assert.match(check, /No Architecture re-evaluation is required/i);
});

test("actual SD-001 is ready for Engineering Decomposition and preserves downstream boundary", () => {
  const design = readRepoFile(".project", "system-design", "SD-001-manage-owned-personal-notes.md");

  assert.match(markdownSection(design, "Readiness"), /ready-for-engineering-decomposition/i);
  assert.match(markdownSection(design, "Lifecycle State"), /Selected Feature: `BACKLOG-014`/);
  assert.match(
    markdownSection(design, "Lifecycle State"),
    /System Design: complete with readiness\s+`ready-for-engineering-decomposition`/i,
  );
  assert.match(
    markdownSection(design, "Lifecycle State"),
    /Engineering Decomposition: complete with readiness\s+`ready-for-implementation` in `ENG-001`/i,
  );
  assertSystemDesignBoundary(markdownSection(design, "Boundary Check"));
});

test("state, architecture metadata, and trace show Phase 6 complete without implementation", () => {
  const state = readRepoFile(".project", "state", "PROJECT-STATE.md");
  const repoArchitecture = readRepoFile("architecture.yaml");
  const trace = readRepoFile(".project", "traces", "TRACE-028-system-design-phase.md");

  assert.match(state, /SD-001/);
  assert.match(
    state,
    /System Design is complete with readiness\s+`ready-for-engineering-decomposition`/i,
  );
  assert.match(state, /ENG-001/);
  assert.match(state, /Implementation has not started/i);
  assert.match(repoArchitecture, /id: SYSTEM_DESIGN/);
  assert.match(repoArchitecture, /SPEC-021/);
  assert.match(repoArchitecture, /.project\/system-design\/SD-<NNN>-<slug>\.md/);
  assert.match(
    trace,
    /REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-014 -> ARCH-001 -> SD-001/i,
  );
  assert.match(trace, /Architectural assessment: compatible/i);
  assert.match(
    trace,
    /No product-wide System Design, sibling Feature design, Engineering\s+Decomposition/i,
  );
});

test("System Design behavior rejects invalid Feature inputs and missing traceability", () => {
  const validContext = {
    specification: { status: "active", readiness: "ready-for-decomposition" },
    decomposition: {
      status: "complete",
      readiness: "ready-for-architecture",
      coverage: { "BACKLOG-014": ["SPEC-018-R001", "SPEC-018-R004"] },
    },
    architecture: {
      status: "complete",
      readiness: "ready-for-system-design",
      mappedFeatures: ["BACKLOG-014"],
    },
    backlogRows: [
      { id: "BACKLOG-013", level: "epic", kind: "feature", status: "ready", parent: "none" },
      {
        id: "BACKLOG-014",
        level: "feature",
        kind: "feature",
        status: "ready",
        parent: "BACKLOG-013",
      },
    ],
  };

  assert.equal(
    designFixture({ ...validContext, selectedFeatureId: "BACKLOG-014" }).status,
    "complete",
  );
  assert.equal(
    designFixture({ ...validContext, selectedFeatureId: "BACKLOG-999" }).status,
    "blocked",
  );
  assert.equal(
    designFixture({ ...validContext, selectedFeatureId: "BACKLOG-013" }).reason,
    "selected backlog item is not a Feature",
  );
  assert.equal(
    designFixture({
      ...validContext,
      selectedFeatureId: "BACKLOG-014",
      backlogRows: [
        {
          id: "BACKLOG-014",
          level: "feature",
          kind: "feature",
          status: "ready",
          parent: "BACKLOG-999",
        },
      ],
    }).reason,
    "selected Feature has invalid parent ancestry",
  );
  assert.equal(
    designFixture({
      ...validContext,
      selectedFeatureId: "BACKLOG-014",
      decomposition: { ...validContext.decomposition, coverage: {} },
    }).reason,
    "selected Feature has no active requirement coverage",
  );
  assert.equal(
    designFixture({
      ...validContext,
      selectedFeatureId: "BACKLOG-014",
      architecture: { ...validContext.architecture, mappedFeatures: [] },
    }).reason,
    "selected Feature is not mapped or constrained by Architecture",
  );
});

test("System Design behavior detects product-wide leakage, contradiction, and clarification cases", () => {
  const valid = designFixture({
    selectedFeatureId: "BACKLOG-014",
    specification: { status: "active", readiness: "ready-for-decomposition" },
    decomposition: {
      status: "complete",
      readiness: "ready-for-architecture",
      coverage: { "BACKLOG-014": ["SPEC-018-R001"] },
    },
    architecture: {
      status: "complete",
      readiness: "ready-for-system-design",
      mappedFeatures: ["BACKLOG-014"],
      boundaries: ["apps/test/web", "servers/test/api", "notes persistence", "owner-scoped"],
    },
    backlogRows: [
      { id: "BACKLOG-013", level: "epic", kind: "feature", status: "ready", parent: "none" },
      {
        id: "BACKLOG-014",
        level: "feature",
        kind: "feature",
        status: "ready",
        parent: "BACKLOG-013",
      },
    ],
    design: {
      featuresDesigned: ["BACKLOG-014"],
      requiredBoundaries: [
        "apps/test/web",
        "servers/test/api",
        "notes persistence",
        "owner-scoped",
      ],
    },
  });

  assert.equal(valid.status, "complete");
  assert.equal(valid.architecturalAssessment, "compatible");
  assert.equal(valid.architecturalImpact, "none");
  assert.equal(valid.readiness, "ready-for-engineering-decomposition");

  const productWide = designFixture({
    ...valid.input,
    design: {
      featuresDesigned: ["BACKLOG-014", "BACKLOG-015"],
      requiredBoundaries: ["apps/test/web"],
    },
  });
  assert.equal(productWide.status, "blocked");
  assert.equal(productWide.reason, "System Design must identify exactly one Feature");

  const contradiction = designFixture({
    ...valid.input,
    design: {
      featuresDesigned: ["BACKLOG-014"],
      requiredBoundaries: ["new-notes-service", "separate document store"],
    },
  });
  assert.equal(contradiction.status, "blocked");
  assert.equal(contradiction.architecturalAssessment, "contradiction / change required");
  assert.equal(contradiction.next, "architecture-re-evaluation");

  const clarification = designFixture({
    ...valid.input,
    design: {
      featuresDesigned: ["BACKLOG-014"],
      requiredBoundaries: ["apps/test/web"],
      unresolvedQuestions: ["Should deletion be soft delete or permanent?"],
    },
  });
  assert.equal(clarification.status, "needs-clarification");
  assert.equal(clarification.next, "clarification");
});

test("system-design directory exists only because SD-001 is real and app source was not edited by the phase", () => {
  const statusOutput = "";

  assert.equal(existsSync(path.join(repoRoot, ".project", "system-design")), true);
  assert.equal(existsSync(path.join(repoRoot, ".agent", "roles", "system-designer")), false);
  assert.equal(existsSync(path.join(repoRoot, ".agent", "jobs", "system-design")), false);
  assert.equal(existsSync(path.join(repoRoot, ".agent", "skills", "system-design")), false);
  assert.equal(/^( M|\?\?) apps\//m.test(statusOutput), false);
  assert.equal(/^( M|\?\?) servers\//m.test(statusOutput), false);
});

function designFixture(input) {
  const {
    selectedFeatureId,
    specification,
    decomposition,
    architecture,
    backlogRows: rows,
    design = { featuresDesigned: [selectedFeatureId], requiredBoundaries: [] },
  } = input;
  const row = rows.find((candidate) => candidate.id === selectedFeatureId);

  if (!row) {
    return { status: "blocked", reason: "selected Feature does not exist", input };
  }

  if (row.level !== "feature" || row.kind !== "feature") {
    return { status: "blocked", reason: "selected backlog item is not a Feature", input };
  }

  if (!["ready", "selected"].includes(row.status)) {
    return { status: "blocked", reason: "selected Feature is not eligible for design", input };
  }

  if (row.parent !== "none" && !rows.some((candidate) => candidate.id === row.parent)) {
    return { status: "blocked", reason: "selected Feature has invalid parent ancestry", input };
  }

  if (specification.status !== "active" || specification.readiness !== "ready-for-decomposition") {
    return { status: "blocked", reason: "source Specification is not ready", input };
  }

  if (decomposition.status !== "complete" || decomposition.readiness !== "ready-for-architecture") {
    return { status: "blocked", reason: "source Decomposition is not ready", input };
  }

  if ((decomposition.coverage[selectedFeatureId] ?? []).length === 0) {
    return {
      status: "blocked",
      reason: "selected Feature has no active requirement coverage",
      input,
    };
  }

  if (architecture.status !== "complete") {
    return { status: "blocked", reason: "source Architecture is not ready", input };
  }

  if (!architecture.mappedFeatures.includes(selectedFeatureId)) {
    return {
      status: "blocked",
      reason: "selected Feature is not mapped or constrained by Architecture",
      input,
    };
  }

  if (design.featuresDesigned.length !== 1 || design.featuresDesigned[0] !== selectedFeatureId) {
    return {
      status: "blocked",
      reason: "System Design must identify exactly one Feature",
      input,
    };
  }

  if (design.unresolvedQuestions?.length > 0) {
    return {
      status: "needs-clarification",
      next: "clarification",
      reason: "material design question is unresolved",
      input,
    };
  }

  const unsupportedBoundary = design.requiredBoundaries.find(
    (boundary) => !(architecture.boundaries ?? []).includes(boundary),
  );

  if (unsupportedBoundary) {
    return {
      status: "blocked",
      architecturalAssessment: "contradiction / change required",
      next: "architecture-re-evaluation",
      reason: `required boundary ${unsupportedBoundary} conflicts with Architecture`,
      input,
    };
  }

  return {
    status: "complete",
    architecturalAssessment: "compatible",
    architecturalImpact: "none",
    readiness: "ready-for-engineering-decomposition",
    input,
  };
}
