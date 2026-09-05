---
id: TRACE-025
type: trace
title: Decomposition lifecycle phase
status: completed
created: 2026-09-05
updated: 2026-09-05
related: [PLAN-014, SPEC-019, DECOMP-001, SPEC-018, DISC-001, REQ-001, PLAN-015, TRACE-026]
---

# TRACE-025: Decomposition Lifecycle Phase

## Request

Implement and prove Phase 4 - Decomposition - of the lifecycle.
Decomposition must consume a ready Specification, break its authorized
scope into product/system units, and stop before Architecture,
Implementation Planning, Implementation, and later phases.

## Post-Completion Correction

Architectural review later found this trace's implementation incomplete:
it demonstrated product/capability classification but did not demonstrate
feature-driven product decomposition or backlog integration. `PLAN-015` /
`TRACE-026` is the corrective rework. The current authoritative Phase 4
result is the reworked `DECOMP-001` plus backlog rows `BACKLOG-013`
through `BACKLOG-016`.

## Classification

`FOUNDATION` for the lifecycle implementation.

The real Decomposition execution also uses `PROJECT` context from the
`test` seed application because `SPEC-018` is project-scoped.

## Existing Mechanisms Inspected

- `AGENTS.md`, `.agent/README.md`, `.project/README.md`, and `README.md`
  for operating-layer orientation.
- `architecture.yaml` and `.project/state/PROJECT-STATE.md` for active
  phase, boundaries, and current lifecycle state.
- `.project/ARTIFACT-TYPES.md` for artifact identity, lifecycle states,
  `TASK`, `BACKLOG`, `related:`, optional typed relations, and rework
  conventions.
- `SPEC-007` for graph relationship semantics.
- `SPEC-010` for backlog, feature, task, feature slicing, and discovery
  capture boundaries.
- `SPEC-013` for traceability and decision provenance.
- `SPEC-017` and `SPEC-018` for the source Specification readiness gate.
- `DISC-001` and `TRACE-024` for the clarified upstream evidence.
- Current Intake, Discovery, and Specification behavior tests.

## Existing Mechanisms Reused

- Existing `SPEC-*`, `PLAN-*`, `TRACE-*`, and `related:` conventions.
- Existing graph vocabulary for `depends-on`, `derived-from`,
  `satisfies`, and non-engine relationship reasoning.
- Existing backlog/task distinction: Decomposition is neither a backlog
  table row nor a `TASK-*` implementation unit.
- Existing clarification/rework path from `SPEC-017` for insufficient
  Specification input.

## Decisions

- Add `DECOMP-*` as a real artifact type because this phase has a real
  required output: `DECOMP-001`.
- Keep Decomposition as an agent-operated workflow, not a CLI, engine,
  state machine, role, skill, job-contract system, or second backlog.
- Use product/system units only: one outcome plus three capabilities for
  the clarified personal-notes baseline.
- Treat `SPEC-018-R006` and `SPEC-018-R007` as constraint/traceability
  coverage rather than false standalone product units.

## Actual Decomposition

```text
REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001
```

`DECOMP-001` contains:

- `DECOMP-001-U001` - Personal Notes Baseline Outcome
- `DECOMP-001-U002` - Notes Management Capability
- `DECOMP-001-U003` - Personal Access Boundary Capability
- `DECOMP-001-U004` - Notes Workspace Experience Capability

Every active `SPEC-018` requirement is mapped to a unit or accounted for
by rationale. Inactive candidates remain boundaries/non-goals only.

## Boundary

No Architecture, Implementation Planning, Implementation, Verification,
Review, Delivery, Operate, `TASK-*`, API contract, database schema, UI
component design, source-code change, role, job, skill, CLI, engine, state
machine, or second backlog/work-item/job-contract system was created.

## Validation

- `pnpm run test:intake` passed: 4 tests, 4 passed.
- `pnpm run test:discovery` passed: 7 tests, 7 passed.
- `pnpm run test:specification` passed: 9 tests, 9 passed.
- `pnpm run test:decomposition` passed: 9 tests, 9 passed.
- `pnpm run validate` passed: lint, typecheck, Vitest, Intake tests,
  Discovery tests, Specification tests, Decomposition tests, build,
  architecture validation, and secret scan.
- `pnpm run format:check` passed.
- `git -c safe.directory=C:/workspace/_goaled/nutshyll diff --check`
  passed.

No Phase 5 / Architecture artifact, implementation plan, engineering task
list, API contract, database schema, UI design, source-code change, role,
job, skill, engine, CLI, or state machine was created.
