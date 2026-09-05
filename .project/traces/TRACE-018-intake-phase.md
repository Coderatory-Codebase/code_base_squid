---
id: TRACE-018
type: trace
title: Intake lifecycle phase implementation
status: completed
created: 2026-09-05
related: [SPEC-015, PLAN-008, PLAN-009, TRACE-020]
---

# TRACE-018: Intake Lifecycle Phase Implementation

## Request

Implement and prove only Phase 1: Intake in the existing agent operating
model.

## Classification

`FOUNDATION`.

This changes the repository operating layer and tooling. It does not
change the seed application.

## Research

Existing reusable mechanisms:

- `.project/state/PROJECT-STATE.md` for live project state.
- `.project/specs/SPEC-*` for durable requirements/specifications.
- `.project/ARTIFACT-TYPES.md` for artifact conventions.
- `.agent/workflows/*` for agent workflows.
- `SPEC-003`/`.agent/instructions/contracts.md` for contract guidance.
- `SPEC-013` and `.project/traces/TRACE-*` for traceability.
- `tooling/scripts/*.mjs` for dependency-free validation scripts.

Missing for Intake:

- no `REQ-*` artifact type
- no Intake workflow
- no executable Intake creator/validator
- no Intake tests

## Checkpoints

- Added `SPEC-015` to define the Intake phase and contract.
- Added `.agent/workflows/intake.md`.
- Added `tooling/scripts/intake-contract.mjs` and
  `tooling/scripts/intake.mjs`.
- Added `tooling/tests/intake.test.mjs`.
- Added `REQ-*` as a requirement/intake artifact convention.
- Executed a real Intake example:
  "Add personal notes functionality to the test application."
- Produced `REQ-001` and `TRACE-019`.

## Correction

`TRACE-020` superseded the implementation shape during the same M26 slice.
The agent kept the Intake workflow/spec/artifact evidence and removed the
standalone CLI/contract framework because it tested a helper abstraction
more than it tested actual agent behavior.

## Validation

- `node --test tooling/tests/intake.test.mjs` passed: 7 tests, 7 passed.
- `node tooling/scripts/intake.mjs validate` passed: 1 requirement
  artifact checked.
- `node tooling/scripts/validate-architecture-boundaries.mjs` passed.
- `git diff --check` passed.
- Initial `pnpm run test:intake` / `pnpm run validate:intake` attempts
  could not reach the scripts because missing workspace dependencies
  triggered package installation and registry access failed with
  `EACCES`.
- After elevated dependency installation, `pnpm run validate` passed:
  lint, typecheck, Vitest, Intake tests, build, architecture validation,
  Intake validation, and secret scan.
- `pnpm run format:check` passed.
