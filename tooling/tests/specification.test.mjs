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
  assert.match(text, /Decomposition: created later by Phase 4/i);
  assert.match(text, /Architecture: created later by Phase 5/i);
  assert.match(text, /Implementation Planning: not created/i);
  assert.match(text, /Implementation: not started/i);
  assert.match(text, /Tasks: created later by Phase 7 rework/i);
}

test("Specification workflow defines clarification/rework without a standalone subsystem", () => {
  const workflow = readRepoFile(".agent", "workflows", "specification.md");
  const spec = readRepoFile(".project", "specs", "SPEC-017-specification-lifecycle-phase.md");
  const artifactTypes = readRepoFile(".project", "ARTIFACT-TYPES.md");
  const packageJson = readRepoFile("package.json");

  assert.match(workflow, /Clarification is a control path, not a lifecycle phase/i);
  assert.match(workflow, /Return point/i);
  assert.match(spec, /Clarification is not a new lifecycle phase/i);
  assert.match(spec, /Readiness Gate/i);
  assert.match(artifactTypes, /Rework and clarification/i);
  assert.doesNotMatch(workflow, /clarification\.mjs|specification\.mjs/i);
  assert.doesNotMatch(spec, /^## Requirement Registry$/im);
  assert.match(packageJson, /"test:specification"/);
});

test("actual SPEC-018 consumes REQ-001 and reworked DISC-001 with traceability", () => {
  const specification = readRepoFile(
    ".project",
    "specs",
    "SPEC-018-personal-notes-test-application.md",
  );

  assert.match(specification, /^id: SPEC-018/m);
  assert.match(specification, /^type: spec/m);
  assert.match(specification, /^status: active/m);
  assert.match(specification, /^updated: 2026-09-05/m);
  assert.match(specification, /related: \[REQ-001, DISC-001, SPEC-017, TRACE-023, TRACE-024/);
  assert.match(markdownSection(specification, "Source Discovery"), /DISC-001/);
  assert.match(markdownSection(specification, "Source Requirement"), /REQ-001/);
  assert.match(
    markdownSection(specification, "Original Request"),
    /Add personal notes functionality to the test application\./,
  );
  assert.match(markdownSection(specification, "Route"), /PROJECT.*SEED_APP/is);
  assert.match(
    markdownSection(specification, "Traceability"),
    /REQ-001[\s\S]*DISC-001 initial needs-clarification[\s\S]*SPEC-018 initial draft/i,
  );
  assert.match(
    markdownSection(specification, "Traceability"),
    /DISC-001 reworked \/ complete[\s\S]*SPEC-018 revised \/ ready-for-decomposition/i,
  );
});

test("actual SPEC-018 preserves the initial blocked Specification outcome", () => {
  const specification = readRepoFile(
    ".project",
    "specs",
    "SPEC-018-personal-notes-test-application.md",
  );
  const reworkHistory = markdownSection(specification, "Rework History");
  const clarificationGate = markdownSection(specification, "Clarification Gate");

  assert.match(reworkHistory, /originally ended as `draft`/i);
  assert.match(reworkHistory, /readiness\s+`needs-clarification`/i);
  assert.match(reworkHistory, /blocked Decomposition/i);
  assert.match(reworkHistory, /candidate requirements as inactive/i);
  assert.match(clarificationGate, /Initial unresolved intent/i);
  assert.match(clarificationGate, /Failed or irrelevant clarification/i);
  assert.match(clarificationGate, /Successful clarification/i);
});

test("actual SPEC-018 becomes ready only after Discovery-level clarification is reworked upstream", () => {
  const discovery = readRepoFile(
    ".project",
    "discovery",
    "DISC-001-personal-notes-test-application.md",
  );
  const specification = readRepoFile(
    ".project",
    "specs",
    "SPEC-018-personal-notes-test-application.md",
  );

  assert.match(discovery, /^status: complete/m);
  assert.match(markdownSection(discovery, "Rework History"), /Initial Discovery Outcome/i);
  assert.match(markdownSection(discovery, "Rework History"), /Return point: Discovery/i);
  assert.match(
    markdownSection(discovery, "Desired Outcome"),
    /existing personal-notes capability.*baseline/is,
  );
  assert.match(
    markdownSection(specification, "Specification Readiness"),
    /ready-for-decomposition/i,
  );
  assert.match(
    markdownSection(specification, "Discovery Inputs Used"),
    /clarification recorded in `DISC-001`/i,
  );
});

test("actual SPEC-018 activates only baseline requirements and keeps enhancement candidates inactive", () => {
  const specification = readRepoFile(
    ".project",
    "specs",
    "SPEC-018-personal-notes-test-application.md",
  );
  const activeRequirements = markdownSection(specification, "Active Requirements");
  const candidates = markdownSection(specification, "Candidate Requirements Not Yet Active");

  assert.match(activeRequirements, /Preserve Existing Notes Baseline/i);
  assert.match(activeRequirements, /Maintain Ownership Isolation/i);
  assert.match(activeRequirements, /Keep Notes Discoverable/i);
  assert.match(activeRequirements, /Preserve Durable Personal Notes/i);
  assert.match(activeRequirements, /Do Not Create a Duplicate Notes System/i);
  assert.match(candidates, /search, tags, sharing, export, pagination/i);
  assert.match(candidates, /inactive/);
  assert.match(candidates, /frontend component tests or end-to-end coverage/i);
  assert.doesNotMatch(activeRequirements, /search|tags|sharing|export|pagination|rich text/i);
});

test("actual SPEC-018 still preserves Architecture, task, and implementation boundaries", () => {
  const specification = readRepoFile(
    ".project",
    "specs",
    "SPEC-018-personal-notes-test-application.md",
  );
  const activeRequirements = markdownSection(specification, "Active Requirements");

  assertSpecificationBoundary(markdownSection(specification, "Boundary Check"));
  assert.match(
    markdownSection(specification, "Lifecycle State"),
    /Decomposition: complete in `DECOMP-001`/i,
  );
  assert.doesNotMatch(specification, /^## API Contract$/im);
  assert.doesNotMatch(specification, /^## Database Schema$/im);
  assert.doesNotMatch(specification, /^## Implementation Plan$/im);
  assert.doesNotMatch(specification, /^## Task Breakdown$/im);
  assert.doesNotMatch(activeRequirements, /controller name|component name|schema field/i);
});

test("state and trace record the clarification/rework loop and readiness gate", () => {
  const state = readRepoFile(".project", "state", "PROJECT-STATE.md");
  const trace = readRepoFile(
    ".project",
    "traces",
    "TRACE-024-specification-clarification-rework.md",
  );
  const architecture = readRepoFile("architecture.yaml");

  assert.match(state, /TRACE-024/);
  assert.match(state, /Specification is\s+active with readiness `ready-for-decomposition`/i);
  assert.match(state, /DECOMP-001/);
  assert.match(state, /ARCH-001/);
  assert.match(state, /SD-001/);
  assert.match(state, /ENG-001/);
  assert.match(state, /Implementation has not started/i);
  assert.match(trace, /DISC-001 initial needs-clarification/i);
  assert.match(trace, /DISC-001 reworked \/ complete/i);
  assert.match(trace, /SPEC-018 revised \/ ready-for-decomposition/i);
  assert.match(trace, /No Decomposition, Architecture, Implementation/i);
  assert.match(architecture, /id: DECOMPOSITION/);
});

test("clarification behavior covers unresolved, failed, and successful rework paths", () => {
  const unresolved = specificationLifecycleFixture({
    discovery: {
      status: "needs-clarification",
      unresolvedIssue: "intended product delta is unknown",
      candidates: ["create/list/edit/delete baseline", "search enhancement"],
    },
  });

  assert.equal(unresolved.specification.status, "draft");
  assert.equal(unresolved.specification.readiness, "needs-clarification");
  assert.equal(unresolved.lifecycle.next, "blocked");
  assert.equal(canEnterDecomposition(unresolved.specification), false);
  assert.deepEqual(unresolved.specification.activeRequirements, []);

  const failedClarification = specificationLifecycleFixture({
    discovery: {
      status: "needs-clarification",
      unresolvedIssue: "desired delta is unknown",
      candidates: ["create/list/edit/delete baseline", "search enhancement"],
    },
    clarification: "Make it better.",
  });

  assert.equal(failedClarification.specification.status, "draft");
  assert.equal(failedClarification.specification.readiness, "needs-clarification");
  assert.equal(failedClarification.upstreamRework.changed, false);
  assert.equal(canEnterDecomposition(failedClarification.specification), false);

  const successfulClarification = specificationLifecycleFixture({
    discovery: {
      status: "needs-clarification",
      unresolvedIssue: "desired delta is unknown",
      candidates: ["create/list/edit/delete baseline", "search enhancement"],
    },
    clarification:
      "Improve the existing personal notes capability rather than create a new notes system; preserve the authenticated-owner baseline only.",
  });

  assert.equal(successfulClarification.upstreamRework.phase, "discovery");
  assert.equal(successfulClarification.upstreamRework.changed, true);
  assert.equal(successfulClarification.discovery.status, "complete");
  assert.equal(successfulClarification.specification.status, "active");
  assert.equal(successfulClarification.specification.readiness, "ready-for-decomposition");
  assert.equal(canEnterDecomposition(successfulClarification.specification), true);
  assert(
    successfulClarification.specification.activeRequirements.some((requirement) =>
      /authenticated-owner baseline/i.test(requirement),
    ),
  );
  assert(
    successfulClarification.specification.inactiveCandidates.some((candidate) =>
      /search enhancement/i.test(candidate),
    ),
  );
});

test("traceability survives rework and Specification is not sole source of clarified facts", () => {
  const result = specificationLifecycleFixture({
    discovery: {
      status: "needs-clarification",
      unresolvedIssue: "desired delta is unknown",
      candidates: ["create/list/edit/delete baseline", "search enhancement"],
    },
    clarification:
      "Improve the existing personal notes capability rather than create a new notes system; preserve the authenticated-owner baseline only.",
  });

  assert.deepEqual(result.trace.chain, [
    "REQ-001",
    "DISC-001 initial needs-clarification",
    "SPEC-018 initial draft needs-clarification",
    "clarification received",
    "DISC-001 reworked complete",
    "SPEC-018 revised ready-for-decomposition",
  ]);
  assert.equal(result.specification.sources.includes("DISC-001 clarified baseline"), true);
  assert.equal(result.upstreamRework.phase, "discovery");
});

function canEnterDecomposition(specification) {
  return (
    specification.status === "active" &&
    specification.readiness === "ready-for-decomposition" &&
    specification.upstreamEvidence === "complete" &&
    specification.blockingDecisions.length === 0
  );
}

function specificationLifecycleFixture({ discovery, clarification }) {
  const initialSpec = {
    status: "draft",
    readiness: "needs-clarification",
    upstreamEvidence: discovery.status,
    activeRequirements: [],
    inactiveCandidates: discovery.candidates,
    blockingDecisions: [discovery.unresolvedIssue],
    sources: ["REQ-001", "DISC-001 initial"],
  };

  if (!clarification) {
    return {
      discovery,
      specification: initialSpec,
      upstreamRework: { phase: null, changed: false },
      lifecycle: { next: "blocked" },
      trace: {
        chain: ["REQ-001", "DISC-001 initial needs-clarification", "SPEC-018 draft blocked"],
      },
    };
  }

  const resolvesBaseline =
    /existing personal notes capability/i.test(clarification) &&
    /authenticated-owner baseline/i.test(clarification);

  if (!resolvesBaseline) {
    return {
      discovery,
      specification: initialSpec,
      upstreamRework: { phase: "discovery", changed: false },
      lifecycle: { next: "blocked" },
      trace: {
        chain: [
          "REQ-001",
          "DISC-001 initial needs-clarification",
          "SPEC-018 initial draft needs-clarification",
          "clarification received but unresolved",
        ],
      },
    };
  }

  const reworkedDiscovery = {
    ...discovery,
    status: "complete",
    clarifiedUnderstanding:
      "Improve/preserve the existing personal notes capability; authenticated-owner baseline only.",
  };

  return {
    discovery: reworkedDiscovery,
    upstreamRework: { phase: "discovery", changed: true },
    specification: {
      status: "active",
      readiness: "ready-for-decomposition",
      upstreamEvidence: "complete",
      activeRequirements: [
        "Preserve the authenticated-owner baseline for personal notes.",
        "Do not create a duplicate notes system.",
      ],
      inactiveCandidates: discovery.candidates.filter((candidate) => !/baseline/i.test(candidate)),
      blockingDecisions: [],
      sources: ["REQ-001", "DISC-001 clarified baseline"],
    },
    lifecycle: { next: "decomposition" },
    trace: {
      chain: [
        "REQ-001",
        "DISC-001 initial needs-clarification",
        "SPEC-018 initial draft needs-clarification",
        "clarification received",
        "DISC-001 reworked complete",
        "SPEC-018 revised ready-for-decomposition",
      ],
    },
  };
}
