---
type: state
updated: 2026-08-30
---

# Project State

This file is a singleton, updated in place — read this first for "what's
going on," before opening any other artifact.

## Current phase

**M11 — MCP Integration** is next, **not started**. M01–M10 are complete.
See `../../architecture.yaml` → `roadmap` for the full milestone list.

**Roadmap numbering note (M10):** the original roadmap labeled M10
"MCP Integration" and M11 "Core Packages." The M10 work request's actual
content (package source model) matched the original M11, not M10. Since
neither had started, the labels were swapped rather than left
inconsistent — `architecture.yaml`'s M10 is now "Package Source Model"
(delivered) and M11 is "MCP Integration" (next). No completed milestone's
record was altered.

## Completed

- **M01 — Foundation Definition** — `complete`. See `PLAN-001`, `REVIEW-001`.
- **M02 — Repository Bootstrap** — `complete`. See `PLAN-001`, `REVIEW-001`.
- **M03 — Claude Agent Bootstrap** — `complete`. See `PLAN-001`, `REVIEW-001`.
- **M04 — Project Artifact System** — `complete`. Established `.project/`
  itself: `ARTIFACT-TYPES.md`, `state/`, `decisions/` (ADR-001..006),
  `specs/` (SPEC-001), `plans/` (PLAN-001), `reviews/` (REVIEW-001).
- **M05 — Contract System** — `complete`, **corrected within M05**. A
  contract is a concept (type/interface/schema/API-spec/event-def), not a
  framework; ownership before reuse; `packages/` is a source boundary,
  not a nested monorepo. See `ADR-007` (superseded), `ADR-008` (current),
  `SPEC-002` (superseded), `SPEC-003` (current).
- **M06 — Workflow System** — `complete`. Formalized the development
  lifecycle (`UNDERSTAND → PLAN → IMPLEMENT → VALIDATE → REVIEW → RECORD
→ COMPLETE`) as a shared instruction
  (`.agent/instructions/development-lifecycle.md`) and durable spec
  (`SPEC-004`); the four workflows (`feature`/`bugfix`/`refactor`/
  `review`) now reference it instead of each restating the stage table.
  `TASK`/`HANDOFF` creation criteria made concrete in
  `.project/ARTIFACT-TYPES.md`; neither instantiated (no work has met the
  criteria yet).
- **M07 — Skill System** — `complete`. Formalized the six-way capability
  distinction (instruction/workflow/skill/tool/package/agent) in
  `.agent/instructions/capability-model.md`, expanded `.agent/skills/README.md`
  into the full skill model (metadata rationale, structure, discovery,
  selection, composition, inputs/outputs, failure/side-effects), and
  recorded it durably in `SPEC-005`. `validate-repository` remains the
  **only** skill — a second candidate (`inspect-architecture`) was
  considered and rejected as redundant with the existing
  `repository-orientation.md` instruction; no review artifact was created
  for this milestone-sized judgment call, same precedent as M04/M05/M06.
- **M08 — Development Loops** — `complete`. Added the iterative
  reasoning model (`OBSERVE → UNDERSTAND → HYPOTHESIZE → PLAN → CHANGE →
VERIFY → EVALUATE`) that operates _inside_ M06's IMPLEMENT stage and
  failure loop — `.agent/instructions/development-loop.md` + `SPEC-006`.
  Protocol/documentation only, as required; no repository change existed
  to demonstrate it against, so none was manufactured (see this
  milestone's report for the explicit reasoning).
- **M09 — Graph System** — `complete`. Defined the engineering graph
  model: 14 node types (2 already have real instances — artifacts by
  their existing IDs, workflows/skills by their existing `name:`), an
  11-type relationship vocabulary (`depends-on`/`blocks`/`implements`/
  `satisfies`/`consumes`/`produces`/`owned-by`/`derived-from`/
  `supersedes`/`validated-by`/`affects`), and the explicit rule that a
  `related:` reference never implies a graph edge —
  `.agent/instructions/engineering-graph.md` + `SPEC-007`. The existing
  `related:` mechanism (M04) is unchanged. An optional `relations:`
  typed-edge convention was documented in `ARTIFACT-TYPES.md` but applied
  to **zero** existing artifacts — no real case needed the extra
  precision yet (e.g. `ADR-007`/`ADR-008`'s relationship stays expressed
  via `status`/prose/`related:`). No `.project/graph/` directory, no
  graph engine/database/API/CLI.
- **M10 — Package Source Model** — `complete`. Operationalized `ADR-008`'s
  package model (no new ADR — nothing here changes ownership, dependency
  direction, or distribution policy): `.agent/instructions/packages.md`
  plus two new sections amending `SPEC-003` (package definition/boundary
  distinction table; package-to-package consumption and the
  "not a business-logic dumping ground" rule). Confirmed
  `pnpm-workspace.yaml` still excludes `packages/*`. **No package
  created** — the repository has no `apps/`/`servers/`/`agents/`/
  `tooling/` source yet, so nothing meets the demonstrated-reuse
  extraction bar; absence is the correct, intentional outcome.

## Currently active

Nothing beyond finishing M10's own validation pass. No open TASK/RFC/
RESEARCH artifacts exist (none have been needed yet).

## Authoritative decisions

`ADR-001`–`ADR-006`, `ADR-008` — `accepted`, in force.
`ADR-007` — `superseded` by `ADR-008` (kept as historical record).
M06 through M10 introduced no new ADR — all are process/instruction
content operating within the existing architecture, not a change to a
boundary, dependency direction, or ownership decision.

## Blocked

Nothing.

## Next

M11 — MCP Integration. **Not started.** Do not begin it without explicit
approval — see `../../.agent/instructions/implementation.md`
("stay inside the current milestone").

## Open questions carried forward

None currently.
