import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

function assertDecompositionBoundary(text) {
  assert.match(text, /Architecture: created later by Phase 5/i);
  assert.match(text, /Implementation Planning: not created/i);
  assert.match(text, /Implementation: not started/i);
  assert.match(text, /Tasks: not created/i);
  assert.match(text, /Application source: not changed/i);
}

test("Decomposition workflow is agent-operated and reuses the existing backlog", () => {
  const workflow = readRepoFile(".agent", "workflows", "decomposition.md");
  const spec = readRepoFile(".project", "specs", "SPEC-019-decomposition-lifecycle-phase.md");
  const artifactTypes = readRepoFile(".project", "ARTIFACT-TYPES.md");
  const backlog = readRepoFile(".project", "backlog", "BACKLOG.md");
  const packageJson = readRepoFile("package.json");

  assert.match(workflow, /agent performs Decomposition directly/i);
  assert.match(workflow, /resulting product units[\s\S]*BACKLOG\.md/i);
  assert.match(workflow, /Features the primary delivery-oriented units/i);
  assert.match(spec, /Backlog Integration/i);
  assert.match(spec, /Features are the primary\s+delivery-oriented units/i);
  assert.match(artifactTypes, /Level.*Parent.*Kind.*Status/i);
  assert.match(backlog, /\| ID\s+\| Scope\s+\| Owner\s+\| Level\s+\| Parent\s+\|/);
  assert.match(packageJson, /"test:decomposition"/);
  assert.doesNotMatch(workflow, /decomposition\.mjs/i);
  assert.doesNotMatch(spec, /BacklogManager|TaskManager|WorkItemEngine|FEATURE-\d+/i);
});

test("actual DECOMP-001 consumes ready SPEC-018 and preserves lifecycle traceability", () => {
  const decomposition = readRepoFile(
    ".project",
    "decomposition",
    "DECOMP-001-personal-notes-baseline.md",
  );

  assert.match(decomposition, /^id: DECOMP-001/m);
  assert.match(decomposition, /^type: decomposition/m);
  assert.match(decomposition, /^status: complete/m);
  assert.match(decomposition, /^updated: 2026-09-05/m);
  assert.match(
    decomposition,
    /related:[\s\S]*SPEC-018[\s\S]*DISC-001[\s\S]*REQ-001[\s\S]*SPEC-019[\s\S]*TRACE-025[\s\S]*TRACE-026/,
  );
  assert.match(markdownSection(decomposition, "Source Specification"), /SPEC-018/);
  assert.match(markdownSection(decomposition, "Source Specification"), /ready-for-decomposition/i);
  assert.match(markdownSection(decomposition, "Source Discovery"), /DISC-001/);
  assert.match(
    markdownSection(decomposition, "Traceability"),
    /REQ-001[\s\S]*DISC-001[\s\S]*SPEC-018[\s\S]*DECOMP-001[\s\S]*BACKLOG-013/i,
  );
});

test("actual DECOMP-001 is feature-driven instead of capability-only", () => {
  const decomposition = readRepoFile(
    ".project",
    "decomposition",
    "DECOMP-001-personal-notes-baseline.md",
  );
  const hierarchy = markdownSection(decomposition, "Product Hierarchy");
  const features = markdownSection(decomposition, "Features");

  assert.match(hierarchy, /BACKLOG-013 Epic: Personal Notes Management/i);
  assert.match(hierarchy, /BACKLOG-014 Feature: Manage Owned Personal Notes/i);
  assert.match(hierarchy, /BACKLOG-015 Feature: Protect Personal Note Ownership/i);
  assert.match(
    hierarchy,
    /BACKLOG-016 Feature: Reach Personal Notes from the Authenticated Workspace/i,
  );
  assert.match(hierarchy, /stops at Features/i);
  assert.match(features, /Type: feature/i);
  assert.match(features, /Feature classification: real Feature/i);
  assert.doesNotMatch(
    hierarchy,
    /Notes Management Capability[\s\S]*Personal Access Boundary Capability/i,
  );
});

test("actual decomposition rows are represented in the existing backlog hierarchy", () => {
  const rows = backlogRows();
  const byId = new Map(rows.map((row) => [row.ID, row]));

  for (const id of ["BACKLOG-013", "BACKLOG-014", "BACKLOG-015", "BACKLOG-016"]) {
    assert.ok(byId.has(id), `${id} should exist in the singleton backlog table`);
    assert.equal(byId.get(id).Scope, "PROJECT");
    assert.equal(byId.get(id).Owner, "test");
    assert.equal(byId.get(id).Kind, "feature");
    assert.equal(byId.get(id).Status, "`ready`");
    assert.equal(byId.get(id)["Source (discovered-from)"], "DECOMP-001");
  }

  assert.equal(byId.get("BACKLOG-013").Level, "epic");
  assert.equal(byId.get("BACKLOG-013").Parent, "none");
  assert.equal(byId.get("BACKLOG-014").Level, "feature");
  assert.equal(byId.get("BACKLOG-014").Parent, "BACKLOG-013");
  assert.equal(byId.get("BACKLOG-015").Parent, "BACKLOG-013");
  assert.equal(byId.get("BACKLOG-016").Parent, "BACKLOG-013");
  assert.equal(byId.get("BACKLOG-014").Dependencies, "BACKLOG-015");
  assert.equal(byId.get("BACKLOG-012").Status, "`completed`");
});

test("backlog hierarchy and workflow state remain separate dimensions", () => {
  const rows = backlogRows();
  const byId = new Map(rows.map((row) => [row.ID, row]));
  const spec = readRepoFile(".project", "specs", "SPEC-019-decomposition-lifecycle-phase.md");
  const decomposition = readRepoFile(
    ".project",
    "decomposition",
    "DECOMP-001-personal-notes-baseline.md",
  );

  assert.equal(byId.get("BACKLOG-014").Level, "feature");
  assert.equal(byId.get("BACKLOG-014").Parent, "BACKLOG-013");
  assert.equal(byId.get("BACKLOG-014").Status, "`ready`");
  assert.notEqual(byId.get("BACKLOG-014").Parent, "ready");
  assert.match(markdownSection(spec, "Backlog Integration"), /Level\s+= hierarchy\/sizing/i);
  assert.match(markdownSection(spec, "Backlog Integration"), /Status\s+= workflow state/i);
  assert.match(
    markdownSection(decomposition, "State / Hierarchy Separation"),
    /`ready` is not a hierarchy node/i,
  );
});

test("actual DECOMP-001 accounts for every active SPEC-018 requirement deliberately", () => {
  const decomposition = readRepoFile(
    ".project",
    "decomposition",
    "DECOMP-001-personal-notes-baseline.md",
  );
  const coverage = markdownSection(decomposition, "Requirement Coverage");

  for (const requirementId of [
    "SPEC-018-R001",
    "SPEC-018-R002",
    "SPEC-018-R003",
    "SPEC-018-R004",
    "SPEC-018-R005",
    "SPEC-018-R006",
    "SPEC-018-R007",
  ]) {
    assert.match(coverage, new RegExp(requirementId));
  }

  assert.match(coverage, /SPEC-018-R001[\s\S]*BACKLOG-014/i);
  assert.match(coverage, /SPEC-018-R002[\s\S]*BACKLOG-015/i);
  assert.match(coverage, /SPEC-018-R003[\s\S]*BACKLOG-016/i);
  assert.match(coverage, /SPEC-018-R005[\s\S]*Quality baseline constraint/i);
  assert.match(coverage, /SPEC-018-R006[\s\S]*Cross-cutting boundary/i);
  assert.match(coverage, /SPEC-018-R007[\s\S]*Traceability requirement/i);
  assert.match(coverage, /No active requirement is orphaned/i);
});

test("actual DECOMP-001 contains no orphan scope from inactive candidate requirements", () => {
  const decomposition = readRepoFile(
    ".project",
    "decomposition",
    "DECOMP-001-personal-notes-baseline.md",
  );
  const features = markdownSection(decomposition, "Features");
  const nonGoals = markdownSection(decomposition, "Non-Goals");
  const rows = backlogRows().filter((row) =>
    ["BACKLOG-013", "BACKLOG-014", "BACKLOG-015", "BACKLOG-016"].includes(row.ID),
  );

  assert.doesNotMatch(features, /^### .*Search|^### .*Tags|^### .*Sharing|^### .*Export/im);
  assert.doesNotMatch(
    rows.map((row) => row.Title).join("\n"),
    /search|tags|sharing|export|pagination/i,
  );
  assert.match(nonGoals, /search, tags, sharing, export, pagination/i);
  assert.match(nonGoals, /Do not create a duplicate notes system/i);
});

test("actual DECOMP-001 preserves Architecture and Implementation boundaries", () => {
  const decomposition = readRepoFile(
    ".project",
    "decomposition",
    "DECOMP-001-personal-notes-baseline.md",
  );
  const features = markdownSection(decomposition, "Features");

  assertDecompositionBoundary(markdownSection(decomposition, "Boundary Check"));
  assert.doesNotMatch(decomposition, /^## Architecture$/im);
  assert.doesNotMatch(decomposition, /^## Implementation Plan$/im);
  assert.doesNotMatch(decomposition, /^## API Contract$/im);
  assert.doesNotMatch(decomposition, /^## Database Schema$/im);
  assert.doesNotMatch(
    features,
    /\b(GET|POST|PATCH|DELETE)\s+\/|\/api\/|MongoDB|schema|component|test file|controller/i,
  );
});

test("state, architecture, and trace show Decomposition complete and Architecture handed off", () => {
  const state = readRepoFile(".project", "state", "PROJECT-STATE.md");
  const trace = readRepoFile(
    ".project",
    "traces",
    "TRACE-026-decomposition-feature-driven-rework.md",
  );
  const architecture = readRepoFile("architecture.yaml");

  assert.match(state, /DECOMP-001/);
  assert.match(state, /BACKLOG-013/);
  assert.match(state, /Decomposition is complete with readiness `ready-for-architecture`/i);
  assert.match(state, /ARCH-001/);
  assert.match(state, /SD-001/);
  assert.match(state, /Engineering Decomposition has not been executed/i);
  assert.match(trace, /REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-013/i);
  assert.match(trace, /No Architecture, Implementation Planning, Implementation/i);
  assert.match(architecture, /id: DECOMPOSITION/);
  assert.match(architecture, /feature-driven product hierarchy/i);
});

test("decomposition behavior rejects blocked and inactive Specifications", () => {
  const blocked = decomposeFixture({
    specification: {
      status: "draft",
      readiness: "needs-clarification",
      requirements: [{ id: "SPEC-X-R001", text: "Unknown outcome." }],
    },
  });

  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.next, "specification-clarification");
  assert.deepEqual(blocked.backlogRows, []);

  const inactive = decomposeFixture({
    specification: {
      status: "superseded",
      readiness: "ready-for-decomposition",
      requirements: [{ id: "SPEC-X-R001", text: "Old requirement." }],
    },
  });

  assert.equal(inactive.status, "blocked");
  assert.equal(inactive.next, "specification-clarification");
  assert.deepEqual(inactive.backlogRows, []);
});

test("decomposition behavior detects coverage gaps, orphan units, leakage, invalid hierarchy, and capability-only output", () => {
  const validSpec = {
    status: "active",
    readiness: "ready-for-decomposition",
    requirements: [
      { id: "SPEC-X-R001", text: "Users manage own notes." },
      { id: "SPEC-X-R002", text: "Notes stay private to owner." },
    ],
  };

  assert.deepEqual(
    validateDecomposition({
      specification: validSpec,
      units: [{ id: "DECOMP-X-U001", type: "outcome", maps: ["SPEC-X-R001"], parent: null }],
      backlogRows: [],
    }).errors,
    [
      "active requirement SPEC-X-R002 is not accounted for",
      "ready decomposition has no feature backlog rows",
    ],
  );

  assert.deepEqual(
    validateDecomposition({
      specification: validSpec,
      units: [{ id: "DECOMP-X-U001", type: "capability", maps: ["SPEC-X-R999"], parent: null }],
      backlogRows: [
        { id: "BACKLOG-X001", level: "feature", parent: null, status: "ready", maps: [] },
      ],
    }).errors,
    [
      "active requirement SPEC-X-R001 is not accounted for",
      "active requirement SPEC-X-R002 is not accounted for",
      "unit DECOMP-X-U001 has no active Specification justification",
      "feature backlog row BACKLOG-X001 has no active Specification justification",
    ],
  );

  assert.deepEqual(
    validateDecomposition({
      specification: validSpec,
      units: [
        {
          id: "DECOMP-X-U001",
          type: "feature",
          maps: ["SPEC-X-R001", "SPEC-X-R002"],
          parent: "DECOMP-X-U999",
        },
      ],
      backlogRows: [
        {
          id: "BACKLOG-X001",
          level: "feature",
          parent: "BACKLOG-X999",
          status: "ready",
          maps: ["SPEC-X-R001"],
        },
      ],
    }).errors,
    [
      "unit DECOMP-X-U001 has missing parent DECOMP-X-U999",
      "backlog row BACKLOG-X001 has missing parent BACKLOG-X999",
    ],
  );

  assert.deepEqual(
    validateDecomposition({
      specification: validSpec,
      units: [
        {
          id: "DECOMP-X-U001",
          type: "feature",
          maps: ["SPEC-X-R001", "SPEC-X-R002"],
          parent: null,
          text: "Create POST /api/notes and a MongoDB schema.",
        },
      ],
      backlogRows: [
        {
          id: "BACKLOG-X001",
          level: "feature",
          parent: null,
          status: "ready",
          maps: ["SPEC-X-R001"],
          text: "Add a React component and controller.",
        },
      ],
    }).errors,
    [
      "unit DECOMP-X-U001 leaks architecture or implementation detail",
      "feature backlog row BACKLOG-X001 leaks engineering task detail",
    ],
  );

  assert.deepEqual(
    validateDecomposition({
      specification: validSpec,
      units: [
        { id: "DECOMP-X-U001", type: "outcome", maps: ["SPEC-X-R001"], parent: null },
        { id: "DECOMP-X-U002", type: "capability", maps: ["SPEC-X-R001"], parent: "DECOMP-X-U001" },
        { id: "DECOMP-X-U003", type: "capability", maps: ["SPEC-X-R002"], parent: "DECOMP-X-U001" },
      ],
      backlogRows: [
        {
          id: "BACKLOG-X001",
          level: "capability",
          parent: null,
          status: "ready",
          maps: ["SPEC-X-R001"],
        },
      ],
    }).errors,
    ["ready decomposition has no feature backlog rows"],
  );

  const insufficient = decomposeFixture({
    specification: {
      status: "active",
      readiness: "ready-for-decomposition",
      requirements: [{ id: "SPEC-X-R001", text: "Make notes better somehow." }],
    },
  });

  assert.equal(insufficient.status, "needs-clarification");
  assert.equal(insufficient.next, "specification-clarification");
  assert.deepEqual(insufficient.backlogRows, []);
});

function decomposeFixture({ specification }) {
  if (specification.status !== "active" || specification.readiness !== "ready-for-decomposition") {
    return {
      status: "blocked",
      next: "specification-clarification",
      units: [],
      backlogRows: [],
      reason: "source Specification is not active and ready",
    };
  }

  if (specification.requirements.some((requirement) => /somehow|unknown/i.test(requirement.text))) {
    return {
      status: "needs-clarification",
      next: "specification-clarification",
      units: [],
      backlogRows: [],
      reason: "Specification is ready on paper but insufficient for feature decomposition",
    };
  }

  return {
    status: "complete",
    readiness: "ready-for-architecture",
    next: "architecture",
    units: [
      {
        id: "DECOMP-X-U001",
        type: "feature",
        maps: specification.requirements.map((requirement) => requirement.id),
      },
    ],
    backlogRows: [
      {
        id: "BACKLOG-X001",
        level: "feature",
        parent: null,
        status: "ready",
        maps: specification.requirements.map((requirement) => requirement.id),
      },
    ],
  };
}

function validateDecomposition({ specification, units, backlogRows: rows }) {
  const activeRequirementIds = specification.requirements.map((requirement) => requirement.id);
  const mappedRequirementIds = new Set([
    ...units.flatMap((unit) => unit.maps),
    ...rows.flatMap((row) => row.maps),
  ]);
  const unitIds = new Set(units.map((unit) => unit.id));
  const backlogIds = new Set(rows.map((row) => row.id));
  const errors = [];

  for (const requirementId of activeRequirementIds) {
    if (!mappedRequirementIds.has(requirementId)) {
      errors.push(`active requirement ${requirementId} is not accounted for`);
    }
  }

  for (const unit of units) {
    if (!unit.maps.some((requirementId) => activeRequirementIds.includes(requirementId))) {
      errors.push(`unit ${unit.id} has no active Specification justification`);
    }

    if (unit.parent && !unitIds.has(unit.parent)) {
      errors.push(`unit ${unit.id} has missing parent ${unit.parent}`);
    }

    if (/\/api\/|MongoDB|schema|component|test file|controller|React/i.test(unit.text ?? "")) {
      errors.push(`unit ${unit.id} leaks architecture or implementation detail`);
    }
  }

  const featureRows = rows.filter((row) => row.level === "feature");
  if (featureRows.length === 0) {
    errors.push("ready decomposition has no feature backlog rows");
  }

  for (const row of featureRows) {
    if (!row.maps.some((requirementId) => activeRequirementIds.includes(requirementId))) {
      errors.push(`feature backlog row ${row.id} has no active Specification justification`);
    }

    if (row.parent && !backlogIds.has(row.parent)) {
      errors.push(`backlog row ${row.id} has missing parent ${row.parent}`);
    }

    if (/\/api\/|MongoDB|schema|component|test file|controller|React/i.test(row.text ?? "")) {
      errors.push(`feature backlog row ${row.id} leaks engineering task detail`);
    }
  }

  return { errors };
}
