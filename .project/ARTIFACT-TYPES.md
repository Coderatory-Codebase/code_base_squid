# Artifact Types & Conventions

This is the single source of truth for the `.project/` artifact system.
Other documents (`README.md`, `AGENTS.md`, `.agent/README.md`) point here
rather than restating it.

## What `.project/` is, vs `.agent/`

`.agent/` describes **how agents operate** in this repository.
`.project/` records **what the project knows, has decided, is planning,
and has recorded** — durable engineering memory, not runtime behavior.

## Metadata convention

Frontmatter on every versioned artifact (not on `state/`, see below):

```yaml
---
id: SPEC-001
type: spec
title: Short human-readable title
status: draft
created: 2026-08-30
updated: 2026-08-30
related: [ADR-001, PLAN-001]
---
```

- **Required**: `id`, `type`, `title`, `status`, `created`.
- **Optional, add only when it has a concrete value**: `updated` (only once
  the artifact actually changes post-creation), `related` (only when a
  real reference exists).
- **`owner`** is deliberately not part of the schema yet — this repository
  doesn't currently have multiple contributors/agents whose attribution
  would carry any decision-making weight. Add it when that becomes true,
  not preemptively.

`id` format: `<TYPE>-<NNN>`, zero-padded three digits, monotonically
increasing per type (`SPEC-001`, `SPEC-002`, ...). IDs are never reused or
renumbered.

## Artifact types

| Type           | Prefix         | Purpose                                                                                                                                                                                                                                                                                                                                                              | Instantiated now?      |
| -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Spec           | `SPEC-`        | What should exist / what behavior is required. Also used by Phase 3 Specification outputs; no second requirement/specification artifact prefix exists.                                                                                                                                                                                                               | Yes — `specs/`         |
| Plan           | `PLAN-`        | How we intend to accomplish a spec.                                                                                                                                                                                                                                                                                                                                  | Yes — `plans/`         |
| Task           | `TASK-`        | A bounded, executable unit of work.                                                                                                                                                                                                                                                                                                                                  | Not yet — see below    |
| ADR            | `ADR-`         | An architectural decision: context, decision, consequences.                                                                                                                                                                                                                                                                                                          | Yes — `decisions/`     |
| RFC            | `RFC-`         | A proposal under discussion, upstream of an ADR.                                                                                                                                                                                                                                                                                                                     | Not yet                |
| Requirement    | `REQ-`         | Raw business/product input captured by the Intake phase before Discovery. Added M26, `SPEC-015`. One markdown file per real Intake artifact under `requirements/`; authored by the agent using existing artifact, state, and trace conventions.                                                                                                                      | Yes — `requirements/`  |
| Discovery      | `DISC-`        | Evidence-backed understanding produced from a completed Intake artifact before Specification. Added M26, `SPEC-016`. One markdown file per real Discovery artifact under `discovery/`; authored by the agent using existing artifact, state, trace, source, and project-memory conventions.                                                                          | Yes — `discovery/`     |
| Decomposition  | `DECOMP-`      | Product/system scope breakdown produced from a ready Specification before Architecture. Added M26, `SPEC-019`. One markdown file per real Decomposition artifact under `decomposition/`; not a backlog, task list, job-contract system, architecture model, or implementation plan.                                                                                  | Yes — `decomposition/` |
| Architecture   | `ARCH-`        | Architecture phase output produced from Discovery, Specification, Decomposition, and backlog Features before Feature-scoped System Design. Added M26, `SPEC-020`. One markdown file per real Architecture artifact under `architecture/`; not an ADR replacement, implementation plan, diagram registry, engine, or task list.                                       | Yes — `architecture/`  |
| System design  | `SD-`          | Feature-scoped System Design output produced from one selected eligible backlog Feature and a ready high-level Architecture before Engineering Decomposition. Added M26, `SPEC-021`. One markdown file per real System Design artifact under `system-design/`; not a product-wide design, feature registry, implementation plan, task list, engine, or job contract. | Yes — `system-design/` |
| Engineering    | `ENG-`         | Feature-scoped Engineering Decomposition output produced from one approved `SD-*` artifact before Implementation. Added M26, `SPEC-022`. One markdown file per real Engineering Decomposition artifact under `engineering/`; not a product-wide decomposition, `TASK-*`, job contract, implementation plan, engine, or source-code change.                           | Yes — `engineering/`   |
| Research       | `RESEARCH-`    | Findings from an investigation, informing a spec/ADR.                                                                                                                                                                                                                                                                                                                | Not yet                |
| Review         | `REVIEW-`      | An evaluation of a completed change against its plan/spec.                                                                                                                                                                                                                                                                                                           | Yes — `reviews/`       |
| Report         | `REPORT-`      | A point-in-time status summary for an audience beyond the agent.                                                                                                                                                                                                                                                                                                     | Yes — `reports/`       |
| Handoff        | `HANDOFF-`     | Session-to-session continuity notes.                                                                                                                                                                                                                                                                                                                                 | Not yet                |
| Backlog item   | `BACKLOG-`     | Work that is known, proposed, discovered, deferred, awaiting clarification, or produced as feature-driven product units by Decomposition — not necessarily current implementation scope. Added M15, `SPEC-010`. One table file (`backlog/BACKLOG.md`), not one file per item; rows include `Scope`, `Owner`, `Level`, `Parent`, `Kind`, and `Status`.                | Yes — `backlog/`       |
| Project memory | `PROJECT-<id>` | The scoped project/product operating brain for one project inside the monorepo. Added M26, `ADR-016`. One file per real project under `projects/<project>/PROJECT.md`; not a generated placeholder.                                                                                                                                                                  | Yes — `projects/`      |
| Trace          | `TRACE-`       | The record connecting the execution journey of one coherent unit of meaningful agent work — request, applicable guidance, decisions, scope, implementation, validation, review, Git outcome. Added M18, `SPEC-013`. Never a replacement for TASK/PLAN/RFC/SPEC/ADR/REVIEW/BACKLOG — it references them.                                                              | Yes — `traces/`        |

A type not yet instantiated still has its convention defined here so the
first real instance follows it, rather than inventing a shape ad hoc.

### When to create a TASK

A TASK is a single bounded, executable unit — small enough to implement
and validate in one pass — pulled from a PLAN step once that step is
large enough to need tracking below the plan-step level, or when a piece
of work spans multiple sessions and needs a persistent record of what's
left. Minimum content: what the bounded unit is, which PLAN/SPEC it
belongs to (`related:`), and its own `todo → in-progress → done →
cancelled` status. Completion = the unit's own validation passes AND its
parent PLAN step no longer needs it tracked separately.

Most work does not need one: a milestone executed start-to-finish in one
continuous pass (as M01–M06 have been) has no benefit from a TASK
tracking what a `PLAN` step or this session's own transcript already
covers. Create one when work is genuinely interrupted, resumed later, or
split across contributors/sessions — not by default for every change.

### When a HANDOFF is appropriate

A HANDOFF is written when: work is intentionally left incomplete, a
different agent/person must continue it, important context for
continuing wouldn't be inferable from the repository alone, or there's a
known blocker that isn't self-evident from the code/artifacts. It states
what's done, what's left, why it stopped there, and what the next
session needs to know that isn't already durable elsewhere.

It is never mandatory — a change that reaches COMPLETE (see
`.agent/instructions/development-lifecycle.md`) in the same session
produces no HANDOFF. Writing one for every finished task would be
ephemeral status noise treated as durable memory, which
`ARTIFACT-TYPES.md` → "Durable vs. ephemeral memory" already rules out.

### When to create a BACKLOG item

Full model: `.project/specs/SPEC-010-agent-backlog-and-feature-driven-development.md`.
A BACKLOG item is created when any stage of the work — not only analysis
or implementation (`SPEC-010` → "Discovery capture", cross-cutting since
M20) — surfaces work that is real and worth remembering but is **not**
part of the current feature's scope: a discovered requirement, a
deliberately deferred piece of scope, a follow-up technical improvement, a
risk, or a known dependency on work that doesn't exist yet. Decomposition
may also create or refine BACKLOG rows for the resulting product
hierarchy, using `Level` and `Parent` to represent ancestry and `Status`
for workflow state. Minimum content: what was found or produced, why it
matters, where/what triggered it (`discovered-from` —
`engineering-graph.md`), whether it's required for anything currently in
progress, and any known dependency. Not every passing thought earns one —
a vague "improve this later" with no context is noise, not a backlog item
(`SPEC-010` → "Discovery capture").

**Discovery does not automatically become implementation scope** — the
central rule `SPEC-010` establishes. Capturing something as a BACKLOG
item is explicitly _not_ committing to build it; see
`.agent/instructions/backlog-and-feature-development.md`.

### When to create a TRACE

Full model: `.project/specs/SPEC-013-agent-execution-traceability.md`.
Proportional to the work — a question or a small clarification needs
none; a small implementation change gets a lightweight one; a feature,
architecture change, technology adoption, or ecosystem-guidance change
gets a full one. A TRACE records what was requested, what applied, what
was decided (and by whom), what was implemented/discovered/deferred,
what validation and review occurred, and the Git/final outcome — by
reference to the artifacts that actually hold that knowledge (ADR/SPEC/
BACKLOG/PLAN/REVIEW/Git), never by duplicating them. Written
progressively as checkpoints actually complete (added M19), not
reconstructed from memory after the work is done — `SPEC-013` →
"Checkpoint structure", "Progressive recording".

### Why no `tasks/`, `research/`, `rfc/`, `handoffs/`, `context/`, `changes/`, `sessions/` yet

None currently hold real content:

- **`tasks/`, `handoffs/`** — see the criteria above; no piece of work so
  far has met them. Create the directory the first time a real one does.
- **`research/`, `rfc/`** — no investigation or active proposal exists
  yet. Create the directory the first time a real one does.
- **`context/`, `sessions/`** — see Durable vs. ephemeral memory below;
  these are ephemeral by default and are not being persisted yet.
- **`changes/`** — see Relationships below: a "change" is the actual
  diff/commit, not a separate filesystem artifact type.

`backlog/` was created at M22 (the first real backlog items — see
`.project/backlog/BACKLOG.md`, a single table file, not one file per
item — `SPEC-010` → "Persistence", corrected at M23).

## Lifecycle

Not every type shares the same states — don't force one state machine onto
all of them.

- **SPEC**: `draft → active → superseded → archived`. `active` means
  currently governing work (a spec doesn't stop being true just because
  its milestone shipped); `draft` may also hold a Phase 3 Specification
  output whose readiness is `needs-clarification` or `blocked`;
  `superseded` points at the artifact that replaced it via `related`.
- **PLAN**: `draft → active → complete → superseded → archived`. A plan
  becomes `complete` when its bounded implementation effort is done, or
  `superseded` when another plan replaces it before completion.
- **ADR**: `proposed → accepted → superseded → deprecated` (standard ADR
  convention). An accepted ADR stays accepted even after the milestone
  that produced it ships — it's a historical record of a decision, not a
  status to close out.
- **TASK** (when first used): `todo → in-progress → done → cancelled`.
- **REVIEW, REPORT, RESEARCH**: point-in-time records — `draft → final`.
  They don't get superseded; a later review is a new artifact that may
  reference the earlier one.
- **RFC**: `draft → discussion → accepted → rejected`. An accepted RFC
  typically produces an ADR.
- **REQ**: `captured` for Phase 1 Intake. The implemented Intake
  transition is `input → intake/captured → discovery` (`SPEC-015`).
- **DISC**: `complete`, `needs-clarification`, or `blocked` for Phase 2
  Discovery. The implemented transition is `REQ-* → discovery → DISC-* →
specification` (`SPEC-016`).
- **DECOMP**: `complete`, `needs-clarification`, or `blocked` for Phase 4
  Decomposition. The implemented transition is `SPEC-* →
decomposition → DECOMP-* → architecture` when the source Specification is
  active and ready (`SPEC-019`).
- **ARCH**: `complete`, `needs-clarification`, or `blocked` for Phase 5
  Architecture. The implemented transition is `DISC-*` + `SPEC-*` +
  `DECOMP-*` + backlog Features → `ARCH-*` → selected Feature System
  Design when upstream readiness gates pass (`SPEC-020`).
- **SD**: `complete`, `needs-clarification`, or `blocked` for Phase 6
  System Design. The implemented transition is `ARCH-*` + one selected
  eligible backlog Feature → `SD-*` → engineering decomposition when the
  Feature is architecturally compatible (`SPEC-021`).
- **ENG**: `complete`, `needs-clarification`, or `blocked` for Phase 7
  Engineering Decomposition. The implemented transition is `SD-*` + one
  selected eligible backlog Feature → `ENG-*` → Implementation when the
  Feature has executable work, dependency sequencing, verification
  expectations, and intact traceability (`SPEC-022`).
- **HANDOFF**: ephemeral by default (see below) — no formal lifecycle.
- **BACKLOG** (when first used): `captured → clarifying → ready →
selected → in-progress → review → completed`, with `deferred`,
  `blocked`, `rejected`, and `superseded` as alternatives reachable from
  any non-terminal state. Full definitions: `SPEC-010` → "Work states."
- **TRACE**: `created → oriented → understood → analyzed → scoped →
planned → implementing → validating → reviewing → recording →
completed` — a checklist of what a trace _may_ pass through, not a
  mandatory sequence every trace completes (`SPEC-013` → "Trace
  lifecycle"); side states `blocked`, `deferred`, `cancelled`, `rejected`
  reachable from any non-terminal state.

## Relationships

Artifacts reference each other via the `related:` frontmatter array (a
list of artifact IDs) plus a normal relative markdown link in the body
where the reference is discussed. No graph engine — plain references,
resolved by reading the file.

Typical chains:

```text
RFC → ADR → SPEC
SPEC → PLAN → TASK → (change) → REVIEW
```

**"Change" is not a filesystem artifact type.** It's the actual code/config
diff (a commit, a PR) that a TASK produces. A REVIEW references the
relevant commit(s)/PR and the TASK/PLAN they implement via `related:`,
rather than a `CHANGE-*` document being created to represent it. This
repository doesn't have PR review tooling wired up yet (no remote), so for
now a REVIEW may reference a working-tree state or conversation instead of
a commit hash — note that explicitly in the review when it applies.

### Typed relationships (optional)

`related:` stays the default — an untyped "see also." When a relationship
needs a specific, defined meaning (`depends-on`, `blocks`, `implements`,
`satisfies`, `consumes`, `produces`, `owned-by`, `derived-from`,
`supersedes`, `validated-by`, `affects` — full definitions in
`specs/SPEC-007-engineering-graph.md`), it may be recorded as an
additional `relations:` frontmatter list instead of, or alongside,
`related:`:

```yaml
relations:
  - type: supersedes
    target: ADR-007
```

This is genuinely optional and, as of M09, unused — no existing artifact
has been retrofitted with it (e.g. `ADR-007`/`ADR-008`'s relationship is
already fully expressed through `status: superseded` + prose +
`related:`, so adding `relations:` there today would add notation without
new capability). Add it the first time a relationship actually needs
that precision, not preemptively. See
`.agent/instructions/engineering-graph.md` for when a typed edge is
warranted at all.

## Rework and clarification

Clarification is not an artifact type or lifecycle phase. It is a
human/agent interaction that resolves missing lifecycle input. When the
clarification changes upstream understanding, update that upstream
artifact before revising downstream artifacts.

Rework is represented with existing artifact conventions:

- same work item, same artifact identity: update the artifact in place,
  add `updated: YYYY-MM-DD`, and preserve the earlier outcome in a clear
  history section;
- changed work-item identity: create the next ordinary artifact and mark
  the earlier one `superseded`;
- meaningful clarification/rework events are recorded in `TRACE-*`, using
  the existing human-input and decision-provenance fields from `SPEC-013`.

Do not create `CLARIFICATION-*`, revision ledgers, lifecycle engines, or
state machines for this unless a future concrete need proves the current
artifact model is insufficient.

## SPEC vs PLAN vs TASK

These are not interchangeable markdown files with different filenames:

- **SPEC** — _what_ should exist or be true. Written in terms of required
  behavior/properties, not implementation steps. Stays `active` as long as
  the requirement holds, independent of whether the work is done.
- **PLAN** — _how_ a spec (or part of one) will be accomplished: ordered
  steps, scope boundaries, what's explicitly excluded. Becomes `complete`
  or `superseded` once its steps are done or abandoned — a plan is
  inherently about a bounded effort, unlike a spec.
- **TASK** — a single bounded, executable unit pulled from a plan step,
  small enough to implement and validate in one pass. Only created when a
  plan step is large enough to need tracking below the plan-step level.

## Durable vs. ephemeral memory

`.project/` holds **durable** knowledge only: decisions, specs, approved
plans, findings, and reviews that remain true/useful after the session
that produced them ends. Artifact types above are durable by definition
— creating one is a deliberate act of recording, not a log entry.

**Ephemeral** information — a session's working notes, an agent's
in-progress scratch reasoning, transient observations — is _not_ written
to `.project/`. It stays in the conversation/session it occurred in and is
discarded when that ends, unless something in it is worth promoting to a
durable artifact (e.g. a `HANDOFF` note when work spans sessions, or an
`ADR` when a passing observation turns out to be an actual decision).
Nothing here indiscriminately logs agent activity — recording is
intentional, one artifact at a time.

## Current project state

`.project/state/PROJECT-STATE.md` is a **singleton**, not a versioned
artifact — it has no `id`/`status`/lifecycle of its own. It's updated in
place to always reflect the current phase, active work, authoritative
decisions, and what's next. It is the one file an agent should read to
answer "what's going on here" without loading any other artifact.

## Project/product memory

`.project/projects/<project>/PROJECT.md` records the durable operating
memory for one real project/product inside the monorepo: its role, owned
deployables, current capabilities, project-specific decisions, backlog
scope, and agent entry notes. It is loaded after the repository/foundation
brain and before source code when work targets that project.

Do not create project memory speculatively. Create it when a real project
exists or when an explicit project/product request needs a durable owner.

## Requirement / Intake artifact

`.project/requirements/REQ-<NNN>-<slug>.md` records one raw
business/product request captured by Intake. It preserves the original
request, source, desired outcome, facts, context, constraints, unknowns,
assumptions, scope in/out, lifecycle state, trace identity, and explicit
downstream boundary flags.

This is not a SPEC, PLAN, TASK, ADR, or backlog item. It is the input
record that may later feed Discovery. It is also not a separate contract
framework; the Intake contract is the documented set of responsibilities,
inputs, outputs, boundaries, and completion conditions in `SPEC-015`.

## Discovery artifact

`.project/discovery/DISC-<NNN>-<slug>.md` records evidence-backed
understanding produced from a completed Intake artifact. It preserves the
source `REQ-*`, original request, route, selected Discovery jobs, problem
understanding, desired outcome, actors, selected lenses, lens findings,
current state, gap/capability analysis, existing capabilities, missing
capabilities, known requirements, facts, findings, inferences, assumptions,
unknowns, dependencies, risks, contradictions, open questions, evidence,
synthesis, conclusion, lifecycle state, and downstream boundary.

This is not a SPEC, PLAN, TASK, ADR, backlog item, architecture record, or
implementation plan. It is the understanding record that may later feed
Specification. It is also not a separate job-contract framework; Discovery
jobs are bounded investigation responsibilities selected from the existing
analysis/discovery model in `SPEC-010`, `SPEC-014`, and
`.agent/workflows/app-analysis.md`.

## Specification artifact

Phase 3 Specification reuses the ordinary
`.project/specs/SPEC-<NNN>-<slug>.md` artifact type. A Specification
artifact consumes a completed `DISC-*` artifact and records explicit,
testable requirements or the unresolved decisions that prevent a complete
specification. It preserves the source `REQ-*`, source `DISC-*`, original
request, route, readiness, Discovery inputs used, finding treatment,
requirements, functional/non-functional requirements where supported,
business rules, constraints, acceptance conditions, non-goals, unresolved
decisions, traceability, lifecycle state, and downstream boundary.

This is not a PLAN, TASK, ADR, API contract, database schema, architecture
record, or implementation plan. It is the requirements contract that may
later feed Decomposition when ready. The governing phase definition is
`SPEC-017`; the agent-facing workflow is
`.agent/workflows/specification.md`.

A Specification whose readiness is `needs-clarification` or `blocked`
must identify the missing information, why it matters, the upstream phase
that should supply it, and which downstream phase is blocked. Such a spec
is not valid input to Decomposition. If clarification later resolves the
issue and changes Discovery-level understanding, the `DISC-*` is reworked
first, then the `SPEC-*` is revised.

## Decomposition artifact

`.project/decomposition/DECOMP-<NNN>-<slug>.md` records product/system
scope units produced from a ready Specification. It preserves the source
`SPEC-*`, relevant source `DISC-*`, specified outcome, readiness,
hierarchy, units, requirement coverage, relationship semantics,
architecture handoff, assumptions, unresolved questions, non-goals,
traceability, lifecycle state, and downstream boundary.

This is not a BACKLOG item, TASK, PLAN, ADR, architecture artifact, API
contract, database schema, UI design, job contract, or implementation
plan. It is the scope map that may later feed Architecture when ready.
The governing phase definition is `SPEC-019`; the agent-facing workflow is
`.agent/workflows/decomposition.md`.

Every active Specification requirement must be mapped, represented by
rationale, or explicitly blocked. Every decomposition unit must be
justified by an active Specification requirement. Candidate requirements
and non-goals can constrain boundaries but cannot create units by
themselves.

## Architecture artifact

`.project/architecture/ARCH-<NNN>-<slug>.md` records the Architecture
phase output produced from Discovery evidence, an approved Specification,
a ready Decomposition, and relevant backlog Feature rows. It preserves the
inputs, current technical state, target architectural state, boundaries,
Feature mapping, evidence-backed decisions, trade-offs, constraints,
risks/open decisions, downstream handoff, traceability, lifecycle state,
and boundary check.

This is not an ADR replacement, `architecture.yaml` replacement, BACKLOG
item, PLAN, TASK, API contract, database schema, UI design, job contract,
or implementation plan. It is the work-item architecture record that may
later feed selected Feature System Design when ready. The governing phase
definition is `SPEC-020`; the agent-facing workflow is
`.agent/workflows/architecture.md`.

Create ADRs only when Architecture makes a material durable decision
between real alternatives that should govern beyond the current work item.
Do not create ADRs mechanically for every architectural observation.

## System Design artifact

`.project/system-design/SD-<NNN>-<slug>.md` records one Feature-scoped
System Design produced from a selected eligible backlog Feature and a
ready high-level Architecture baseline. It preserves the selected Feature,
sources, eligibility, scope, sibling Feature boundaries, actors, behavior,
interaction flows, responsibilities, data flow, authorization/ownership,
validation/error behavior, testability expectations, architectural
consistency result, architectural impact, unresolved questions, readiness,
traceability, lifecycle state, and downstream boundary.

This is not a product-wide design, Feature registry, BACKLOG item, PLAN,
TASK, job contract, implementation plan, API contract, database schema, UI
implementation design, Architecture replacement, or traceability engine.
It is the selected-Feature design that may later feed Engineering
Decomposition when ready. The governing phase definition is `SPEC-021`;
the agent-facing workflow is `.agent/workflows/system-design.md`.

Parent epics and sibling Features may be referenced only to establish
scope, dependencies, constraints, or contradictions. They must not receive
their own detailed design inside a selected Feature's `SD-*` artifact.

## Engineering Decomposition artifact

`.project/engineering/ENG-<NNN>-<slug>.md` records executable
engineering work produced from one approved Feature-scoped System Design
before Implementation. It preserves the selected Feature, sources,
engineering scope, targeted code evidence, actual delta, engineering work
items, dependencies/sequencing, affected system areas, verification
expectations, acceptance relationship, architectural consistency,
readiness, traceability, lifecycle state, and downstream boundary.

This is not product Decomposition, a BACKLOG item, PLAN, TASK, job
contract, implementation plan, API contract, database schema, UI
implementation design, Architecture replacement, or traceability engine.
It is the selected-Feature engineering work breakdown that may later feed
Implementation when ready. The governing phase definition is `SPEC-022`;
the agent-facing workflow is
`.agent/workflows/engineering-decomposition.md`.

Engineering work items inside `ENG-*` are not `TASK-*` artifacts. Create
`TASK-*` later only when the ordinary task criteria above are met.

## Backlog

`.project/backlog/BACKLOG.md` (added M22, single-file format since M23)
is the second singleton this repository has — see "Persistence" in
`SPEC-010`. Individual rows carry their own `BACKLOG-<NNN>` id, `Scope`,
`Owner`, `Level`, `Parent`, `Kind`, `Status`, `Priority`, `Source`,
`Dependencies`, and `Notes`, same required fields as any other artifact
type, just expressed as table columns instead of per-file frontmatter.
`Level`/`Parent` describe hierarchy; `Status` describes workflow
progress.

## Roadmap history

`.project/roadmap/MILESTONES.yaml` is a singleton project-memory file,
not a versioned artifact with its own `ROADMAP-*` id. It holds detailed
milestone history moved out of `architecture.yaml` at M26. The current
phase and live architecture stay in `architecture.yaml`; the chronological
record lives here.
