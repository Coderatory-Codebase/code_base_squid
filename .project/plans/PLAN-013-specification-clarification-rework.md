---
id: PLAN-013
type: plan
title: Specification clarification and rework correction
status: complete
created: 2026-09-05
related: [SPEC-017, SPEC-018, DISC-001, TRACE-024]
---

# PLAN-013: Specification Clarification and Rework Correction

## Problem

Phase 3 Specification could truthfully stop at `needs-clarification`, but
the operating model did not yet prove the controlled path for receiving
clarification, returning to the correct upstream phase, reworking upstream
understanding, and then revising Specification without inventing scope.

## Current Behavior

- `DISC-001` identified that personal notes already existed and marked the
  request `needs-clarification`.
- `SPEC-018` correctly stayed `draft`, kept candidate requirements
  inactive, and blocked Decomposition.
- The missing piece was the explicit rework loop after clarification.

## Desired Correction

- Define clarification as a control path, not a new lifecycle phase.
- Distinguish return-to-Intake, return-to-Discovery, and local
  Specification clarification cases.
- Preserve initial blocked outcomes instead of silently overwriting them.
- Rework `DISC-001` before revising `SPEC-018` when clarification changes
  Discovery-level understanding.
- Prove unresolved, failed, and successful clarification behavior with
  tests.

## Affected Artifacts

- `.agent/workflows/specification.md`
- `.project/specs/SPEC-017-specification-lifecycle-phase.md`
- `.project/specs/SPEC-018-personal-notes-test-application.md`
- `.project/discovery/DISC-001-personal-notes-test-application.md`
- `.project/ARTIFACT-TYPES.md`
- `.project/state/PROJECT-STATE.md`
- `architecture.yaml`
- `.project/roadmap/MILESTONES.yaml`
- `.agent/README.md`
- `.project/README.md`
- `README.md`
- `tooling/tests/specification.test.mjs`
- `tooling/tests/discovery.test.mjs`

## Tests

- `pnpm run test:intake`
- `pnpm run test:discovery`
- `pnpm run test:specification`
- `pnpm run validate`
- `pnpm run format:check`
- `git diff --check`

## Explicit Non-Goals

- Do not implement Decomposition or any later lifecycle phase.
- Do not create a clarification engine, lifecycle engine, CLI, state
  machine, or new traceability system.
- Do not create role-scoped agents.
- Do not invent product enhancements.
- Do not modify application source code.

## Outcome

Completed in `TRACE-024`.
