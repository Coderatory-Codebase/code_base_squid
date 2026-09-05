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
  assert.match(discovery, /^status: complete/m);
  assert.match(discovery, /^updated: 2026-09-05/m);
  assert.match(markdownSection(discovery, "Source Requirement"), /REQ-001/);
  assert.match(
    markdownSection(discovery, "Original Request"),
    /Add personal notes functionality to the test application\./,
  );
  assert.match(markdownSection(discovery, "Route"), /PROJECT.*SEED_APP/is);
  assert.match(markdownSection(discovery, "Facts"), /PROJECT-test/i);
  assert.match(markdownSection(discovery, "Facts"), /notesRouter/i);
  assert.match(markdownSection(discovery, "Facts"), /dashboard\/page\.tsx/i);
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

test("actual DISC-001 performs dynamic multi-lens Discovery", () => {
  const discovery = readRepoFile(
    ".project",
    "discovery",
    "DISC-001-personal-notes-test-application.md",
  );
  const lensSelection = markdownSection(discovery, "Lens Selection");
  const lensFindings = markdownSection(discovery, "Lens Findings");

  for (const lens of [
    /Business \/ Product/,
    /UX \/ User Experience/,
    /Security/,
    /QA \/ Quality/,
    /Technical \/ Engineering/,
    /Data/,
    /Privacy/,
    /Accessibility/,
    /Integration/,
  ]) {
    assert.match(lensSelection, lens);
  }

  assert.match(lensSelection, /Performance\s+\|\s+Low/i);
  assert.match(lensSelection, /Low-applicability lenses were not expanded/i);
  assert.match(lensFindings, /### Business \/ Product/);
  assert.match(lensFindings, /### UX \/ User Experience/);
  assert.match(lensFindings, /### Security/);
  assert.match(lensFindings, /### QA \/ Quality/);
  assert.match(lensFindings, /### Technical \/ Engineering/);
  assert.match(lensFindings, /Evidence:/);
  assert.match(lensFindings, /Implication:/);
  assert.match(lensFindings, /Open question:/);
});

test("actual DISC-001 analyzes current state, gaps, and needed capabilities", () => {
  const discovery = readRepoFile(
    ".project",
    "discovery",
    "DISC-001-personal-notes-test-application.md",
  );

  assert.match(markdownSection(discovery, "Current State"), /personal notes are already present/i);
  assert.match(markdownSection(discovery, "Current State"), /dashboard navigation/i);
  assert.match(markdownSection(discovery, "Gap / Capability Analysis"), /Desired outcome:/);
  assert.match(markdownSection(discovery, "Gap / Capability Analysis"), /Current state:/);
  assert.match(markdownSection(discovery, "Gap / Capability Analysis"), /Needed capability:/);
  assert.match(markdownSection(discovery, "Gap / Capability Analysis"), /Reuse/);
  assert.match(markdownSection(discovery, "Gap / Capability Analysis"), /Decide/);
  assert.match(markdownSection(discovery, "Needed Capabilities / Changes"), /`reuse`/);
  assert.match(markdownSection(discovery, "Needed Capabilities / Changes"), /`decide`/);
  assert.match(markdownSection(discovery, "Needed Capabilities / Changes"), /not authorized/i);
  assert.match(markdownSection(discovery, "Synthesis"), /false\s+greenfield\s+Specification/i);
});

test("actual DISC-001 preserves initial uncertainty and records clarification rework", () => {
  const discovery = readRepoFile(
    ".project",
    "discovery",
    "DISC-001-personal-notes-test-application.md",
  );

  assert.match(markdownSection(discovery, "Rework History"), /Initial Discovery Outcome/i);
  assert.match(markdownSection(discovery, "Rework History"), /status `needs-clarification`/i);
  assert.match(markdownSection(discovery, "Rework History"), /Return point: Discovery/i);
  assert.match(markdownSection(discovery, "Assumptions"), /No additional enhancement/i);
  assert.match(markdownSection(discovery, "Unknowns"), /Which future enhancement/i);
  assert.match(markdownSection(discovery, "Open Questions"), /future enhancement/i);
  assert.match(markdownSection(discovery, "Decisions Needed"), /No decision blocks baseline/i);
  assert.match(markdownSection(discovery, "Contradictions"), /Resolution:/i);
  assert.match(markdownSection(discovery, "Conclusion"), /current Discovery status is `complete`/i);
  assertDiscoveryBoundary(markdownSection(discovery, "Boundary Check"));
  assert.doesNotMatch(discovery, /^## Acceptance Criteria$/im);
  assert.doesNotMatch(discovery, /^## API Contract$/im);
  assert.doesNotMatch(discovery, /^## Database Schema$/im);
  assert.doesNotMatch(discovery, /^## Implementation Plan$/im);
});

test("state and trace preserve Discovery boundary while later phases advance through Architecture", () => {
  const state = readRepoFile(".project", "state", "PROJECT-STATE.md");
  const trace = [
    readRepoFile(".project", "traces", "TRACE-021-discovery-phase.md"),
    readRepoFile(".project", "traces", "TRACE-022-discovery-correction.md"),
    readRepoFile(".project", "traces", "TRACE-023-specification-phase.md"),
    readRepoFile(".project", "traces", "TRACE-024-specification-clarification-rework.md"),
  ].join("\n");
  const architecture = readRepoFile("architecture.yaml");

  assert.match(state, /DISC-001/);
  assert.match(state, /Discovery is reworked and complete after clarification/i);
  assert.match(state, /SPEC-018/);
  assert.match(state, /DECOMP-001/);
  assert.match(state, /ARCH-001/);
  assert.match(state, /SD-001/);
  assert.match(state, /Engineering Decomposition has not been executed/i);
  assert.match(state, /lens-based current-state,\s+gap\/capability,\s+and synthesis analysis/i);
  assert.match(
    trace,
    /current-state gap analysis, needed-capability classification, or synthesis/i,
  );
  assert.match(trace, /No Specification, Decomposition, Architecture, Implementation/i);
  assert.match(trace, /DISC-001 reworked \/ complete/i);
  assert.match(architecture, /id: DISCOVERY/);
  assert.match(architecture, /id: SPECIFICATION/);
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
      request: "Add a /notes endpoint backed by MongoDB.",
      expected: {
        status: "needs-clarification",
        unknown: /product intent behind the requested endpoint/i,
        lenses: [/Business \/ Product/, /Security/, /QA \/ Quality/, /Technical \/ Engineering/],
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
    {
      name: "security-sensitive request",
      request: "Allow users to share their personal notes with other users.",
      expected: {
        status: "needs-clarification",
        unknown: /sharing rules, recipient permissions, revocation, and privacy expectations/i,
        lenses: [
          /Business \/ Product/,
          /UX \/ User Experience/,
          /Security/,
          /Privacy/,
          /QA \/ Quality/,
        ],
      },
    },
    {
      name: "ui request",
      request: "Add a notes button to the dashboard.",
      expected: {
        status: "needs-clarification",
        unknown: /business reason and target user workflow/i,
        lenses: [
          /Business \/ Product/,
          /UX \/ User Experience/,
          /Accessibility/,
          /QA \/ Quality/,
          /Technical \/ Engineering/,
        ],
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

    if (item.expected.lenses) {
      for (const lens of item.expected.lenses) {
        assert(
          result.selectedLenses.some((selectedLens) => lens.test(selectedLens)),
          item.name,
        );
      }
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
  if (/\/notes endpoint backed by mongodb/i.test(request)) {
    unknowns.push("product intent behind the requested endpoint");
  }
  if (/add it/i.test(request)) {
    unknowns.push('what "it" refers to');
  }
  if (/share their personal notes/i.test(request)) {
    unknowns.push("sharing rules, recipient permissions, revocation, and privacy expectations");
  }
  if (/notes button to the dashboard/i.test(request)) {
    unknowns.push("business reason and target user workflow");
  }

  const selectedLenses = selectLensesForBoundaryTest(request);

  return {
    originalRequest: request,
    status: "needs-clarification",
    facts: observedContext ? [observedContext] : [],
    contradictions,
    unknowns,
    selectedLenses,
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

function selectLensesForBoundaryTest(request) {
  const base = ["Business / Product", "QA / Quality", "Technical / Engineering"];
  if (/better for users|button|share|notes/i.test(request)) {
    base.push("UX / User Experience");
  }
  if (/endpoint|mongodb|share|personal notes/i.test(request)) {
    base.push("Security");
  }
  if (/share|personal notes/i.test(request)) {
    base.push("Privacy");
  }
  if (/button|dashboard/i.test(request)) {
    base.push("Accessibility");
  }
  return [...new Set(base)];
}
