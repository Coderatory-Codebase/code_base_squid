---
id: SPEC-004
type: spec
title: Development lifecycle — required properties
status: active
created: 2026-08-30
related: [SPEC-001, ADR-005]
---

# SPEC-004: Development Lifecycle

Operational guidance for agents: `.agent/instructions/development-lifecycle.md`.
This spec is the durable statement of what must hold true; that file is
how an agent applies it.

## What must be true of any piece of development work in this repository

- **Every change passes through a defined stage sequence**:
  `UNDERSTAND → PLAN → IMPLEMENT → VALIDATE → REVIEW → RECORD → COMPLETE`.
  A stage may be trivial (RECORD is a no-op when nothing durable
  resulted), but it is never skipped by assumption.
- **Artifact usage is proportional to the work**, decided by what's
  actually true about the change — not by a fixed checklist applied
  uniformly. A trivial fix needing no SPEC and an architectural change
  needing an ADR are both correct outcomes of the same rule.
- **"Implementation complete" and "work complete" are distinct**, and a
  change is not reported as finished until it is work-complete: behavior
  verified, quality gates passing, reviewed, durable information
  recorded, scope matching what was actually required.
- **A validation failure produces a fix/revalidate loop, never a
  workaround.** Quality gates are not weakened, tests are not deleted,
  and unrelated code is not changed to reach green. A failure that
  reveals an architectural problem returns to UNDERSTAND/PLAN rather than
  being patched repeatedly at the symptom.
- **Scope is bounded to what's required or a necessary dependency.** An
  adjacent improvement discovered mid-implementation is recorded or
  deferred, not folded into the current change.
- **Review evaluates correctness, architecture, scope, quality,
  regression risk, maintainability, and whether durable decisions were
  recorded** — not code style alone.
- **`TASK` and `HANDOFF` are available, never mandatory.** Their creation
  criteria are defined in `.project/ARTIFACT-TYPES.md`; most work
  produces neither.
- **No stage requires a dedicated software system.** The lifecycle is a
  protocol an agent or human follows directly — not an orchestration
  engine, task database, or state-machine runtime. Any tooling this spec
  references (the `validate-repository` skill) already existed before
  this spec and is invoked, not reimplemented.

## Relationship to earlier decisions

This spec is the realized form of `architecture.yaml` →
`agent_native_lifecycle` (`loop`, `implementation_flow`), established at
M01 and left as a structural placeholder until now. It does not change
`ADR-001`–`ADR-008` or `SPEC-001`/`SPEC-003` — it operates within the
boundaries and package/contract model they already establish.

## Status

`active` — governs how development work proceeds in this repository from
M06 onward.
