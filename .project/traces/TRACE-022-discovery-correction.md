---
id: TRACE-022
type: trace
title: Discovery correction
status: completed
created: 2026-09-05
related: [SPEC-016, PLAN-011, DISC-001, TRACE-021]
---

# TRACE-022: Discovery Correction

## Request

Correct the already-implemented Phase 2 Discovery so it investigates
requested outcomes through relevant lenses, establishes current state,
identifies gaps and needed capabilities, and synthesizes readiness for
Specification without entering Specification.

## Classification

`FOUNDATION`.

The correction changes the repository operating layer and the Discovery
artifact. It does not change application source.

## Research

Discovery already correctly reused `.agent/workflows`,
`.project/ARTIFACT-TYPES.md`, state, traces, `SPEC-010`, `SPEC-011`,
`SPEC-014`, and `app-analysis.md`. It also correctly avoided a CLI,
engine, state machine, duplicate validator, and duplicate trace system.

The gap was breadth: `DISC-001` and the tests focused heavily on
uncertainty/boundary proof and did not make dynamic lens selection,
current-state gap analysis, needed-capability classification, or synthesis
explicit enough.

## Corrections

- Expanded `.agent/workflows/discovery.md` with lens selection, current
  state investigation, gap/capability analysis, and synthesis.
- Expanded `SPEC-016` with lens selection, gap/capability analysis, and
  synthesis requirements.
- Expanded `.project/ARTIFACT-TYPES.md` to include those sections in the
  `DISC-*` artifact convention.
- Corrected `DISC-001` to include lens applicability/findings, current
  state, gap/needed-capability analysis, existing and missing
  capabilities, decisions needed, and synthesis.
- Expanded `tooling/tests/discovery.test.mjs` to cover multi-lens
  behavior, current-state evidence, gap analysis, security-sensitive/UI/
  technical requests, dynamic lens selection, and phase boundaries.

## Boundary

No Specification, Decomposition, Architecture, Implementation,
Verification, Review, Delivery, Operation, or Feedback work was performed.

## Validation

- `pnpm run test:discovery` passed: 7 tests, 7 passed.
- `pnpm run validate` passed: lint, typecheck, Vitest, Intake behavior
  tests, Discovery behavior tests, build, architecture boundary
  validation, and secret scan.
- First `pnpm run format:check` found Prettier wrapping issues in
  `.agent/workflows/discovery.md`,
  `.project/discovery/DISC-001-personal-notes-test-application.md`, and
  `tooling/tests/discovery.test.mjs`; normalized them with the local
  Prettier shim.
- Final `pnpm run format:check` passed.
- `git -c safe.directory=C:/workspace/_goaled/nutshyll diff --check`
  passed.
