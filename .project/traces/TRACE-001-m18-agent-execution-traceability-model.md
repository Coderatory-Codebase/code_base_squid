---
id: TRACE-001
type: trace
title: M18 — establish agent execution traceability model
status: completed
created: 2026-08-31
related: [SPEC-013, ADR-011, SPEC-007, SPEC-010, SPEC-011, SPEC-012]
---

# TRACE-001: M18 — Agent Execution Traceability Model

The trace model's own first application — a real instance, not a
hypothetical. Written while doing the work it describes, not backfilled.

## Request

"M18 — Agent Execution Traceability & Repository Operating Record":
establish a repository-native model for recording how meaningful agent
work was actually done, without building a runtime/telemetry system.

## Classification

`governance` — same category as M12 (engineering standards), M15
(backlog model), M17 (technology governance): a durable operating-model
addition, not a feature/bug/refactor.

## Orientation

Confirmed the working tree was clean and M17 was already committed
(`git log`, `git status`) before making changes. `ARTIFACT-TYPES.md` and
`SPEC-007` were read in full this turn to ground the new artifact type
and its graph-node addition precisely. `AGENTS.md`, `CLAUDE.md`,
`architecture.yaml`, and the other M15–M17 specs were **not** re-read
this turn — they were already established working context from the
immediately preceding milestones in this same session. Recorded
honestly rather than claiming a fresh full inspection that didn't
happen (`SPEC-013` → "Trace integrity").

## Operating model applied

`development-lifecycle.md` (UNDERSTAND → PLAN → IMPLEMENT → VALIDATE →
RECORD), `backlog-and-feature-development.md`'s scope-control principle
(no speculative work added beyond the milestone's own brief),
`change-management.md`/`git-governance.md` (no commit made — see "Git").

## Existing coverage drawn on

`SPEC-004`, `SPEC-006` (lifecycle/loop — unchanged, referenced not
restated), `SPEC-007` (graph model — extended by one node type),
`SPEC-010` (backlog model — referenced for how a trace connects to a
discovered/deferred item), `SPEC-011` (bootstrap sequence — trace
lifecycle stages checkpoint against it directly), `SPEC-012`
(human-approval model — referenced for when a trace records escalation),
`ADR-010` (single, repository-native backlog — direct precedent for
`ADR-011`'s reasoning and structure).

## Analysis

Lenses that actually mattered: **proportionality** (most interactions
need no trace at all — the model had to say this explicitly, not just
imply it); **architecture/graph** (does `TRACE` need a new relationship
type, or does the existing vocabulary already cover "a trace references
X"? — existing vocabulary sufficed); **reflexivity** (should this
milestone produce a real first trace, or leave `.project/traces/`
undemonstrated? — decided to produce one; see "Decisions"); **historical
scope** (should M01–M17 be retroactively traced? — no, explicitly
out of scope, they predate the model).

## Decisions

| Decision                                                                                                                 | Source                                                                                                      | Status  |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------- |
| Introduce `TRACE` as a new `.project/` artifact type                                                                     | Agent, per explicit milestone instruction                                                                   | Applied |
| Repository-native persistence (markdown, `.project/traces/`) over an external system                                     | Agent decision, recorded as `ADR-011` (milestone explicitly authorized an ADR for exactly this alternative) | Applied |
| Produce a real `TRACE-001` for this milestone itself, rather than leaving `.project/traces/` empty                       | Agent design choice — explained to the user in the final report, not silently made                          | Applied |
| No new graph relationship type — reuse existing vocabulary (`related:`, `implements`, `validated-by`, `discovered-from`) | Agent decision, following the milestone's explicit preference for relationships over new node categories    | Applied |
| No ADR for the `TRACE` artifact type/model itself (only for the persistence-mechanism choice)                            | Agent decision, same precedent as `ADR-010` only covering backlog persistence, not the whole backlog model  | Applied |

No decision in this milestone met `SPEC-012`/`SPEC-010`'s escalation
criteria (no architecture/security/cost/vendor/irreversible implication
beyond what the milestone's own brief already authorized) — no human
input was required or requested beyond the kickoff itself.

## Scope

**Needed now**: the traceability SPEC and instruction, the `TRACE`
artifact-type convention, the graph-model extension, discoverability
pointers, and one real worked example (`TRACE-001`, this file).
**Discovered**: nothing of independent, out-of-scope value — no backlog
item was created. **Deferred**: nothing new beyond this spec's own
explicit non-goals (no runtime, no telemetry, no dashboard, no
retroactive trace for M01–M17).

## Implementation

New: `.project/specs/SPEC-013-agent-execution-traceability.md`,
`.agent/instructions/traceability.md`,
`.project/decisions/ADR-011-repository-native-trace-persistence.md`,
`.project/traces/TRACE-001-m18-agent-execution-traceability-model.md`
(this file — first content in the new `.project/traces/` boundary).
Modified: `.project/ARTIFACT-TYPES.md` (TRACE type, lifecycle, "when to
create" section), `.project/specs/SPEC-007-engineering-graph.md` (TRACE
node type added), `AGENTS.md` (pointer), `.project/README.md` (`traces/`
added to the tree), `architecture.yaml` (M18 roadmap entry,
`.project/` boundary's `contains`/`created` lists, `current_phase →
M19`), `.project/state/PROJECT-STATE.md` (M18 recorded, new "Traces"
section, `ADR-011` added to authoritative decisions).

## Validation

`pnpm run validate` (lint, typecheck, test, build, `validate:architecture`,
`secrets:scan`) and `pnpm run format:check` — both run to completion
after every file change in this milestone; final run: all six `validate`
stages passed (`secrets:scan` checked 76 tracked files, none flagged),
`format:check` passed after one round of `prettier --write` on 5 newly
created/edited files (a routine, expected step — every prior milestone
in this session needed the same). No test/source code was manufactured —
this milestone is documentation/governance only.

## Review

Self-review against `SPEC-013`'s own "Completion criteria" (this trace
answers each of them) and the milestone kickoff's manual-verification
checklist (no runtime/telemetry/dashboard/MCP created; existing
lifecycle/loop/backlog/Git-governance/technology-governance unchanged;
proportionality preserved; no private reasoning recorded above — only
the decisions, sources, and outcomes that were actually reached).

## Git

No branch was created and no commit was made — consistent with this
session's established pattern since M13 (the user reviews and commits
each milestone's changes directly on `main`; `change-management.md`:
"commit only when asked"). No PR, no CI run for this specific change at
trace-write time; CI will run against whatever commit the user creates
from this working tree.

## Outcome

`completed`. This trace itself is the worked example the milestone
needed — proof the model produces something a human can actually read
end-to-end, not only a specification of one.
