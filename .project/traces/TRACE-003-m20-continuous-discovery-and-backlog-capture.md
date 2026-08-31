---
id: TRACE-003
type: trace
title: M20 — continuous discovery & backlog capture
status: completed
created: 2026-08-31
related: [SPEC-010, SPEC-013, TRACE-001, TRACE-002]
---

# TRACE-003: M20 — Continuous Discovery & Backlog Capture

Written progressively, per `SPEC-013` → "Progressive recording" (added
M19) — created at the first checkpoint, appended as work actually
happens.

## Request

"M20 — Continuous Discovery & Backlog Capture": a trace can currently
say a discovery happened without the discovery necessarily producing an
explicit outcome (implemented / backlog item / escalated / rejected /
already tracked). Make continuous discovery-and-capture an explicit,
cross-cutting operating behavior — not a new lifecycle, not a backlog
engine.

## Checkpoint: orient

**Status**: completed.

**Actions**: checked `git log`/`git status` — M18/M19's changes remain
uncommitted (the user has not committed since M17). This trace file
created now, at the start, not after.

**Outcome**: proceed to classify and understand.

## Checkpoint: classify

**Status**: completed.

**Classification**: `governance` — same category as M12/M15/M17/M18/M19.

## Checkpoint: understand

**Status**: completed.

**Actions**: re-read `SPEC-010` (full) and
`backlog-and-feature-development.md` (full) — both already known from
M15 but re-verified rather than assumed, per this milestone's own
inspection requirement.

**Observations**: `SPEC-010` already has "Discovery capture" (capture as
a `captured` item with what/why/where/trigger/required-now/dependency),
"Deferred work" (discovered ≠ deferred; a reason is required), "Scope
control" (the discovery-does-not-expand-scope anti-pattern), and
"Backlog updates after a feature" (an end-of-feature reconciliation
step) — genuinely close to what M20 asks for, but scattered across
sections and framed around analysis/implementation and end-of-feature,
not explicitly cross-cutting every stage or unified into one decision
procedure with named outcomes. `SPEC-013` (M18/M19) already has a
`discoveries` field on a checkpoint, but nothing requires that field to
carry an explicit resolution.

**Constraints identified**: must not create a second backlog model, a
second taxonomy of `kind:` values, a new lifecycle stage, or an ADR
(this is an extension of an already-decided model, not a new decision
between alternatives — same category as M14/M16/M19).

**Outcome**: this is an _amendment to `SPEC-010`_, not a new SPEC —
matches the milestone's own explicit preference ("prefer amending
SPEC-010... create a new SPEC only if sufficiently distinct"). Small,
corresponding updates to `backlog-and-feature-development.md`,
`development-lifecycle.md` (one completion-criteria bullet), and
`SPEC-013` (one cross-reference, no restatement).

## Checkpoint: analyze

**Status**: completed.

**Lenses used**: consistency (does the new decision model contradict
anything already in `SPEC-010`? — no, it unifies pieces that already
existed), proportionality (does formalizing this risk turning every
observation into backlog ceremony? — mitigated by an explicit, itemized
"meaningful discovery" threshold, expanded from `SPEC-010`'s existing
one-line version), graph (no new relationship type needed —
`discovered-from`, added M15/M18, already covers this).

**Decision**: amend `SPEC-010` with a "Discovery decision model" section
(five named outcomes: needed now / decision required / future work /
already tracked / rejected) and an expanded "Meaningful discovery
threshold." Source: agent decision, directly implementing the
milestone's explicit instructions. Status: applied.

## Checkpoint: plan

**Status**: completed.

**Scope — needed now**: `SPEC-010` amendment (decision model + threshold

- explicit cross-cutting framing + duplicate-prevention note),
  `backlog-and-feature-development.md` update, one `development-lifecycle.md`
  completion-criteria bullet, one `SPEC-013` cross-reference, `TRACE-003`
  itself.

**Scope — explicitly not needed**: a new SPEC, an ADR, a new backlog
taxonomy, a new lifecycle stage, a backlog engine/database/API/CLI/UI,
any manufactured backlog item.

**Deferred**: nothing new.

## Checkpoint: implement

**Status**: completed.

**Actions**: amended `SPEC-010` (M20 blockquote; broadened "Discovery
capture" to be explicitly cross-cutting; new "Discovery decision model"
section — five named outcomes; new "Meaningful discovery threshold"
section; new "Discovery/backlog reconciliation" completion check under
"Backlog updates after a feature"). Updated
`backlog-and-feature-development.md` (new "Discovery is continuous, not
an end-of-task memory exercise" section; reconciliation reference added
to "Before calling a feature complete"). Added one completion-criteria
bullet to `development-lifecycle.md` → "Work complete requires all of."
Added one cross-reference to `SPEC-013` → "Scope and discovery
traceability" (checkpoint `discoveries` field should carry the
five-outcome resolution). Added one clarifying phrase to
`ARTIFACT-TYPES.md`'s "When to create a BACKLOG item".

**Discoveries during this milestone's own execution**: none of
independent, out-of-scope value were found. This governance/documentation
work touched only already-known files with an already-understood gap
(identified in full during `understand`/`analyze` above) — no code, no
real feature surface area for something unrelated to surface from.
Recorded honestly rather than manufacturing a `BACKLOG-<NNN>` to
demonstrate the mechanism — exactly the outcome `SPEC-010`'s "Meaningful
discovery threshold" and this milestone's own instructions call for when
nothing meaningful actually surfaces.

**Deviations from plan**: none.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: `pnpm run validate` (lint, typecheck, test,
build, `validate:architecture`, `secrets:scan`) — passed on the first
run. `pnpm run format:check` — **failed** on the first run
(`SPEC-010` and this trace file were not yet Prettier-formatted, same
routine pattern as `TRACE-002`'s own recorded failure).

**Remediation**: `pnpm exec prettier --write` on both files.

**Re-run**: `pnpm run format:check` — passed.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `.project/specs/SPEC-010` (amended),
`.agent/instructions/backlog-and-feature-development.md` (amended),
`.agent/instructions/development-lifecycle.md` (one bullet added),
`.project/specs/SPEC-013` (one cross-reference added),
`.project/ARTIFACT-TYPES.md` (one phrase added), `architecture.yaml`
(M20 roadmap entry, `current_phase → M21`),
`.project/state/PROJECT-STATE.md` (M20 recorded, "Traces" section
updated). No `BACKLOG` item created — reconciliation checkpoint above
confirms zero meaningful discoveries occurred.

## Checkpoint: review

**Status**: completed.

**Self-review** against this milestone's own completion checklist:
continuous discovery is defined and explicitly cross-cutting; the
needed-now/decision-required/future-work/already-tracked/rejected
distinction is explicit and named; existing human/RFC/SPEC escalation
mechanisms are reused, not replaced; the trace records a discovery
outcome (in this case, "none occurred" — an explicit, honest outcome,
not silence); reconciliation is folded into existing REVIEW/RECORD
behavior, not a new stage; no backlog engine, database, API, CLI, UI, or
second taxonomy was created; no artificial backlog item was created; the
bootstrap path (`AGENTS.md` → `backlog-and-feature-development.md`)
already reaches this behavior without further pointer changes.

## Checkpoint: git

**Status**: completed (no Git action taken).

No branch or commit was made — same pattern as `TRACE-001`/`TRACE-002`
and every milestone since M13 in this session
(`change-management.md` → "commit only when asked").

## Outcome

`completed`. Third trace, second one written progressively, and the
first to honestly demonstrate a **zero-discovery** outcome rather than
inventing one.
