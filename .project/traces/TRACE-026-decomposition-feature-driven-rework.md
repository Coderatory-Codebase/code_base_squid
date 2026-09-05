---
id: TRACE-026
type: trace
title: Decomposition feature-driven rework
status: completed
created: 2026-09-05
related:
  [
    PLAN-015,
    SPEC-019,
    SPEC-010,
    DECOMP-001,
    SPEC-018,
    DISC-001,
    REQ-001,
    BACKLOG-012,
    BACKLOG-013,
    BACKLOG-014,
    BACKLOG-015,
    BACKLOG-016,
  ]
---

# TRACE-026: Decomposition Feature-Driven Rework

## Request

Correct Phase 4 so Decomposition proves feature-driven product
decomposition from `SPEC-018` into the existing backlog. Do not declare
the prior implementation sufficient; do not implement Architecture or
application source.

## Classification

`FOUNDATION` for the lifecycle and backlog-model correction, with
`PROJECT` evidence from the `test` seed application because the real proof
uses `REQ-001 -> DISC-001 -> SPEC-018`.

## Existing Mechanisms Inspected

- `AGENTS.md`, `.agent/README.md`, `.project/README.md`, and README
  orientation for repository/foundation versus project/product scope.
- `.agent/workflows/decomposition.md` and existing lifecycle workflows.
- `.project/ARTIFACT-TYPES.md` for artifact, backlog, rework, and trace
  conventions.
- `SPEC-007` for graph relationship vocabulary.
- `SPEC-010` for the single backlog, feature-driven development, work
  states, feature/task boundaries, and pending multilevel backlog
  migration.
- `SPEC-017` for the Specification readiness gate and clarification/rework
  loop.
- `SPEC-019` and `DECOMP-001` for the existing Phase 4 implementation.
- `.project/backlog/BACKLOG.md` for existing backlog rows, status values,
  kind values, and `BACKLOG-012`.
- `DISC-001` and `SPEC-018` for the real personal-notes evidence and
  active requirements.
- `.project/state/PROJECT-STATE.md`, `architecture.yaml`, and
  `.project/roadmap/MILESTONES.yaml` for current milestone state.
- Existing Intake, Discovery, Specification, and Decomposition lifecycle
  tests.

## What Was Wrong

The previous Phase 4 implementation proved that a `DECOMP-*` artifact
could consume a ready Specification, account for requirements, and stop
before Architecture. It did not prove the repository's intended
feature-driven development model because:

- `DECOMP-001` stopped at generic capabilities.
- Features were not the primary product units.
- The existing backlog did not carry the decomposed hierarchy.
- `Level`/`Parent` hierarchy was still future work in `BACKLOG-012`.
- Tests would pass without any feature rows in the backlog.

## Rework Performed

- Updated `SPEC-010` so the single backlog table explicitly includes
  `Level` and `Parent` columns and separates hierarchy from workflow
  `Status`.
- Updated `.project/backlog/BACKLOG.md` in place, preserving one backlog
  and completing `BACKLOG-012`.
- Added `BACKLOG-013` through `BACKLOG-016` as the product epic and
  Feature rows produced by `DECOMP-001`.
- Reworked `.agent/workflows/decomposition.md` and `SPEC-019` so
  Decomposition creates/refines ordinary backlog rows and makes Features
  the primary delivery units.
- Reworked `DECOMP-001` in place to preserve history while replacing the
  capability-only hierarchy with feature-driven product decomposition.
- Updated documentation pointers, state, architecture, and roadmap records.
- Replaced `tooling/tests/decomposition.test.mjs` with behavioral tests
  that require feature rows, backlog integration, state/hierarchy
  separation, requirement coverage, traceability, and downstream boundary
  discipline.

## Resulting Chain

```text
REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-013
                                           -> BACKLOG-014
                                           -> BACKLOG-015
                                           -> BACKLOG-016
```

## Resulting Product Hierarchy

```text
BACKLOG-013 Epic: Personal notes management
  -> BACKLOG-014 Feature: Manage owned personal notes
  -> BACKLOG-015 Feature: Protect personal note ownership
  -> BACKLOG-016 Feature: Reach personal notes from the authenticated workspace
```

The hierarchy stops at Features because `SPEC-018` authorizes a clarified
baseline, not technical task decomposition or new enhancement scope.

## Requirement Treatment

```text
SPEC-018-R001 -> BACKLOG-014 / DECOMP-001-U003
SPEC-018-R002 -> BACKLOG-015 / DECOMP-001-U004
SPEC-018-R003 -> BACKLOG-016 / DECOMP-001-U005
SPEC-018-R004 -> BACKLOG-014 / DECOMP-001-U003
SPEC-018-R005 -> quality constraint on BACKLOG-014 and BACKLOG-016
SPEC-018-R006 -> DECOMP-001-U006 / all feature boundaries
SPEC-018-R007 -> DECOMP-001-U007 / artifact traceability
```

## Boundary

No Architecture, Implementation Planning, Implementation, Verification,
Review, Delivery, Operate, `TASK-*`, API contract, database schema, UI
component design, source-code change, role, job, skill, CLI, engine, state
machine, second backlog, or `FEATURE-*` registry was created.

## Validation

- `pnpm run test:intake` passed: 4 tests, 4 passed.
- `pnpm run test:discovery` passed: 7 tests, 7 passed.
- `pnpm run test:specification` passed: 9 tests, 9 passed.
- `pnpm run test:decomposition` passed: 11 tests, 11 passed.
- `pnpm run validate` passed: lint, typecheck, Vitest, Intake tests,
  Discovery tests, Specification tests, Decomposition tests, build,
  architecture validation, and secret scan.
- Initial `pnpm run format:check` found formatting changes needed in seven
  edited files; `pnpm run format` normalized them.
- `git -c safe.directory=C:/workspace/_goaled/nutshyll diff --check`
  passed on the final tree.

No Phase 5 / Architecture artifact, implementation plan, engineering task
list, API contract, database schema, UI design, source-code change, role,
job, skill, engine, CLI, second backlog, or state machine was created.
