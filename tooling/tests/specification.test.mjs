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

function assertSpecificationBoundary(text) {
  assert.match(text, /Decomposition: not created/i);
  assert.match(text, /Architecture: not created/i);
  assert.match(text, /Implementation: not started/i);
  assert.match(text, /Tasks: not created/i);
}

test("Specification workflow is agent-operated, not a standalone CLI or framework", () => {
  const workflow = readRepoFile(".agent", "workflows", "specification.md");
  const spec = readRepoFile(".project", "specs", "SPEC-017-specification-lifecycle-phase.md");
  const packageJson = readRepoFile("package.json");

  assert.match(workflow, /agent performs Specification directly/i);
  assert.match(workflow, /There is no Specification CLI/i);
  assert.match(spec, /ordinary `SPEC-\*` markdown artifact/i);
  assert.match(spec, /does\s+not create a second specification prefix/i);
  assert.doesNotMatch(workflow, /specification\.mjs/i);
  assert.doesNotMatch(spec, /^## Requirement Registry$/im);
  assert.match(packageJson, /"test:specification"/);
});

test("actual SPEC-018 consumes DISC-001 and preserves lifecycle traceability", () => {
  const specification = readRepoFile(
    ".project",
    "specs",
    "SPEC-018-personal-notes-test-application.md",
  );

  assert.match(specification, /^id: SPEC-018/m);
  assert.match(specification, /^type: spec/m);
  assert.match(specification, /^status: draft/m);
  assert.match(specification, /related: \[REQ-001, DISC-001, SPEC-017, TRACE-023/);
  assert.match(markdownSection(specification, "Source Discovery"), /DISC-001/);
  assert.match(markdownSection(specification, "Source Requirement"), /REQ-001/);
  assert.match(
    markdownSection(specification, "Original Request"),
    /Add personal notes functionality to the test application\./,
  );
  assert.match(markdownSection(specification, "Route"), /PROJECT.*SEED_APP/is);
  assert.match(
    markdownSection(specification, "Traceability"),
    /REQ-001[\s\S]*DISC-001[\s\S]*SPEC-018/,
  );
});

test("actual SPEC-018 preserves unresolved intent instead of inventing product scope", () => {
  const specification = readRepoFile(
    ".project",
    "specs",
    "SPEC-018-personal-notes-test-application.md",
  );

  assert.match(markdownSection(specification, "Specification Readiness"), /needs-clarification/i);
  assert.match(markdownSection(specification, "Active Requirements"), /SPEC-018-R001/);
  assert.match(markdownSection(specification, "Active Requirements"), /Resolve Intended Outcome/i);
  assert.match(
    markdownSection(specification, "Active Requirements"),
    /Do Not Create Duplicate Notes Scope/i,
  );
  assert.match(markdownSection(specification, "Unresolved Decisions"), /intended delta/i);
  assert.match(
    markdownSection(specification, "Functional Requirements"),
    /No final product functional requirement is active yet/i,
  );
  assert.match(
    markdownSection(specification, "Candidate Requirements Not Yet Active"),
    /authenticated user must be able to create, view, edit, and delete/i,
  );
  assert.match(
    markdownSection(specification, "Candidate Requirements Not Yet Active"),
    /user must not receive, edit, or delete another user's note/i,
  );
});

test("actual SPEC-018 carries material Discovery lens findings forward", () => {
  const specification = readRepoFile(
    ".project",
    "specs",
    "SPEC-018-personal-notes-test-application.md",
  );
  const treatment = markdownSection(specification, "Finding Treatment");

  assert.match(treatment, /capability appears already present/i);
  assert.match(treatment, /product intent is unclear/i);
  assert.match(treatment, /Authenticated-owner behavior exists/i);
  assert.match(treatment, /Dashboard discovery of notes exists/i);
  assert.match(treatment, /Backend tests cover notes behavior/i);
  assert.match(treatment, /Unresolved/i);
  assert.match(treatment, /Not carried forward/i);
});

test("actual SPEC-018 does not prescribe architecture, APIs, schemas, tasks, or implementation", () => {
  const specification = readRepoFile(
    ".project",
    "specs",
    "SPEC-018-personal-notes-test-application.md",
  );
  const activeRequirements = markdownSection(specification, "Active Requirements");

  assertSpecificationBoundary(markdownSection(specification, "Boundary Check"));
  assert.doesNotMatch(specification, /^## API Contract$/im);
  assert.doesNotMatch(specification, /^## Database Schema$/im);
  assert.doesNotMatch(specification, /^## Implementation Plan$/im);
  assert.doesNotMatch(specification, /^## Task Breakdown$/im);
  assert.doesNotMatch(activeRequirements, /MongoDB|Mongoose|userId|\/api\/notes|React component/i);
});

test("state and trace show Specification executed and later phases not started", () => {
  const state = readRepoFile(".project", "state", "PROJECT-STATE.md");
  const trace = readRepoFile(".project", "traces", "TRACE-023-specification-phase.md");
  const architecture = readRepoFile("architecture.yaml");

  assert.match(state, /SPEC-018/);
  assert.match(state, /Specification is draft with readiness `needs-clarification`/i);
  assert.match(state, /Decomposition\/Phase 4 has not been executed/i);
  assert.match(trace, /No Decomposition, Architecture, Implementation/i);
  assert.match(architecture, /id: SPECIFICATION/);
});

test("behavior cases produce testable requirements without downstream design", () => {
  const cases = [
    {
      name: "clear feature",
      discovery: {
        request: "Users need to create, edit, view, and delete private notes.",
        status: "complete",
        findings: ["private notes CRUD for authenticated users"],
      },
      expected: {
        status: "active",
        requirement: /authenticated user can create, view, edit, and delete their own notes/i,
        acceptance: /creating a note makes it visible to that same user/i,
      },
    },
    {
      name: "security requirement",
      discovery: {
        request: "Users must never be able to access another user's notes.",
        status: "complete",
        findings: ["cross-user access must be denied"],
      },
      expected: {
        status: "active",
        requirement: /must not receive or modify another user's note/i,
        acceptance: /attempting to access another user's note does not disclose that note/i,
      },
    },
    {
      name: "ux requirement",
      discovery: {
        request: "Users should be able to find their notes from the dashboard.",
        status: "complete",
        findings: ["notes must be discoverable from dashboard"],
      },
      expected: {
        status: "active",
        requirement: /can navigate from the dashboard to their notes/i,
        acceptance: /dashboard exposes a notes navigation path/i,
      },
    },
    {
      name: "accessibility requirement",
      discovery: {
        request: "The notes interface must be usable with keyboard navigation.",
        status: "complete",
        findings: ["keyboard accessibility required"],
      },
      expected: {
        status: "active",
        requirement: /usable without a pointing device/i,
        acceptance: /keyboard user can reach and operate/i,
      },
    },
    {
      name: "ambiguous requirement",
      discovery: {
        request: "Add notes.",
        status: "needs-clarification",
        findings: ["owning project and notes behavior are unclear"],
      },
      expected: {
        status: "draft",
        unresolved: /owning project and notes behavior/i,
      },
    },
  ];

  for (const item of cases) {
    const result = specificationBoundaryFixture(item.discovery);
    assert.equal(result.originalRequest, item.discovery.request, item.name);
    assert.equal(result.lifecycle.stage, "specification", item.name);
    assert.equal(result.downstream.decomposition, "not created", item.name);
    assert.equal(result.downstream.architecture, "not created", item.name);
    assert.equal(result.downstream.implementation, "not started", item.name);
    assert(
      !result.requirements.some((requirement) =>
        /MongoDB|Mongoose|\/api\/notes|schema|controller/i.test(requirement),
      ),
      item.name,
    );
    assert.equal(result.status, item.expected.status, item.name);

    if (item.expected.requirement) {
      assert(
        result.requirements.some((requirement) => item.expected.requirement.test(requirement)),
        item.name,
      );
    }

    if (item.expected.acceptance) {
      assert(
        result.acceptance.some((condition) => item.expected.acceptance.test(condition)),
        item.name,
      );
    }

    if (item.expected.unresolved) {
      assert(
        result.unresolved.some((unknown) => item.expected.unresolved.test(unknown)),
        item.name,
      );
    }
  }
});

function specificationBoundaryFixture(discovery) {
  const requirements = [];
  const acceptance = [];
  const unresolved = [];

  if (discovery.status === "needs-clarification") {
    unresolved.push(discovery.findings.join("; "));
  }

  if (/create, edit, view, and delete private notes/i.test(discovery.request)) {
    requirements.push("An authenticated user can create, view, edit, and delete their own notes.");
    requirements.push("A user's notes remain private to that user's account.");
    acceptance.push("Creating a note makes it visible to that same user.");
  }

  if (/never be able to access another user's notes/i.test(discovery.request)) {
    requirements.push("A user must not receive or modify another user's note.");
    acceptance.push("Attempting to access another user's note does not disclose that note.");
  }

  if (/find their notes from the dashboard/i.test(discovery.request)) {
    requirements.push("An authenticated user can navigate from the dashboard to their notes.");
    acceptance.push("The dashboard exposes a notes navigation path.");
  }

  if (/keyboard navigation/i.test(discovery.request)) {
    requirements.push("The notes interface is usable without a pointing device.");
    acceptance.push("A keyboard user can reach and operate the notes workflow controls.");
  }

  return {
    originalRequest: discovery.request,
    status: discovery.status === "complete" ? "active" : "draft",
    requirements,
    acceptance,
    unresolved,
    lifecycle: {
      stage: "specification",
      next: discovery.status === "complete" ? "decomposition" : "blocked",
    },
    downstream: {
      decomposition: "not created",
      architecture: "not created",
      implementation: "not started",
    },
  };
}
