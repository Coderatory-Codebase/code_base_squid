---
id: TRACE-023
type: trace
title: Specification lifecycle phase
status: completed
created: 2026-09-05
related: [SPEC-017, SPEC-018, PLAN-012, REQ-001, DISC-001]
---

# TRACE-023: Specification Lifecycle Phase

## Request

Implement and validate Phase 3 - Specification - of the existing software
lifecycle. Consume Discovery, produce explicit testable requirements, and
stop before Decomposition, Architecture, Implementation, and later phases.

## Classification

`FOUNDATION` for the lifecycle implementation.

The real Specification execution also read the `test` project context
because `DISC-001` routes `REQ-001` to the seed application.

## Research

Existing mechanisms reused:

- Existing `SPEC-*` artifact type in `.project/specs/`.
- Existing `related:` traceability and prose artifact references.
- `SPEC-010` for SPEC escalation, acceptance criteria quality, and scope
  control.
- `SPEC-011` and `SPEC-014` for routing and dual operating scope.
- `SPEC-013` for traceability.
- `SPEC-015`, `REQ-001`, `SPEC-016`, and `DISC-001` for the upstream
  lifecycle chain.

No separate Specification Job Contract files or validator/registry existed.
No new framework was needed.

## Checkpoints

- Added `SPEC-017` to define the Specification lifecycle phase.
- Added `.agent/workflows/specification.md`.
- Reused ordinary `SPEC-*` artifacts for phase output.
- Executed Specification from `DISC-001`.
- Produced draft `SPEC-018`.
- Added `tooling/tests/specification.test.mjs`.
- Updated package scripts, `architecture.yaml`, `.project/state`,
  `.project/roadmap/MILESTONES.yaml`, `AGENTS.md`, `.agent/README.md`,
  `.project/README.md`, and `.project/ARTIFACT-TYPES.md`.

## Real Specification Result

`DISC-001` established that personal notes already exist in the seed app
and that the intended delta is unresolved. `SPEC-018` therefore stays
`draft` with readiness `needs-clarification`. It records active
requirements to resolve the intended outcome and prevent duplicate notes
scope, plus candidate requirements that may become active only after the
human/product intent is clarified.

## Boundary

No Decomposition, Architecture, Implementation, Verification, Review,
Delivery, Operate, or Feedback work was performed for `REQ-001`.

## Validation

- `pnpm run test:specification` passed: 7 tests, 7 passed.
- `pnpm run test:intake` passed after state/test updates: 4 tests, 4
  passed.
- `pnpm run test:discovery` passed after state/test updates: 7 tests, 7
  passed.
- First `pnpm run format:check` found Prettier wrapping issues in
  `.project/ARTIFACT-TYPES.md`,
  `.project/specs/SPEC-014-agent-operating-model-realignment.md`,
  `.project/specs/SPEC-018-personal-notes-test-application.md`, and
  `tooling/tests/specification.test.mjs`; normalized them with the local
  Prettier shim.
- `pnpm run validate` passed: lint, typecheck, Vitest, Intake behavior
  tests, Discovery behavior tests, Specification behavior tests, build,
  architecture boundary validation, and secret scan.
- Final `pnpm run format:check` passed.
- `git -c safe.directory=C:/workspace/_goaled/nutshyll diff --check`
  passed.
