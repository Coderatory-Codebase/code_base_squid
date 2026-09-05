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

function assertDecompositionBoundary(text) {
  assert.match(text, /Architecture: not created/i);
  assert.match(text, /Implementation Planning: not created/i);
  assert.match(text, /Implementation: not started/i);
  assert.match(text, /Tasks: not created/i);
  assert.match(text, /Application source: not changed/i);
}

test("Decomposition workflow is agent-operated, not a standalone engine or task system", () => {
  const workflow = readRepoFile(".agent", "workflows", "decomposition.md");
  const spec = readRepoFile(".project", "specs", "SPEC-019-decomposition-lifecycle-phase.md");
  const artifactTypes = readRepoFile(".project", "ARTIFACT-TYPES.md");
  const packageJson = readRepoFile("package.json");

  assert.match(workflow, /agent performs Decomposition directly/i);
  assert.match(workflow, /There is no Decomposition CLI/i);
  assert.match(spec, /Product vs\. Engineering Decomposition/i);
  assert.match(spec, /Input Gate/i);
  assert.match(artifactTypes, /Decomposition\s+\|\s+`DECOMP-`/i);
  assert.match(packageJson, /"test:decomposition"/);
  assert.doesNotMatch(workflow, /decomposition\.mjs/i);
  assert.doesNotMatch(spec, /BacklogManager|TaskManager|WorkItemEngine/i);
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
  assert.match(decomposition, /related: \[SPEC-018, DISC-001, REQ-001, SPEC-019, TRACE-025/);
  assert.match(markdownSection(decomposition, "Source Specification"), /SPEC-018/);
  assert.match(markdownSection(decomposition, "Source Specification"), /ready-for-decomposition/i);
  assert.match(markdownSection(decomposition, "Source Discovery"), /DISC-001/);
  assert.match(
    markdownSection(decomposition, "Traceability"),
    /REQ-001[\s\S]*DISC-001[\s\S]*SPEC-018[\s\S]*DECOMP-001/i,
  );
});

test("actual DECOMP-001 creates meaningful product scope hierarchy without false depth", () => {
  const decomposition = readRepoFile(
    ".project",
    "decomposition",
    "DECOMP-001-personal-notes-baseline.md",
  );
  const hierarchy = markdownSection(decomposition, "Decomposition Hierarchy");
  const units = markdownSection(decomposition, "Units");

  assert.match(hierarchy, /DECOMP-001-U001 Personal Notes Baseline Outcome/i);
  assert.match(hierarchy, /DECOMP-001-U002 Notes Management Capability/i);
  assert.match(hierarchy, /DECOMP-001-U003 Personal Access Boundary Capability/i);
  assert.match(hierarchy, /DECOMP-001-U004 Notes Workspace Experience Capability/i);
  assert.match(hierarchy, /only two levels/i);
  assert.doesNotMatch(hierarchy, /DECOMP-001-U\d+ .* (Story|Task|Sprint)/i);
  assert.match(units, /Type: outcome/i);
  assert.match(units, /Type: capability/i);
});

test("actual DECOMP-001 accounts for every active SPEC-018 requirement", () => {
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

  assert.match(coverage, /No active requirement is orphaned/i);
  assert.match(coverage, /Constraint, not a separate false capability/i);
  assert.match(coverage, /Requires no separate product unit/i);
});

test("actual DECOMP-001 contains no orphan scope from inactive candidate requirements", () => {
  const decomposition = readRepoFile(
    ".project",
    "decomposition",
    "DECOMP-001-personal-notes-baseline.md",
  );
  const units = markdownSection(decomposition, "Units");
  const nonGoals = markdownSection(decomposition, "Non-Goals");

  assert.doesNotMatch(units, /^### .*Search|^### .*Tags|^### .*Sharing|^### .*Export/im);
  assert.doesNotMatch(units, /Purpose:.*search|Scope:[\s\S]*- Search/im);
  assert.match(nonGoals, /search, tags, sharing, export, pagination/i);
  assert.match(nonGoals, /Do not create a duplicate notes system/i);
});

test("actual DECOMP-001 preserves Architecture and Implementation boundaries", () => {
  const decomposition = readRepoFile(
    ".project",
    "decomposition",
    "DECOMP-001-personal-notes-baseline.md",
  );
  const units = markdownSection(decomposition, "Units");

  assertDecompositionBoundary(markdownSection(decomposition, "Boundary Check"));
  assert.doesNotMatch(decomposition, /^## Architecture$/im);
  assert.doesNotMatch(decomposition, /^## Implementation Plan$/im);
  assert.doesNotMatch(decomposition, /^## API Contract$/im);
  assert.doesNotMatch(decomposition, /^## Database Schema$/im);
  assert.doesNotMatch(
    units,
    /\bCreate (GET|POST|PATCH|DELETE)\b|write a test file|add a component/i,
  );
});

test("state and trace show Decomposition complete and Architecture not started", () => {
  const state = readRepoFile(".project", "state", "PROJECT-STATE.md");
  const trace = readRepoFile(".project", "traces", "TRACE-025-decomposition-phase.md");
  const architecture = readRepoFile("architecture.yaml");

  assert.match(state, /DECOMP-001/);
  assert.match(state, /Decomposition is complete with readiness `ready-for-architecture`/i);
  assert.match(state, /Architecture\/Phase 5 has not been executed/i);
  assert.match(trace, /REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001/i);
  assert.match(trace, /No Architecture, Implementation Planning, Implementation/i);
  assert.match(architecture, /id: DECOMPOSITION/);
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
  assert.deepEqual(blocked.units, []);

  const inactive = decomposeFixture({
    specification: {
      status: "superseded",
      readiness: "ready-for-decomposition",
      requirements: [{ id: "SPEC-X-R001", text: "Old requirement." }],
    },
  });

  assert.equal(inactive.status, "blocked");
  assert.equal(inactive.next, "specification-clarification");
  assert.deepEqual(inactive.units, []);
});

test("decomposition behavior detects coverage gaps, orphan units, leakage, invalid hierarchy, and insufficient specs", () => {
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
    }).errors,
    ["active requirement SPEC-X-R002 is not accounted for"],
  );

  assert.deepEqual(
    validateDecomposition({
      specification: validSpec,
      units: [{ id: "DECOMP-X-U001", type: "capability", maps: ["SPEC-X-R999"], parent: null }],
    }).errors,
    [
      "active requirement SPEC-X-R001 is not accounted for",
      "active requirement SPEC-X-R002 is not accounted for",
      "unit DECOMP-X-U001 has no active Specification justification",
    ],
  );

  assert.deepEqual(
    validateDecomposition({
      specification: validSpec,
      units: [
        {
          id: "DECOMP-X-U001",
          type: "capability",
          maps: ["SPEC-X-R001", "SPEC-X-R002"],
          parent: "DECOMP-X-U999",
        },
      ],
    }).errors,
    ["unit DECOMP-X-U001 has missing parent DECOMP-X-U999"],
  );

  assert.deepEqual(
    validateDecomposition({
      specification: validSpec,
      units: [
        {
          id: "DECOMP-X-U001",
          type: "capability",
          maps: ["SPEC-X-R001", "SPEC-X-R002"],
          parent: null,
          text: "Create POST /api/notes and a MongoDB schema.",
        },
      ],
    }).errors,
    ["unit DECOMP-X-U001 leaks architecture or implementation detail"],
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
  assert.deepEqual(insufficient.units, []);
});

function decomposeFixture({ specification }) {
  if (specification.status !== "active" || specification.readiness !== "ready-for-decomposition") {
    return {
      status: "blocked",
      next: "specification-clarification",
      units: [],
      reason: "source Specification is not active and ready",
    };
  }

  if (specification.requirements.some((requirement) => /somehow|unknown/i.test(requirement.text))) {
    return {
      status: "needs-clarification",
      next: "specification-clarification",
      units: [],
      reason: "Specification is ready on paper but insufficient for scope decomposition",
    };
  }

  return {
    status: "complete",
    readiness: "ready-for-architecture",
    next: "architecture",
    units: [
      {
        id: "DECOMP-X-U001",
        type: "capability",
        maps: specification.requirements.map((requirement) => requirement.id),
      },
    ],
  };
}

function validateDecomposition({ specification, units }) {
  const activeRequirementIds = specification.requirements.map((requirement) => requirement.id);
  const mappedRequirementIds = new Set(units.flatMap((unit) => unit.maps));
  const unitIds = new Set(units.map((unit) => unit.id));
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

    if (/\/api\/|MongoDB|schema|component|test file|controller/i.test(unit.text ?? "")) {
      errors.push(`unit ${unit.id} leaks architecture or implementation detail`);
    }
  }

  return { errors };
}
