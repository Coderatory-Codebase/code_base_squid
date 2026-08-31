---
id: TRACE-004
type: trace
title: M21 — autonomous agent execution & technology discovery
status: completed
created: 2026-08-31
related: [SPEC-010, SPEC-011, SPEC-012, SPEC-013, TRACE-001, TRACE-002, TRACE-003]
---

# TRACE-004: M21 — Autonomous Agent Execution & Technology Discovery

Written progressively, per `SPEC-013` → "Progressive recording" — created
at the first checkpoint, appended as work actually happens.

## Request

"M21 — Autonomous Agent Execution & Technology Discovery": before
building the first real application (MERN + Next.js, Authentication —
explicitly deferred, not built in this milestone), strengthen the
repository operating model so an agent can derive request classification,
planning necessity, technology/skill handling, human-escalation points,
feature decomposition, continuous discovery capture, tracing, validation,
and Git behavior from the repository itself, without the user spelling
each one out per request. Must connect to existing M06–M20 mechanisms,
not invent a parallel operating model; explicit non-goals against any
runtime/engine/service.

## Checkpoint: orient

**Status**: completed.

**Actions**: confirmed working tree clean (`git status`), confirmed
current `architecture.yaml` → `roadmap.current_phase: M21` (this
milestone was already the open slot). This trace file created now, first,
per the same progressive-recording discipline as `TRACE-002`/`TRACE-003`.

**Outcome**: proceed to classify/understand.

## Checkpoint: classify

**Status**: completed.

**Classification**: `governance` / operating-model — same category as
M12/M15/M16/M17/M18/M19/M20 (a documentation/instruction change to how
agents operate in this repository, not application source).

## Checkpoint: understand

**Status**: completed.

**Actions**: re-read, in full, this session: `agent-operating-contract.md`,
`SPEC-011` (bootstrap sequence, M16's own 6-scenario cold-start table,
"Definition of ready/complete"), `development-lifecycle.md` (stages,
proportionality, scope control, review dimensions), `traceability.md`,
`technology-guidance.md`, `backlog-and-feature-development.md`,
`validation.md`, `ARTIFACT-TYPES.md`, `packages.md`, `contracts.md`,
`engineering-standards.md`. `SPEC-010`/`SPEC-012`/`SPEC-013` content
already verified earlier this session (M15/M17/M18/M19/M20 work).

**Observations — already adequate, connect only, no new content**:
feature slicing by value (`SPEC-010` → "Feature slicing" already uses
the same "User registration" decomposition example this milestone's
kickoff repeats); missing-technology-skill handling
(`technology-guidance.md`'s 4-step flow + `SPEC-012` → "Skill creation
criteria"/"Human approval"); continuous discovery's 5-outcome model
(`SPEC-010`, M20); progressive checkpoint-structured tracing (`SPEC-013`,
M18/M19 — already matches this kickoff's own example checkpoint shape);
engineering-lens selection (`SPEC-008` — "relevant lenses, not all");
Git workflow (`git-governance.md`/`SPEC-009`); ecosystem-skill vs.
project-decision vs. feature-implementation layering (`SPEC-012` →
"Ecosystem vs. project").

**Real gaps found**:

1. No explicit request-classification step in the bootstrap sequence —
   it moves from orientation straight into UNDERSTAND without ever
   naming what _kind_ of request this is, so nothing ties "this is
   application work" vs. "this is governance work" vs. "this is
   exploration" to which instructions are load-bearing.
2. No explicit "is planning required" decision gate —
   `development-lifecycle.md` → "Proportionality" describes three
   representative chains qualitatively but never states trigger
   conditions as an explicit yes/no gate the way `SPEC-010` did for
   discovery outcomes at M20.
3. Human-in-the-loop escalation triggers are real but genuinely
   scattered (`SPEC-010`, `SPEC-012`, `SPEC-011`/`change-management.md`)
   with no single discoverable consolidated view.
4. No manual/UI-verification expectation exists in the repository's own
   agent-agnostic instructions (`validation.md`) — it currently only
   exists as a Claude-Code-specific system instruction, which is a real
   `ADR-006` (agent-agnostic core) gap for any other agent operating
   this repository.

**Constraints identified**: no new SPEC (this extends `SPEC-011`'s
already-active bootstrap-contract model, same as M16's own "adds no new
rule that didn't already exist somewhere" framing); no new ADR
(process/instruction content on already-decided architecture, same
category as M16/M19/M20); no runtime/engine/service of any kind
(kickoff's own explicit non-goals list).

**Outcome**: proceed to plan — amend `SPEC-011`,
`agent-operating-contract.md`, `development-lifecycle.md`,
`validation.md`; no new artifact type.

## Checkpoint: plan

**Status**: completed.

**Scope — needed now**: `SPEC-011` amendment (new "Request
classification" section, new "Human-in-the-loop" consolidated-pointer
section, one new cold-start scenario appended to the existing table);
`agent-operating-contract.md` amendment (one line inserted into "The
sequence", one pointer to the new human-in-the-loop section);
`development-lifecycle.md` amendment (new "When planning is required"
subsection under "Proportionality"); `validation.md` amendment (one new
bullet on manual/UI verification); this trace; `architecture.yaml` +
`PROJECT-STATE.md` updates.

**Scope — explicitly not needed**: new SPEC, new ADR, new lifecycle/loop,
new backlog mechanism, any runtime/orchestrator/engine, the
authentication application itself (explicitly deferred by the kickoff).

**Deferred**: the actual Authentication feature — resumes only once this
milestone is approved.

## Checkpoint: implement

**Status**: completed.

**Actions**: amended `SPEC-011` (M21 blockquote; new "Request
classification" section between "Bootstrap sequence" and "Layered
discovery"; new "Human-in-the-loop" consolidated-trigger table between
"Definition of complete" and "Cold-start verification"; new "M21
addendum — scenario G" under the existing cold-start section). Amended
`agent-operating-contract.md` (`CLASSIFY the request` step inserted into
"The sequence"; new "When a decision needs a human" section pointing at
`SPEC-011`'s table). Amended `development-lifecycle.md` (new "When
planning is required" subsection under "Proportionality"). Amended
`validation.md` (new bullet: UI/frontend changes verified by actually
running them, not only by the automated gate — closes the `ADR-006`
agent-agnostic-core gap noted in `understand`).

**Discoveries during this milestone's own execution**: none of
independent, out-of-scope value. One thing surfaced during the cold-start
run below (technology-profile ambiguity) is recorded there, not here —
it's a finding about the _scenario_, not a new piece of deferred work.

**Deviations from plan**: none.

## Checkpoint: cold-start

**Status**: completed.

**Actions**: ran `SPEC-011`'s new scenario G for real — simulated a fresh
agent receiving only "Build a new authentication feature using the
application's current technology stack" and walked the chain a fresh
agent would actually follow, using only the repository's own files (no
memory of this session's earlier auth-planning attempt):

```text
AGENTS.md (full read)
  -> repository-orientation.md -> PROJECT-STATE.md
       ("Technology profile": no implementation technology adopted yet)
  -> CLASSIFY (SPEC-011): application implementation + technology
       adoption, dominant = application implementation
  -> planning-required gate (development-lifecycle.md, M21): trips
       (technology adoption + security-sensitive + new architecture +
       multi-file) -> PLAN required, not optional
  -> UNDERSTAND: search .project/backlog (doesn't exist yet), specs,
       ADRs -> no existing coverage, this is genuinely new
  -> ANALYZE (backlog-and-feature-development.md, technology-guidance.md):
       identify technologies -> "current technology stack" doesn't
       resolve on repository state alone, since PROJECT-STATE.md's
       "Technology profile" is still empty -> a materially ambiguous
       reference, correctly surfaced for human clarification
       (SPEC-011 -> "Human-in-the-loop" -> "Material ambiguity" row),
       not guessed
  -> human-in-the-loop check (SPEC-011 table): technology choice
       touching architecture/security -> SPEC-012 escalation trigger
       -> confirm stack/scope specifics before implementing
  -> missing-skill check (technology-guidance.md): no Express/Mongoose/
       Next.js skill exists -> SPEC-008 principles apply, proceed
       without blocking; skill creation deferred, not decided now
  -> feature decomposition (SPEC-010 -> "Feature slicing"): Authentication
       sliced into registration / login / session / logout / route
       protection (core) vs. email verification / password reset /
       OAuth (discovered, future work)
  -> discovery decision model (SPEC-010, M20): each discovered slice
       resolved to future-work -> BACKLOG-<NNN>, not silently built or
       dropped
  -> PLAN (SPEC-010 -> "Feature planning" elements)
  -> IMPLEMENT (development-loop.md)
  -> VALIDATE (validation.md gate + M21's new manual/UI-verification
       bullet, since this introduces the repository's first real UI)
  -> REVIEW (development-lifecycle.md -> "Review dimensions" +
       SPEC-008 relevant lenses: architecture, security, data, testing)
  -> RECORD: ADR (real alternatives, first technology adoption -> ADR
       warranted per SPEC-011 -> "Definition of complete"), PLAN, TRACE
  -> Git governance (git-governance.md) throughout
```

**Observation**: every one of the 20 elements this milestone's kickoff
asked the cold-start run to verify was reached without the user naming
a process — confirming the `SPEC-011` addendum's claim. One genuine,
useful finding: the scenario's phrase "current technology stack"
doesn't resolve from repository state alone (the technology profile is
still empty) — the model correctly routes that to human clarification
rather than guessing, which is the _correct_ outcome, not a gap. No
further discoverability gap found.

**Outcome**: no new gap; proceed to validate/review/record.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: `pnpm run validate` (lint, typecheck, test,
build, `validate:architecture`, `secrets:scan`) — passed on the first
run. `pnpm run format:check` — **failed** on the first run (`SPEC-011`
and this trace were not yet Prettier-formatted, same routine pattern as
`TRACE-002`/`TRACE-003`'s own recorded failures).

**Remediation**: `pnpm exec prettier --write` on both files.

**Re-run**: `pnpm run format:check` — passed.

## Checkpoint: review

**Status**: completed.

**Self-review** against this milestone's own completion checklist
(kickoff section 19): request kind, applicable rules, applicable
lifecycle, planning-required decision, technology involvement, relevant
skills, missing-skill handling, relevant engineering lenses,
human-approval conditions, feature/slice/task division, needed-now vs.
discovered, backlog capture timing, trace creation, progressive
recording, validation, review, and Git completion are all now reachable
from `AGENTS.md` alone (confirmed by the `cold-start` checkpoint above).
No agent runtime, orchestrator, planner/workflow/skill engine, MCP,
telemetry system, trace database/dashboard, backlog API/UI, or manager
abstraction was created — matches the kickoff's own non-goals list.
Architecture/scope/quality/regression/maintainability dimensions
(`development-lifecycle.md` → "Review dimensions"): all four changed
files are pointer/index/gate additions referencing existing authoritative
content, none restate it — no duplication introduced.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `.project/specs/SPEC-011` (amended — "Request
classification," "Human-in-the-loop," scenario G + M21 addendum),
`.agent/instructions/agent-operating-contract.md` (amended),
`.agent/instructions/development-lifecycle.md` (amended),
`.agent/instructions/validation.md` (amended), `architecture.yaml` (M21
roadmap entry, `current_phase` → `M22`), `.project/state/PROJECT-STATE.md`
(M21 recorded). No `BACKLOG` item created — no genuine, independent,
out-of-scope discovery occurred; the one finding from `cold-start`
(technology-profile ambiguity) is a confirmation of correct behavior,
not deferred work. `.project/backlog/` remains uncreated.

## Checkpoint: git

**Status**: completed (no Git action taken).

No branch or commit was made — same pattern as every prior milestone in
this session (`change-management.md` → "commit only when asked").

## Outcome

`completed`. Fourth trace, third written progressively. First to include
a real, executed cold-start simulation as its own checkpoint rather than
only a narrative claim, and the first to explicitly confirm a
"correctly-routed-to-a-human" outcome as a _pass_, not a gap.
