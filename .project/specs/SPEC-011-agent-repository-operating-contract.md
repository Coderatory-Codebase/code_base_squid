---
id: SPEC-011
type: spec
title: Agent repository operating contract
status: active
created: 2026-08-31
updated: 2026-09-01
related: [SPEC-004, SPEC-006, SPEC-007, SPEC-008, SPEC-009, SPEC-010, SPEC-012, SPEC-013]
---

# SPEC-011: Agent Repository Operating Contract

> **M21 amendment**: M16 tied M01–M15's pieces into one bootstrap
> sequence but never named _what kind_ of request is being handled, and
> the repository's human-escalation triggers — already real, already
> correct — were discoverable only by reading four separate specs in
> full. M21 adds "Request classification" and "Human-in-the-loop" below,
> and one new cold-start scenario to the existing table. No new rule:
> both sections point at decisions M08/M10/M12/M15/M17/M20 already made,
> named and consolidated for discoverability, not reinvented.
>
> **M23 amendment**: M22's first real feature exposed that "Request
> classification" named _what kind of work_ a request is but not _which
> project it belongs to_ or _whether the request touches the foundation
> itself_ — a real gap once `ADR-013` made `apps/`/`servers/`/`agents/`
> project-owned. Adds a project/foundation-boundary check to "Request
> classification" and a new "Foundation vs. project classification"
> section for traces. Both route to `ADR-013`/`SPEC-012` decisions
> already made, not a new authority.
>
> **M24 amendment**: one new subsection, "What authorizes a
> `FOUNDATION`/`BOTH` change" — every foundation change this repository
> has ever made was authorized by explicit human commissioning, verified
> clean via `git status` every time, but the rule itself was never
> written down, only demonstrated. States the rule the evidence already
> showed; changes no actual behavior.

Operational entry point: `.agent/instructions/agent-operating-contract.md`.
This spec is the comprehensive, durable definition; that file is the
shorter agent-facing pointer into it.

## Purpose

M01–M15 built a coherent operating model — architecture, lifecycle, loop,
capability model, engineering standards, Git governance, backlog/feature
model — but each piece was documented **in its own file**, discoverable
only by reading forward from `AGENTS.md`. Nothing tied them into one
**bootstrap sequence** a fresh agent could follow end-to-end, and a
cold-start audit (done for this milestone — see "Cold-start verification"
below) found two real, if small, discoverability gaps. This spec is the
connective layer: it names the sequence, maps it onto the pieces that
already exist, and records the gaps found and fixed. It adds no new rule
that didn't already exist somewhere in M01–M15.

## Core principle

> **The repository is self-describing to an agent that reads it.**

A developer should be able to say "Build authentication" or "Explore how
we should implement payments" without separately explaining the
lifecycle, the loop, engineering standards, technology-skill loading,
backlog discovery, ambiguity handling, or Git governance — the agent
discovers all of that from the repository itself. The human provides
intent; the repository provides operating context.

This is a **documentation/behavioral model**. It is not an agent runtime,
orchestrator, planner, workflow engine, or discovery script — see
"Non-goals."

## Bootstrap sequence

```text
ENTER REPOSITORY
       ↓
CLAUDE.md / AGENTS.md (or an equivalent agent-agnostic entry point)
       ↓
repository-orientation.md — verify the actual filesystem against
  README.md / architecture.yaml / PROJECT-STATE.md (don't trust
  documentation before checking the tree)
       ↓
UNDERSTAND the request (development-lifecycle.md)
       ↓
identify existing coverage — does a SPEC/ADR/backlog item already
  address this? (backlog-and-feature-development.md -> "check whether
  it already exists")
       ↓
ANALYZE through relevant lenses; identify technologies involved
  (SPEC-010 -> "Analysis lenses"; SPEC-008 -> "Technology skill model")
       ↓
ambiguity material? -> yes -> human / RFC / SPEC (SPEC-010 ->
  "Ambiguity handling", "RFC/SPEC escalation")
       ↓
DEFINE SCOPE — needed now vs. discovered (SPEC-010 -> central principle)
       ↓
PLAN proportionally (development-lifecycle.md -> "Proportionality")
       ↓
IMPLEMENT — development-loop.md's reasoning inside this stage
       ↓
VALIDATE (validation.md, tooling/)
       ↓
REVIEW (development-lifecycle.md -> "Review dimensions")
       ↓
RECORD durable knowledge (development-lifecycle.md -> "Recording")
       ↓
UPDATE BACKLOG — discovered/deferred work (SPEC-010 -> "Backlog updates
  after a feature")
       ↓
Git governance throughout (branch, commits, validation, PR — SPEC-009)
```

Every step already exists in M01–M15. This diagram is the map, not new
territory — each line names the file that's actually authoritative for
it.

## Request classification (added M21)

Between orientation and UNDERSTAND, name what kind of request this is —
not as a new artifact or gate, but because the category determines which
instructions are load-bearing. A request can span more than one; identify
the dominant execution path rather than forcing a single label:

```text
exploration / research        -> discover, inspect, report; no
                                  implementation (see "Exploration and
                                  analysis requests" below)
operational / governance       -> this repository's own operating model
                                  (.agent/, .project/, architecture.yaml)
                                  — the category M06-M20 themselves are in
foundation work                -> architecture.yaml boundaries,
                                  cross-cutting repository structure
architecture work              -> ADR/SPEC-weight decisions
                                  (development-lifecycle.md ->
                                  "Proportionality" -> architectural
                                  change row)
application implementation     -> backlog-and-feature-development.md,
                                  engineering-standards.md, the
                                  apps/servers/agents/packages boundaries
bugfix                         -> development-lifecycle.md's tiny-bugfix
                                  proportionality row
refactor                       -> engineering-standards.md (reuse,
                                  decoupling, no unjustified abstraction)
technology adoption            -> technology-guidance.md, SPEC-012
mixed                          -> identify the dominant category; apply
                                  its instructions as primary, the
                                  others as secondary constraints
```

This is naming, not new process — every branch above already resolves to
an existing instruction file. E.g. "Add authentication" classifies as
application implementation + technology adoption (dominant: application
implementation, since the feature drives the technology choice, not the
reverse) — both `backlog-and-feature-development.md` and
`technology-guidance.md` apply, in that order of primacy.

### Project/foundation boundary check (added M23)

For application implementation specifically, one more question the
classification above answers: **which project does this belong to, and
does any part of it touch the foundation itself?**

```text
Which project owns this work?
  known/obvious           -> apps/<project>/, servers/<project>/,
                              agents/<project>/ (ADR-013)
  not obvious              -> material ambiguity, ask (SPEC-011 ->
                              "Human-in-the-loop") — never guess a
                              project name

Does the work also require changing .agent/, .project/, architecture.yaml,
AGENTS.md, or CLAUDE.md?
  no  -> pure PROJECT work
  yes -> BOTH — see "Foundation vs. project classification" below;
         project work and foundation changes stay clearly separated,
         the project never silently redefines the foundation
         (SPEC-012 -> "Ecosystem vs. project", generalized)
```

## Foundation vs. project classification (added M23)

Every meaningful piece of work is one of:

```text
FOUNDATION   — changes .agent/, .project/, architecture.yaml, AGENTS.md,
               CLAUDE.md, or any instruction/spec/skill governing how
               agents operate. Reusable across projects by definition.
PROJECT      — changes inside a project's own apps/<project>/,
               servers/<project>/, agents/<project>/ (or a genuinely
               project-owned package). Not reusable elsewhere by default.
BOTH         — a project need surfaced a real foundation gap (M21, M23
               are both examples of this at the repository's own
               governance level; M22 discovering the missing project-
               ownership boundary is the application-level example).
```

This classification is recorded in a TRACE when one exists
(`SPEC-013` → "Checkpoint structure" → `classification`), not a new
artifact of its own. When work is `BOTH`, the two parts stay explicitly
separated in the record — a project implementation is never allowed to
silently redefine foundation behavior; a genuine foundation change still
follows its own governance (an ADR when it's a real architectural
decision, human approval when `SPEC-012`/`SPEC-010` require it) exactly
as if it had been requested on its own.

### What authorizes a `FOUNDATION`/`BOTH` change (added M24)

Named explicitly because it had only ever been demonstrated by
precedent, never stated: a `FOUNDATION` or `BOTH`-classified change is
made only when one of these is true —

```text
explicitly commissioned — the human's own request is, in substance, a
  request to change how agents operate here (a numbered governance
  milestone is the clearest example, but any explicit "change the
  operating model" request qualifies, not only a numbered one)
  ↓ or
already-governed approval path — a durable technology/implementation-
  area skill proposal approved per SPEC-012 -> "Human approval"
```

**Project work never triggers a foundation change as a side effect.**
Discovering that a foundation gap exists while doing project work is
itself a discovery — route it through `SPEC-010`'s discovery decision
model (usually: surface it, let the human decide whether/when to
commission the foundation change) rather than silently fixing
`.agent/`/`.project/specs/` mid-feature. Every foundation change across
this repository's history was made this way — this section states the
rule the evidence already showed.

## Layered discovery

Load only the layer the task needs — this restates
`AGENTS.md` → "Progressive disclosure" as an explicit layer list, not a
second, competing model:

```text
1. Entry point         CLAUDE.md / AGENTS.md
2. Operating model      .agent/README.md, .project/README.md,
                          PROJECT-STATE.md
3. Applicable rules      .agent/instructions/*  (read the directory
                          listing — filenames are self-descriptive;
                          don't read every file for every task)
4. Applicable workflow   .agent/workflows/*
5. Applicable skills     .agent/skills/*  (including any technology
                          skill relevant to the task — SPEC-008)
6. Project knowledge     relevant SPEC / ADR / PLAN / BACKLOG item
7. Implementation        source code, tests, tooling
```

Don't indiscriminately load every instruction/workflow/skill/SPEC/ADR —
the same proportionality principle `development-lifecycle.md` already
applies to artifacts applies here to _reading_.

## Instruction precedence

**Already defined — not reinvented here.** `SPEC-008` →
"Guidance precedence" already establishes: hard safety/security
constraints → explicit project architecture (`architecture.yaml`) →
explicit project decisions/specs (ADRs/SPECs) → project-specific
engineering standards → technology-specific guidance → library/framework
docs → current authoritative external docs → general engineering
principles → agent judgment. That hierarchy governs this repository in
full; M16 adds nothing to it beyond restating the one rule most relevant
to bootstrapping:

> An agent's preference must never silently override an explicit
> repository constraint or a recorded architectural decision.

When two authoritative sources genuinely conflict: identify the conflict,
determine whether one supersedes the other (`ARTIFACT-TYPES.md` →
lifecycle states), and if that's unclear, surface it for human
clarification (`SPEC-010` → "Ambiguity handling") — never guess, never
silently pick one, never rewrite either source to make the conflict
disappear.

## Historical decisions are not silently rewritten

An agent encountering an existing ADR/SPEC distinguishes current,
historical, superseded, and deferred — the states `ARTIFACT-TYPES.md`
already defines. A genuine architectural disagreement follows the
existing artifact lifecycle (a new/updated ADR or SPEC, `related:` back
to what it changes) — it never edits a `superseded`/historical artifact's
body to make the current implementation look cleaner (`ADR-007`/`ADR-008`
are the concrete precedent: `ADR-007` was kept intact and marked
superseded, not rewritten, when `ADR-008` corrected it).

## Discovering a better approach mid-implementation

Distinguish a **local implementation correction** (fix it now, it's
within the current feature's scope) from an **architectural change**
(surface it; determine whether an RFC/ADR/SPEC is warranted per
`SPEC-010` → "RFC escalation"/"SPEC escalation"; get human direction when
material per `SPEC-010` → "Human feedback points"). Never silently
rewrite architecture while implementing an unrelated feature — that's the
same scope-control rule `development-lifecycle.md` and `SPEC-010` already
state, applied to the specific case of "I think the existing approach is
wrong."

## Behavior when an instruction is missing

Absence of a documented rule is not permission to invent a repository-wide
one. In order: check existing conventions → check relevant SPECs/ADRs →
check applicable technology-skill guidance → apply engineering judgment
(`SPEC-008`) → record a durable decision only if the situation actually
warrants one → ask the human when the decision is material
(`SPEC-010` → "Human feedback points"). A gap is not, by itself, justification
for a new framework/abstraction.

## Exploration and analysis requests

A request to explore, investigate, or "figure out" something is not an
implicit authorization to implement what's found:

```text
"Explore how we should implement payments."
    ↓
discover -> inspect -> understand -> identify constraints -> report findings
```

Code changes require a request that actually authorizes implementation.
This is `SPEC-010`'s scope-control principle applied at the very first
step — before a feature is even defined, not only once it is.

## Definition of ready (assembled, not new)

Before implementation begins, the agent should be able to answer — using
`development-lifecycle.md`'s UNDERSTAND/PLAN stages and `SPEC-010`'s
feature-planning elements, not a new artifact:

```text
What are we building, and why?
What is the smallest coherent feature (SPEC-010 -> "Feature slicing")?
What is explicitly in scope vs. out of scope (SPEC-010 -> "'Needed now'
  vs. discovered")?
What constraints/architecture apply (architecture.yaml, relevant ADRs)?
What technology guidance applies, if any (SPEC-008)?
What uncertainty remains, and does it require human clarification
  (SPEC-010 -> "Ambiguity handling")?
What should be recorded as backlog work rather than built now?
```

No new artifact is required to answer these for a small feature — they're
part of the working process, same as `development-lifecycle.md` already
allows.

## Definition of complete (assembled, not new)

`development-lifecycle.md` → "Implementation complete vs. work complete"
is already the authoritative definition. As a practical checklist:

```text
[ ] requested behavior is implemented
[ ] existing architecture boundaries remain intact (boundaries.md)
[ ] relevant engineering standards were applied (SPEC-008)
[ ] relevant technology guidance was considered, where applicable
[ ] unnecessary abstractions were not introduced
[ ] appropriate tests exist where warranted — not manufactured for a checklist
[ ] pnpm run validate + format:check pass (validation.md)
[ ] security implications were considered where relevant
[ ] discovered future work was captured when meaningful, not silently dropped
[ ] no unrelated scope was silently implemented (SPEC-010 -> scope control)
[ ] durable project documentation was updated only if durable knowledge changed
[ ] Git governance was followed (git-governance.md)
```

Do not require a documentation update when nothing durable changed, and
do not manufacture a test or artifact merely to check a box.

## Human-in-the-loop (added M21)

Every trigger below already exists and is already authoritative in its
own spec — this table is a discoverability index, not a new rule. When
none of these apply, routine implementation decisions stay autonomous.

| Trigger                                                                                                                     | Governed by                                                                            |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Material ambiguity in requirements/scope/architecture/security                                                              | `SPEC-010` → "Ambiguity handling"                                                      |
| A question or decision that warrants an RFC or SPEC                                                                         | `SPEC-010` → "RFC escalation" / "SPEC escalation"                                      |
| Creating or materially changing a technology skill                                                                          | `SPEC-012` → "Human approval"                                                          |
| A technology choice touching architecture, security, privacy, data ownership, infrastructure, deployment, cost, or a vendor | `SPEC-012` → "Escalation triggers"                                                     |
| A genuine architectural disagreement with an existing ADR/SPEC                                                              | this spec → "Discovering a better approach mid-implementation", `change-management.md` |
| Two authoritative sources genuinely conflict                                                                                | this spec → "Instruction precedence"                                                   |
| A blocked piece of work needing a decision to unblock it                                                                    | `SPEC-010` → "Blocked work"                                                            |

The agent's job at each trigger is the same shape every time: state what
decision is needed, why it matters, the real options, their trade-offs,
and a recommendation — then wait. It must not manufacture approval by
proceeding anyway and recording the outcome as if it had been granted
(`traceability.md` → "Human decisions").

## Cold-start verification

This milestone traced a fresh agent's path against `CLAUDE.md`/`AGENTS.md`
as they stood, and against these scenarios:

| Scenario                                                                         | Expected                                                                                                                             | Result                                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| A — "Add user authentication"                                                    | Feature-driven flow, engineering standards, tech skills, architecture, plan, implement, validate, backlog discovery, Git governance. | All reachable from `AGENTS.md`'s existing pointers; no gap.                                                                           |
| B — "Explore how we should implement payments"                                   | Explore/analyze/report, no implementation.                                                                                           | Now explicit (see "Exploration and analysis requests" above) — previously implicit via `SPEC-010` only.                               |
| C — Discovery mid-implementation ("notifications should support SMS eventually") | Not current scope; captured; current feature continues.                                                                              | Fully covered by `SPEC-010` → "Discovery capture"/"Scope control"; no gap.                                                            |
| D — Existing ADR conflicts with agent's preferred approach                       | Respect it; don't silently override.                                                                                                 | Fully covered by `change-management.md` + this spec's "Historical decisions are not silently rewritten"; no gap.                      |
| E — New technology, no skill yet                                                 | Identify the gap, apply engineering principles, decide whether a skill is warranted, don't invent a framework.                       | Fully covered by `SPEC-008` → "Technology skill model"; this spec's "Behavior when an instruction is missing" generalizes it; no gap. |
| F — Git completion after implementation                                          | Validate, branch convention, commit convention, PR per policy, tooling remains the enforcement mechanism.                            | Fully covered by `SPEC-009`/`git-governance.md`; no gap.                                                                              |

**Two real gaps found and fixed** (not five, not invented for
completeness):

1. `CLAUDE.md` restated a stale, drifting copy of `AGENTS.md`'s
   "before modifying anything" checklist — including a leftover
   conditional ("once quality gates exist (M02)") from before M02 itself
   shipped, which M11's cleanup pass missed because it only checked
   `AGENTS.md`'s copy, not `CLAUDE.md`'s. Fixed by trimming `CLAUDE.md`
   to a genuine adapter (a short read-order pointer), removing the
   duplicate checklist entirely — the exact failure mode "Instructions,
   workflows, skills..." and this spec's own drafting both warn against
   (duplicated instructions eventually diverge).
2. `.agent/instructions/repository-orientation.md` — despite being
   named and scoped (`applies_to: all-tasks`) for exactly this
   bootstrapping purpose — was not linked from `CLAUDE.md`, `AGENTS.md`,
   or `.agent/README.md`. Reachable only via directory listing. Fixed by
   adding one pointer from `AGENTS.md`.

Everything else already connected correctly; this spec did not invent
work to justify a longer report.

### M21 addendum — scenario G

M21 re-ran this audit against one new, sharper scenario, after adding
"Request classification" and "Human-in-the-loop" above:

| Scenario                                                                                   | Expected                                                                                                                                                                                                                                                                                                                                                                                                                     | Result                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G — "Build a new authentication feature using the application's current technology stack." | From `AGENTS.md` alone: classify (application implementation + technology adoption), check for existing coverage, plan-required gate trips (technology adoption + security-sensitive + multi-file), technology/skill check, feature-sliced plan, implement, validate (incl. the manual/UI check below), review, discovery/backlog reconciliation, trace, Git governance — with no step requiring the user to name a process. | Reachable end-to-end through `SPEC-011`'s own bootstrap sequence plus this milestone's three additions (classification, planning gate, human-in-the-loop index) and `validation.md`'s new UI bullet — confirmed by actually running this exact request as M21's own next step (see `TRACE-004` → "cold-start" checkpoint). No further gap found. |

**Two more real gaps found and fixed at M21** (in addition to scenario
G's confirmation above): no explicit request-classification step (fixed
— "Request classification" above), and no explicit "is planning
required" gate (fixed — `development-lifecycle.md` →
"When planning is required"). A third, smaller gap: `validation.md` had
no agent-agnostic statement of the manual/UI-verification expectation
that previously existed only as a Claude-Code-specific instruction,
which is a real `ADR-006` gap for any other agent operating this
repository — fixed with one new bullet there.

## Enforcement vs. behavior

Unchanged from `SPEC-009` → "Enforcement model": instructions describe
agent _behavior_; Git hooks give local, bypassable feedback; CI is the
authoritative automated gate; repository settings enforce integration
rules where configured; human review provides final judgment. This spec
does not claim an instruction makes anything technically impossible —
only that the repository is self-describing for an agent that reads and
follows it.

## Multiple technologies

`SPEC-008` → "Technology skill model" already covers this: identify every
technology actually involved, load only the matching skill(s), apply
repository architecture above technology convention. Not every
technology needs identical architectural treatment; the repository's
general principles outrank any single technology's "best practice"
(`SPEC-008` → "Guidance precedence"). No change needed here.

## Future application structure

`architecture.yaml` → `boundaries` already governs `apps/`, `servers/`,
`agents/`, `packages/`, `infra/`, `docs/`, `tooling/`, `.agent/`,
`.project/`. This spec adds nothing to that model and creates no
application directory to demonstrate it — the first real feature does
that, not this milestone.

## Non-goals

No agent runtime, orchestrator, planner engine, workflow engine,
instruction engine, skill engine, discovery engine, or configuration
registry (`agent-runtime/`, `agent-core/`, `agent-manager/`,
`agent-orchestrator/`, `agent-planner/`, `agent-bootstrap/` as a
directory, `agent-registry/`, `workflow-engine/`, `instruction-engine/`,
`skill-engine/` — none of these are created). No duplicated operating
manual — every section above points to an existing authoritative file
rather than restating its content. No new lifecycle, development loop,
engineering-standards content, Git-governance content, or backlog
mechanism — M06/M08/M09/M12/M13/M14/M15 remain authoritative, unchanged.
No application created merely to demonstrate the bootstrap sequence. No
MCP, orchestration, or runtime of any kind.

## Status

`active` — governs how a fresh agent bootstraps into this repository's
operating model, from M16 onward.
