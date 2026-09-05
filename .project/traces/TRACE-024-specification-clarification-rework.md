---
id: TRACE-024
type: trace
title: Specification clarification and rework correction
status: completed
created: 2026-09-05
related: [PLAN-013, SPEC-017, SPEC-018, DISC-001, REQ-001, TRACE-023]
---

# TRACE-024: Specification Clarification and Rework Correction

## Request

Correct Phase 3 so Specification has a controlled clarification/rework
path back to the appropriate upstream lifecycle phase. Prove the path
against `REQ-001 -> DISC-001 -> SPEC-018` without implementing
Decomposition or later phases.

## Classification

`FOUNDATION` for the operating-model correction, with `PROJECT` evidence
from the `test` seed application because the real demonstration work item
targets `apps/test/web` and `servers/test/api`.

## Existing Mechanisms Inspected

- `AGENTS.md`, `.agent/README.md`, `.project/README.md`, and `README.md`
  for repository orientation and foundation/project separation.
- `architecture.yaml` and `.project/state/PROJECT-STATE.md` for active
  milestone and lifecycle state.
- `.agent/workflows/intake.md`, `.agent/workflows/discovery.md`, and
  `.agent/workflows/specification.md`.
- `SPEC-013` for trace checkpoints, decision provenance, and human input.
- `SPEC-016` for Discovery status and evidence ownership.
- `SPEC-017` for Specification status/readiness and boundaries.
- `.project/ARTIFACT-TYPES.md` for status, `updated:`, supersession, and
  trace conventions.
- `REQ-001`, `DISC-001`, `SPEC-018`, `TRACE-023`, and related tests.

## What Already Existed

- `draft` Specifications could carry readiness `needs-clarification` or
  `blocked`.
- `DISC-*` artifacts could be `needs-clarification`.
- `TRACE-*` already had human-input and decision-provenance fields.
- `BACKLOG` already had `clarifying` and `blocked` states, but backlog was
  not the right place to represent this active lifecycle gate.
- Artifact updates already had an `updated:` field and `superseded` status
  when a replacement artifact is warranted.

## Missing Behavior

The model did not yet state how a blocked Specification should route a
clarification back upstream, nor prove that clarification changes
Discovery-level understanding before a downstream Specification claims
readiness.

## Clarification Used

Source: agent-introduced product clarification for the correction proof,
allowed by the requested real execution test.

Clarification:

> The intent is to improve the existing personal notes capability rather
> than create a new notes system. Preserve the existing authenticated-owner
> personal-notes model as the product baseline for this work. Do not add
> search, tags, sharing, export, pagination, rich text, attachments,
> reminders, collaboration, migration, or documentation scope from this
> clarification.

Decision source: agent decision applying the user's requested example
clarification pattern. Status: applied for proof of the lifecycle loop.

## Rework

- Updated `.agent/workflows/specification.md` to define return points:
  Intake plus Discovery for changed request/route/intent, Discovery for
  evidence or understanding changes, Specification-only for wording
  clarification that does not change upstream facts, and no advancement
  for failed clarification.
- Updated `SPEC-017` with clarification/rework semantics, the rework
  convention, and the readiness gate for Decomposition.
- Updated `.project/ARTIFACT-TYPES.md` with the smallest rework convention:
  update in place with `updated:` and history when identity is stable;
  supersede only when the work item changes identity.
- Reworked `DISC-001` first, preserving the initial
  `needs-clarification` outcome and recording the clarification as
  Discovery-level understanding.
- Revised `SPEC-018` after `DISC-001`, preserving the initial draft
  blocker and making the clarified baseline `ready-for-decomposition`.

## Resulting Chain

```text
Human request
  -> REQ-001
  -> DISC-001 initial needs-clarification
  -> SPEC-018 initial draft / needs-clarification
  -> TRACE-024 clarification/rework
  -> DISC-001 reworked / complete
  -> SPEC-018 revised / ready-for-decomposition
```

## Boundary

No Decomposition, Architecture, Implementation, Verification, Delivery,
Operate, Feedback, task breakdown, API contract, schema, or application
source change was created.

## Validation

- `pnpm run test:intake` passed: 4 tests, 4 passed.
- `pnpm run test:discovery` passed: 7 tests, 7 passed.
- `pnpm run test:specification` passed: 9 tests, 9 passed.
- Initial `pnpm run format:check` found formatting changes needed in five
  edited files; `pnpm run format` normalized them.
- `pnpm run validate` passed: lint, typecheck, Vitest, Intake tests,
  Discovery tests, Specification tests, build, architecture validation, and
  secret scan.
- Final `pnpm run format:check` passed.
- `git -c safe.directory=C:/workspace/_goaled/nutshyll diff --check`
  passed.

No Phase 4 / Decomposition artifact, task breakdown, implementation plan,
architecture artifact, API contract, schema, or application source change
was created.
