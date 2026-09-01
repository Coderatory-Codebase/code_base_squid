---
id: SPEC-013
type: spec
title: Agent execution traceability
status: active
created: 2026-08-31
updated: 2026-08-31
related: [SPEC-004, SPEC-006, SPEC-007, SPEC-010, SPEC-011, SPEC-012, ADR-011]
---

# SPEC-013: Agent Execution Traceability

Operational entry point: `.agent/instructions/traceability.md`. This spec
is the comprehensive, durable definition; that file is the shorter
agent-facing pointer into it.

> **M19 amendment**: M18 established the trace model and its first
> instance; M19 added a concrete checkpoint field structure ("Checkpoint
> structure" below) and a hard rule that traces are written progressively,
> not reconstructed afterward ("Progressive recording" below), after
> `TRACE-001` showed a real gap between the two. Everything else is
> unchanged from M18.
>
> **M23 amendment**: one new checkpoint field, `classification`
> (`FOUNDATION`/`PROJECT`/`BOTH` — `SPEC-011`, added alongside `ADR-013`'s
> project-ownership boundary) — so a trace can show not just what
> happened but whether it touched the reusable foundation, one project's
> own code, or both, without a project implementation's trace being
> mistaken for a foundation decision or vice versa.

## Purpose

M01–M17 built a coherent operating model and (M16) connected it into one
discoverable bootstrap sequence. None of that answers a different
question: once an agent has done real work, **how does a human
reconstruct what happened** — what was asked, what applied, what was
decided, who decided it, what changed, what was verified, how it ended?
This spec establishes a durable **Agent Execution Trace**: a record of
the engineering journey, not a second place any of that gets decided.

## Core distinction

```text
Operating Model  → determines how the agent should work (SPEC-004/006/
                    008/010/011/012, unchanged)
Agent executes   → does the work, using that model
Trace            → records what actually happened
```

The trace is **observational, not authoritative**. It never becomes a
second workflow engine, lifecycle, backlog, project-state system, Git
system, or policy system. Every kind of durable knowledge keeps its
existing home:

| Holds                         | Not the trace — always |
| ----------------------------- | ---------------------- |
| Architectural decision        | `ADR`                  |
| Durable specification         | `SPEC`                 |
| Known/proposed/deferred work  | `BACKLOG`              |
| Implementation planning       | `PLAN`                 |
| Current project state         | `PROJECT-STATE.md`     |
| Source/change history         | Git                    |
| Automated validation evidence | CI                     |

A trace **references** all of these. It duplicates none of them.

## Definition

A trace is a durable record of one coherent unit of agent work, answering
what was requested, what repository state was observed, which operating
rules applied, what was decided (and by whom), what scope was
authorized, what was implemented, discovered, and deferred, what
validation and review occurred, what changed in Git, and how the work
concluded. It records **auditable actions, decisions, evidence,
references, and outcomes** — never private reasoning or a
command-by-command transcript (see "What a trace is not").

## What a trace is not

Not a chain-of-thought log, not a shell-command transcript, not a
file-read log, not a second lifecycle, not a second backlog, not a
retrospective fiction assembled only after success. See "Trace
integrity" for the concrete rules this implies.

## Proportionality — when a trace is required

```text
Simple explanation / question           → no durable trace
Exploration with real investigation      → trace when the investigation
                                            itself has lasting value
Small implementation change              → lightweight trace
Feature implementation                   → full trace
Architecture change                      → full trace
Technology adoption                      → full trace
Ecosystem guidance change (SPEC-012)     → full trace + decision provenance
Release / deployment / operational change → full trace
```

This follows `development-lifecycle.md` → "Proportionality" exactly (the
same principle that says a one-line fix doesn't need a SPEC) applied to
the trace itself. Most interactions in this repository's history so far
— a question, a small clarification — would warrant no trace. Don't
manufacture ceremony for trivial work.

## Identity

`TRACE-<NNN>`, zero-padded, monotonically increasing — the same
convention every other `.project/` artifact already uses
(`ARTIFACT-TYPES.md`). No UUID, no timestamp-based ID; git history
already provides provenance the way it does for every other artifact
(same reasoning `skills/README.md` already applies to skill metadata).

## Persistence

Repository-native: one markdown file per trace,
`.project/traces/TRACE-<NNN>-<slug>.md`. No database, API, CLI,
dashboard, telemetry service, event bus, or external observability
platform — see `ADR-011` for the full evaluation. `.project/traces/` is
created with this milestone's own first real trace (`TRACE-001` — see
"Worked example" below); it is not a directory created for its own sake.

## Trace lifecycle

Checkpoints against the bootstrap sequence `SPEC-011` already defines —
not a new lifecycle:

```text
created → oriented → understood → analyzed → (awaiting-human) → scoped
  → planned → implementing → validating → reviewing → recording → completed
```

with side states `blocked`, `failed`, `deferred`, `cancelled`, `rejected`
reachable from any non-terminal state. **A trace reflects what actually
happened, not a mandatory checklist** — a small change's trace might be
`created → oriented → scoped → implementing → validating → completed`
with no `analyzed`/`reviewing` entries at all, because that work
genuinely didn't need them. Skipping a stage that wasn't needed is
correct; claiming a skipped stage happened is the integrity violation
"Trace integrity" forbids.

## Stages, and what each records

Every stage below is optional per-trace (see "Trace lifecycle"); this
section defines what goes in it _when it's used_, referencing the
existing model rather than restating it:

- **Orientation** — that repository context was established, and from
  what (`CLAUDE.md`/`AGENTS.md`/`repository-orientation.md`/
  `PROJECT-STATE.md`/`architecture.yaml`). Reference, don't copy.
- **Operating model** — which instructions/workflows/skills were
  actually applicable (e.g. `development-lifecycle`,
  `backlog-and-feature-development`, `git-governance`,
  `technology-guidance`). Only what was genuinely used — never claim an
  instruction was applied if it wasn't (`SPEC-011` integrity applies
  here too).
- **Request classification** — one of a small set:
  `exploration | feature | bug | refactor | architecture |
technology-adoption | operational | documentation | governance`. Don't
  grow this list beyond what's actually been needed.
- **Existing coverage** — what prior artifacts/components/skills/
  workflows the work drew on (an ADR, a SPEC, an existing package). By
  reference (`ADR-008`), never by restating its content.
- **Analysis** — only the lenses actually relevant
  (`SPEC-010` → "Analysis lenses" is the same list this draws from) —
  never a mandatory checklist for a small change.

## Checkpoint structure (added M19)

A checkpoint is one entry against a stage from "Trace lifecycle." It may
record, only where actually applicable:

```text
stage / status
purpose
actions taken
observations
artifacts consulted (by reference)
constraints identified
discoveries
decisions (with source and status — see "Decision provenance")
human input requested/received
scope impact (needed-now / discovered / deferred — SPEC-010)
classification (FOUNDATION / PROJECT / BOTH — SPEC-011, added M23)
validation performed and its result
failures and how they were diagnosed/remediated
outcome
references
```

**No field is mandatory.** An `orient` checkpoint on a small change might
be three lines (actions, observations, outcome); a `validate` checkpoint
that hit a real failure needs `failures`/`remediation` to be honest about
what happened. This is the same field list `SPEC-013`'s stages already
implied — this section makes it concrete and consistent across
checkpoints rather than inventing a new one per trace author. It is a
field list, not a schema enforced by tooling — no validator is built for
it (see "Non-goals").

## Progressive recording (added M19)

**A trace is written while the work happens, not reconstructed from
memory afterward.** Create the `TRACE-<NNN>` file at (or before) the
first meaningful checkpoint and append to it as each subsequent
checkpoint actually completes — the same discipline `SPEC-013`'s
"Trace integrity" already requires (append corrections, don't rewrite
history) applied to the trace's own construction, not just its later
corrections. A trace assembled entirely after the work concluded is
harder to keep honest — it's tempting to smooth over a failure that got
fixed, or state a decision more cleanly than it was actually reached —
and M18's own `TRACE-001` is the concrete evidence: accurate, but
substantively written near the end rather than alongside the work,
which this section exists to correct going forward. This does not mean
every checkpoint needs its own tool call or file write — batching a few
adjacent, already-completed checkpoints into one update is fine; the
rule is against reconstructing the _entire_ trace retrospectively, not
against any batching at all.

## Decision provenance

Every consequential decision recorded in a trace states its **source**:

```text
Human decision
Agent decision
Existing repository rule (cite it)
Existing ADR/SPEC decision (cite it)
External authoritative guidance (cite it)
Automated validation result (cite it)
```

and its **status** (`approved | applied | awaiting-human | rejected |
overridden`, as applicable). A trace must never imply an agent made a
decision that was actually the human's — see "Trace integrity."

## Human-in-the-loop

When human input was required, the trace records: what was asked, why,
the options if there were real alternatives, the decision, who decided,
and its status (`awaiting-human | approved | rejected | clarified |
overridden`). This is `SPEC-010`/`SPEC-011`/`SPEC-012`'s existing
human-approval model, made visible in the record — the trace does not
decide when approval is required; those specs already do
(architecture changes, new ecosystem guidance, technology-skill
creation/material change, a decision that contradicts an established one,
a significant scope change, a security-sensitive or irreversible
decision).

## Technology and skill traceability

Integrates `SPEC-012` unchanged: which technology was involved, which
skill (if any) was used and from where, whether the project overrode
generic guidance, and — if a skill didn't exist — what was decided
(guidance unnecessary and the work proceeded on existing principles, or a
skill was proposed and its human-approval status). The trace never
implies a technology skill was created automatically because a
technology appeared; `SPEC-012`'s governance is unaffected and remains
the sole authority on whether a skill gets created.

## Scope and discovery traceability

Integrates `SPEC-010`: what was needed now vs. discovered vs. a
dependency vs. deferred vs. blocked/rejected/superseded, with a deferred
or discovered item referencing the `BACKLOG-<NNN>` it became (using the
existing `discovered-from` relationship where the source has stable
identity — `engineering-graph.md`) rather than restating it. A trace
recording a discovery is not itself authorization to implement it — the
same scope-control rule `SPEC-010` already states. A checkpoint's
`discoveries` field (see "Checkpoint structure") should carry each
discovery's resolution from `SPEC-010`'s five-outcome "Discovery decision
model" (added M20) — not just the observation itself.

## Planning traceability

References the plan, RFC, or SPEC involved rather than restating them:

```text
TRACE → RFC → SPEC → PLAN → IMPLEMENTATION
```

The trace connects these; it is never a substitute for any of them.

## Implementation traceability

Records meaningful engineering events — files/directories/boundaries
affected, artifacts created or modified, dependencies added/removed,
technology skills used or introduced — not every command or keystroke.
"Added `SPEC-013`, `traceability.md`, `.project/traces/TRACE-001`" is a
trace entry; "ran `ls`, opened file X, typed line Y" is not (see "Trace
integrity" and `.agent/instructions/traceability.md` → "What not to
record").

## Validation traceability

Records which of the repository's actual validation commands ran and
their outcome — no separate validation framework, no re-implementation of
`pnpm run validate`/`format:check`/hooks/CI (`validation.md`, `SPEC-009`).
A failure that was then fixed is recorded as failure → correction →
re-run → pass, not silently collapsed into a single "passed" — hiding a
real failure/recovery history is the specific integrity violation this
guards against.

## Review traceability

Records the outcome of whichever review dimensions actually applied
(`development-lifecycle.md` → "Review dimensions") — status, findings,
resolution. References an existing `REVIEW-<NNN>` artifact if one was
produced; doesn't require creating one merely to have something to
reference (`ARTIFACT-TYPES.md`'s existing REVIEW criteria are unchanged).

## Git traceability

References branch/commits/PR/CI/merge outcomes — it does not duplicate
Git history or re-implement anything `git-governance.md`/`SPEC-009`
already enforce. Git and CI remain the authoritative record of what
actually happened to the code; the trace points at them.

## Relationship to the engineering graph

`TRACE` joins the node-type list in `SPEC-007` (`architecture.yaml` →
`.project/` already has stable-ID artifacts as real nodes — this is the
same pattern `BACKLOG` followed at M15). No new relationship type is
added: a trace references other nodes using the existing vocabulary
(`related:` for the common case; `implements`/`validated-by`/`produces`/
`discovered-from` when that specific precision is warranted — all
already defined). No `TRACE_EVENT`/`AGENT_EXECUTION`/`AGENT_SESSION`/
`DECISION_EVENT` node type — the graph remains a relationship model
between real, durable entities, not an event database
(`SPEC-007` → "Explicit non-goals", unchanged).

## Trace integrity

A trace must not: claim validation that didn't run; claim approval that
didn't occur; claim a skill was used when it wasn't; claim a file changed
when it didn't; claim a PR exists when it doesn't; silently remove a
meaningful failure from the record; rewrite a historical decision without
preserving its provenance (`SPEC-011` → "Historical decisions are not
silently rewritten" applies to trace files too); or convert a discovery
into completed work without the scope authorization that would make that
legitimate (`SPEC-010`). Where a correction is needed, append it — don't
rewrite prior entries to make the journey look cleaner than it was. No
cryptographic/tamper-evidence infrastructure is built for this — git
history over the trace file itself is the integrity mechanism, same as
every other artifact in this repository.

## Exploration vs. implementation

Unchanged from `SPEC-011` → "Exploration and analysis requests":
exploring or investigating something never itself authorizes
implementing what's found. If an exploration trace surfaces
implementation work, the trace records that as a discovery
(→ backlog/RFC/SPEC as warranted), not as scope the exploration quietly
expanded into.

## Missing or conflicting guidance

Unchanged from `SPEC-012`: identify the gap, check whether existing
principles already answer it, propose durable guidance only when
warranted, get human approval before it becomes shared guidance — the
trace records this sequence when it happens, it doesn't change when
approval is required. A genuine conflict between two guidance sources
resolves via `SPEC-008`'s existing precedence; the trace records which
source won and why, never silently rewrites either source to make the
conflict disappear (`SPEC-011` → "Instruction precedence").

## Completion criteria

A trace is complete when it can answer: what was requested, what the
agent understood, what guidance applied, what existing work was found,
what analysis mattered, what was decided and by whom, what scope was
authorized, what was implemented, discovered, and deferred, what
validation ran, what review occurred, what changed in Git, and the final
outcome. Small work answers these in a handful of lines; complex work
answers them by reference to the RFC/SPEC/PLAN/BACKLOG/REVIEW/Git records
it produced along the way.

## Worked example

M18 produced the trace model's first application:
`.project/traces/TRACE-001-m18-agent-execution-traceability-model.md`
records that milestone's actual execution — a real instance, not a
hypothetical, but assembled mostly near the end (see "Progressive
recording" — this is exactly what M19 corrected). M19 produced the first
trace written progressively, checkpoint by checkpoint, using the
structure above:
`.project/traces/TRACE-002-m19-operating-model-execution-traceability.md`.
Neither is backfilled onto M01–M17, which predate the model entirely and
are not retroactively traced.

## Non-goals

No agent runtime, orchestrator, planner engine, trace-collector service,
event bus, telemetry service, agent database, execution API, trace
dashboard, web UI, MCP integration or trace server, trace SDK/package, or
generic/distributed event framework. No new graph node types beyond
`TRACE` itself, no new graph relationship types. No change to the
existing lifecycle, development loop, backlog model, technology-skill
governance, or Git governance — all remain authoritative and unchanged.
No retroactive trace for M01–M17.

## Status

`active` — governs how meaningful agent work is recorded, from M18
onward.
