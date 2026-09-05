---
id: TRACE-020
type: trace
title: Intake correction
status: completed
created: 2026-09-05
related: [SPEC-015, PLAN-009, REQ-001, TRACE-018, TRACE-019]
---

# TRACE-020: Intake Correction

## Request

Correct the Phase 1 Intake implementation so it works as an agent
operating-model phase for both the foundation and project/product work,
not as a standalone CLI, state machine, or executable contract framework.

## Classification

`FOUNDATION`.

The change repairs the repository's operating layer. It does not begin a
new project feature.

## Research

The existing canonical mechanisms are:

- `.agent/workflows/intake.md` for agent Intake behavior.
- `.project/ARTIFACT-TYPES.md` for artifact conventions.
- `.project/specs/SPEC-015-intake-lifecycle-phase.md` for the Intake
  phase contract.
- `.project/state/PROJECT-STATE.md` for current lifecycle state.
- `.project/traces/TRACE-*` for meaningful execution traceability.
- `tooling/tests/intake.test.mjs` for behavioral proof.

## Corrections

- Removed `tooling/scripts/intake-contract.mjs`.
- Removed `tooling/scripts/intake.mjs`.
- Removed `validate:intake` from the repository validation chain.
- Rewrote `tooling/tests/intake.test.mjs` to assert current workflow,
  artifact, state, trace, and negative boundary behavior.
- Rewrote `REQ-001` as a normal requirement artifact with facts,
  unknowns, assumptions, lifecycle state, and boundary checks instead of
  an embedded JSON contract.
- Updated `SPEC-015` and `.agent/workflows/intake.md` so Intake is an
  agent-executed workflow, not a framework.

## Boundary

No Discovery, Specification, Decomposition, Architecture, Implementation,
Verification, Delivery, Operation, or Feedback work was performed for the
personal-notes request. The request is ready for Discovery only.

## Validation

- `pnpm run test:intake` passed: 4 tests, 4 passed.
- `pnpm run validate` passed: lint, typecheck, Vitest, Intake behavior
  tests, build, architecture boundary validation, and secret scan.
- `pnpm run format:check` passed.
- `git diff --check` passed.
- Fresh read-only verifier returned `PASS WITH GAPS`; the only gap was
  state-file ambiguity between the historical `TRACE-014` personal-notes
  feature and the new `REQ-001` Intake-only demonstration. Clarified in
  `.project/state/PROJECT-STATE.md`.
