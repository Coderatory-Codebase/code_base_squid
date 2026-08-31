---
id: TRACE-002
type: trace
title: M19 — operating-model execution traceability
status: completed
created: 2026-08-31
related: [SPEC-013, SPEC-011, TRACE-001]
---

# TRACE-002: M19 — Operating-Model Execution Traceability

Written progressively, during the work it describes — not reconstructed
afterward (`SPEC-013` amendment at M19 → "Progressive recording").
Checkpoints are appended as they actually complete; nothing below was
written before the step it documents happened.

## Request

"M19 — Operating-Model Execution Traceability": M18's `TRACE-001` showed
a real gap — a trace could say _which_ lifecycle stage something
happened in, but not _how_ that stage was actually executed
(what was inspected, what was decided and why, what failed and how it
was fixed). Extend the trace model with a checkpoint structure that
makes the existing lifecycle/loop/governance flows reconstructable,
without replacing any of them.

## Checkpoint: orient

**Status**: completed.

**Actions**: checked `git log`/`git status` (M18's changes are still
uncommitted — the user did not commit this session's work between M18
and M19, unlike some earlier milestones). This trace file itself was
created at this checkpoint, immediately, rather than after the work.

**Observations**: `.project/traces/` currently holds one file
(`TRACE-001`), M18's own worked example. `SPEC-013`/`traceability.md`
define the trace model but don't yet define a checkpoint schema for
_how_ a lifecycle stage was executed — confirmed by re-reading `TRACE-001`
during M18's own closing turn (referenced here, not re-read again).

**Outcome**: proceed to classify and understand the request.

## Checkpoint: classify

**Status**: completed.

**Classification**: `governance` — same category as M12/M15/M17/M18: a
durable operating-model extension, not a feature/bug/refactor.

## Checkpoint: understand

**Status**: completed.

**Actions**: re-read `SPEC-013` and `traceability.md` in full (already in
working context from M18, re-verified rather than assumed sufficient,
per M19's own instruction to inspect before assuming a gap or its
absence).

**Observations**: `SPEC-013` → "Stages, and what each records" names
_what kind_ of thing each stage covers (orientation, operating model,
classification, existing coverage, analysis) but has no consistent
per-checkpoint field structure (no place to hang "what was decided and
why," "what failed and how it was fixed," "who approved what") and no
explicit rule that a trace is written _while_ work happens rather than
summarized after. `TRACE-001` is concrete evidence of the gap: it was
substantively assembled near the end of M18 (see its own "Implementation"
section, which as-written referenced "the corresponding commit diff...
once validation is complete below" before being corrected) — a
retrospective summary, not a progressive record, even though nothing in
it is false.

**Constraints identified**: must not invent a second trace artifact type
or a competing lifecycle (M19 kickoff, hard boundary); must not turn
checkpoints into a mandatory field list for trivial work (`SPEC-013`'s
existing proportionality principle still applies); must actually
demonstrate the fix by writing `TRACE-002` progressively, not
retrospectively.

**Outcome**: the fix is an _addition_ to `SPEC-013` (a checkpoint field
structure + a progressive-recording rule) and a corresponding update to
`traceability.md` — not a new SPEC, not a new artifact type, not a new
lifecycle.

## Checkpoint: analyze

**Status**: completed.

**Lenses used**: architecture (does this need a new graph node/edge? —
no), maintainability (does a structured schema risk becoming ceremony
for small work? — mitigated by keeping every field optional, same as
M18), reflexivity (must produce a real, progressively-written
`TRACE-002` — the milestone's own hard requirement).

**Decision**: extend `SPEC-013` with a "Checkpoint structure" section
(the field list M19's kickoff specified: stage, status, purpose, actions,
observations, artifacts consulted, constraints, discoveries, decisions +
sources, human input, scope impact, validation, failures, remediation,
outcome, references — all optional per checkpoint) and a "Progressive
recording" rule. Source: agent decision, directly implementing the
milestone's own explicit instructions (no alternative was genuinely
in tension with them). Status: applied.

## Checkpoint: plan

**Status**: completed.

**Scope — needed now**: `SPEC-013` checkpoint-structure + progressive-
recording addition; `traceability.md` updated to reflect it; `TRACE-002`
itself as the real, progressively-written demonstration; discoverability
pointers only where a real gap exists.

**Scope — explicitly not needed**: a second trace artifact type, a new
lifecycle/loop, a trace runtime/collector, retroactive traces for
M01–M18, a technology skill or backlog item manufactured to demonstrate
the schema.

**Deferred**: nothing new — same non-goals `SPEC-013` already states,
reaffirmed.

## Checkpoint: implement

**Status**: completed.

**Actions**: added "Checkpoint structure" and "Progressive recording"
sections to `SPEC-013` (between "Stages, and what each records" and
"Decision provenance"); added an "M19 amendment" blockquote near
`SPEC-013`'s top; updated its "Worked example" section to reference this
trace; bumped its `updated:` frontmatter field. Added a "Write it as you
go, not at the end" section to `traceability.md`. Added one clarifying
sentence to `ARTIFACT-TYPES.md`'s "When to create a TRACE" section.

**Discoveries**: none of independent, out-of-scope value.

**Deviations from plan**: none — matched the plan checkpoint above
exactly.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: `pnpm run validate` (lint, typecheck, test,
build, `validate:architecture`, `secrets:scan`) — passed on the first
run. `pnpm run format:check` — **failed** on the first run
(`SPEC-013` and this trace file itself were not yet Prettier-formatted).

**Failure**: `prettier --check` flagged
`SPEC-013-agent-execution-traceability.md` and
`TRACE-002-...-traceability.md` — routine, expected (every prior
milestone in this session hit the same thing after hand-writing
markdown).

**Remediation**: `pnpm exec prettier --write` on both files.

**Re-run**: `pnpm run format:check` — passed. Recorded here rather than
collapsed into a bare "passed," per `SPEC-013` → "Validation
traceability" and this milestone's own emphasis on not hiding a
failure/recovery cycle even a small one.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `.project/specs/SPEC-013` (checkpoint structure,
progressive-recording rule, amendment blockquote, worked-example
update), `.agent/instructions/traceability.md`,
`.project/ARTIFACT-TYPES.md` (TRACE entry clarified),
`architecture.yaml` (M19 roadmap entry, `current_phase → M20`),
`.project/state/PROJECT-STATE.md` (M19 recorded, "Traces" section
updated, authoritative decisions updated). No `BACKLOG` item created —
no discovery of independent value occurred. No new discoverability
pointers were needed beyond what M18 already added (`AGENTS.md` already
points to `traceability.md`).

## Checkpoint: review

**Status**: completed.

**Self-review** against `SPEC-013`'s completion criteria and this
milestone's own manual-verification checklist: `TRACE` remains the only
trace artifact type (no `EXECUTION-TRACE`/`AGENT-LOG` invented); no new
lifecycle/loop/graph relationship type was created; the checkpoint
structure keeps every field optional (checked against the `orient`/
`classify` checkpoints above, which are intentionally short); the
`format:check` failure/fix above is preserved rather than hidden; no
private reasoning is recorded anywhere in this file — only actions,
observations, decisions with sources, and outcomes that were actually
reached.

## Checkpoint: git

**Status**: completed (no Git action taken).

No branch was created and no commit was made — the same pattern as
`TRACE-001` and every milestone since M13 in this session: the user
reviews and commits each milestone's changes directly on `main`
(`change-management.md` → "commit only when asked"). No PR, no CI run
for this change; both will run against whatever commit the user creates
from this working tree.

## Outcome

`completed`. Second trace, first one written progressively — the
behavioral change this milestone actually needed to prove, not just
specify.
