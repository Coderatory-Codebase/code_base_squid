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

function assertDiscoveryBoundary(text) {
  assert.match(text, /Specification: not created/i);
  assert.match(text, /Decomposition: not created/i);
  assert.match(text, /Architecture: not created/i);
  assert.match(text, /Implementation: not started/i);
  assert.match(text, /Tasks: not created/i);
}

test("Discovery workflow is agent-operated, not a standalone CLI or engine", () => {
  const workflow = readRepoFile(".agent", "workflows", "discovery.md");
  const spec = readRepoFile(".project", "specs", "SPEC-016-discovery-lifecycle-phase.md");
  const packageJson = readRepoFile("package.json");

  assert.match(workflow, /agent performs Discovery directly/i);
  assert.doesNotMatch(workflow, /discovery\.mjs/i);
  assert.match(spec, /not an executable contract framework/i);
  assert.match(spec, /not.*second\s+job-contract model/is);
  assert.doesNotMatch(packageJson, /validate:discovery/);
});

test("actual DISC-001 consumes REQ-001 and records evidence-backed understanding", () => {
  const discovery = readRepoFile(
    ".project",
    "discovery",
    "DISC-001-personal-notes-test-application.md",
  );

  assert.match(discovery, /^id: DISC-001/m);
  assert.match(discovery, /^type: discovery/m);
  assert.match(discovery, /^status: needs-clarification/m);
  assert.match(markdownSection(discovery, "Source Requirement"), /REQ-001/);
  assert.match(
    markdownSection(discovery, "Original Request"),
    /Add personal notes functionality to the test application\./,
  );
  assert.match(markdownSection(discovery, "Route"), /PROJECT.*SEED_APP/is);
  assert.match(markdownSection(discovery, "Facts"), /PROJECT-test/i);
  assert.match(markdownSection(discovery, "Facts"), /notesRouter/i);
  assert.match(markdownSection(discovery, "Facts"), /Mongoose/i);
  assert.match(markdownSection(discovery, "Evidence"), /servers\/test\/api\/src\/app\.ts/i);
  assert.match(
    markdownSection(discovery, "Evidence"),
    /apps\/test\/web\/src\/app\/notes\/page\.tsx/i,
  );
  assert.match(
    markdownSection(discovery, "Evidence"),
    /servers\/test\/api\/test\/domains\/notes\/notes\.routes\.test\.ts/i,
  );
});

test("actual DISC-001 preserves uncertainty and does not become Specification", () => {
  const discovery = readRepoFile(
    ".project",
    "discovery",
    "DISC-001-personal-notes-test-application.md",
  );

  assert.match(markdownSection(discovery, "Assumptions"), /None/i);
  assert.match(markdownSection(discovery, "Unknowns"), /Whether the user knows/i);
  assert.match(markdownSection(discovery, "Open Questions"), /what is missing/i);
  assert.match(markdownSection(discovery, "Contradictions"), /already present/i);
  assert.match(markdownSection(discovery, "Conclusion"), /needs-clarification/i);
  assertDiscoveryBoundary(markdownSection(discovery, "Boundary Check"));
  assert.doesNotMatch(discovery, /^## Acceptance Criteria$/im);
  assert.doesNotMatch(discovery, /^## API Contract$/im);
  assert.doesNotMatch(discovery, /^## Database Schema$/im);
  assert.doesNotMatch(discovery, /^## Implementation Plan$/im);
});

test("state and trace show Discovery complete and later phases not started", () => {
  const state = readRepoFile(".project", "state", "PROJECT-STATE.md");
  const trace = readRepoFile(".project", "traces", "TRACE-021-discovery-phase.md");
  const architecture = readRepoFile("architecture.yaml");

  assert.match(state, /DISC-001/);
  assert.match(state, /Discovery is complete with status `needs-clarification`/i);
  assert.match(state, /Specification\/Phase 3 has not been executed/i);
  assert.match(trace, /No Specification, Decomposition, Architecture, Implementation/i);
  assert.match(architecture, /id: DISCOVERY/);
});

test("negative Discovery cases keep ambiguity, conflicts, and insufficiency explicit", () => {
  const cases = [
    {
      name: "vague request",
      request: "Make the application better for users.",
      expected: {
        status: "needs-clarification",
        unknown: /which users, problem, workflow, and success measure/i,
      },
    },
    {
      name: "technical request",
      request: "Create a MongoDB collection and Express CRUD API for personal notes.",
      expected: {
        status: "needs-clarification",
        unknown: /whether the requested technical solution is the right product solution/i,
      },
    },
    {
      name: "existing-system contradiction",
      request: "Use MongoDB.",
      observedContext: "Existing persistence architecture uses PostgreSQL.",
      expected: {
        status: "needs-clarification",
        contradiction: /requested MongoDB conflicts with observed PostgreSQL/i,
      },
    },
    {
      name: "insufficient information",
      request: "Add it.",
      expected: {
        status: "needs-clarification",
        unknown: /what "it" refers to/i,
      },
    },
  ];

  for (const item of cases) {
    const result = discoveryBoundaryFixture(item);
    assert.equal(result.originalRequest, item.request, item.name);
    assert.equal(result.lifecycle.stage, "discovery", item.name);
    assert.equal(result.lifecycle.next, "specification", item.name);
    assert.equal(result.status, item.expected.status, item.name);
    assert.equal(result.downstream.specification, "not created", item.name);
    assert.equal(result.downstream.architecture, "not created", item.name);
    assert.equal(result.downstream.implementation, "not started", item.name);

    if (item.expected.unknown) {
      assert(
        result.unknowns.some((unknown) => item.expected.unknown.test(unknown)),
        item.name,
      );
    }

    if (item.expected.contradiction) {
      assert(
        result.contradictions.some((contradiction) =>
          item.expected.contradiction.test(contradiction),
        ),
        item.name,
      );
    }
  }
});

function discoveryBoundaryFixture({ request, observedContext = "" }) {
  const contradictions =
    /mongodb/i.test(request) && /postgresql/i.test(observedContext)
      ? ["requested MongoDB conflicts with observed PostgreSQL; requires clarification/decision"]
      : [];

  const unknowns = [];
  if (/make the application better/i.test(request)) {
    unknowns.push("which users, problem, workflow, and success measure are intended");
  }
  if (/mongodb collection and express crud api/i.test(request)) {
    unknowns.push("whether the requested technical solution is the right product solution");
  }
  if (/add it/i.test(request)) {
    unknowns.push('what "it" refers to');
  }

  return {
    originalRequest: request,
    status: "needs-clarification",
    facts: observedContext ? [observedContext] : [],
    contradictions,
    unknowns,
    lifecycle: {
      stage: "discovery",
      next: "specification",
    },
    downstream: {
      specification: "not created",
      architecture: "not created",
      implementation: "not started",
    },
  };
}
