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

| Type         | Prefix      | Purpose                                                                                                                                                                                                                                                                                                 | Instantiated now?   |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Spec         | `SPEC-`     | What should exist / what behavior is required.                                                                                                                                                                                                                                                          | Yes — `specs/`      |
| Plan         | `PLAN-`     | How we intend to accomplish a spec.                                                                                                                                                                                                                                                                     | Yes — `plans/`      |
| Task         | `TASK-`     | A bounded, executable unit of work.                                                                                                                                                                                                                                                                     | Not yet — see below |
| ADR          | `ADR-`      | An architectural decision: context, decision, consequences.                                                                                                                                                                                                                                             | Yes — `decisions/`  |
| RFC          | `RFC-`      | A proposal under discussion, upstream of an ADR.                                                                                                                                                                                                                                                        | Not yet             |
| Research     | `RESEARCH-` | Findings from an investigation, informing a spec/ADR.                                                                                                                                                                                                                                                   | Not yet             |
| Review       | `REVIEW-`   | An evaluation of a completed change against its plan/spec.                                                                                                                                                                                                                                              | Yes — `reviews/`    |
| Report       | `REPORT-`   | A point-in-time status summary for an audience beyond the agent.                                                                                                                                                                                                                                        | Not yet             |
| Handoff      | `HANDOFF-`  | Session-to-session continuity notes.                                                                                                                                                                                                                                                                    | Not yet             |
| Backlog item | `BACKLOG-`  | Work that is known, proposed, discovered, deferred, or awaiting clarification — not necessarily current implementation scope. Added M15, `SPEC-010`. One table file (`backlog/BACKLOG.md`), not one file per item — see `SPEC-010` → "Persistence" (M23).                                               | Yes — `backlog/`    |
| Trace        | `TRACE-`    | The record connecting the execution journey of one coherent unit of meaningful agent work — request, applicable guidance, decisions, scope, implementation, validation, review, Git outcome. Added M18, `SPEC-013`. Never a replacement for TASK/PLAN/RFC/SPEC/ADR/REVIEW/BACKLOG — it references them. | Yes — `traces/`     |

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
part of the current
feature's scope: a discovered requirement, a deliberately deferred piece
of scope, a follow-up technical improvement, a risk, or a known
dependency on work that doesn't exist yet. Minimum content: what was
found, why it matters, where/what triggered it (`discovered-from` —
`engineering-graph.md`), whether it's required for anything currently
in progress, and any known dependency. Not every passing thought earns
one — a vague "improve this later" with no context is noise, not a
backlog item (`SPEC-010` → "Discovery capture").

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

### Why no `tasks/`, `research/`, `rfc/`, `reports/`, `handoffs/`, `context/`, `changes/`, `sessions/` yet

None currently hold real content:

- **`tasks/`, `handoffs/`** — see the criteria above; no piece of work so
  far has met them. Create the directory the first time a real one does.
- **`research/`, `rfc/`, `reports/`** — no investigation, active
  proposal, or stakeholder report exists yet. Create the directory the
  first time a real one does.
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

- **SPEC, PLAN**: `draft → active → superseded → archived`. `active` means
  currently governing work (a spec doesn't stop being true just because
  its milestone shipped); `superseded` points at the artifact that
  replaced it via `related`.
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
that produced them ends. All nine artifact types above are durable by
definition — creating one is a deliberate act of recording, not a log
entry.

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

## Backlog

`.project/backlog/BACKLOG.md` (added M22, single-file format since M23)
is the second singleton this repository has — see "Persistence" in
`SPEC-010`. Individual rows carry their own `BACKLOG-<NNN>` id, `kind`,
and `status`, same required fields as any other artifact type, just
expressed as table columns instead of per-file frontmatter.
