---
type: state
updated: 2026-08-30
---

# Project State

This file is a singleton, updated in place — read this first for "what's
going on," before opening any other artifact.

## Current phase

**M01–M16 are complete.** M17+ is **not yet defined** — the original M01
roadmap sketch ended at M14; M15 and M16 are both genuinely new
milestones added beyond it (not renames of a placeholder), and nothing
beyond M16 has a sketch entry either. See "Roadmap position" below before
assuming any specific next milestone. See `../../architecture.yaml` →
`roadmap` for the full milestone list.

**Roadmap numbering history:** the original M01 roadmap sketch labeled
M10 "MCP Integration" and M11 "Core Packages." The actual M10 work
request's content (package source model) matched the original M11, not
M10; since neither had started, the labels were swapped — `M10` became
"Package Source Model." That left `M11` named "MCP Integration," which
this M11 architecture-validation milestone then found to contradict its
own explicit instruction that MCP must not occupy a roadmap slot without
a concrete requirement. Resolved by having M11 itself become "Architecture
Validation & Boundary Integrity" (this milestone's actual content) and
dropping "MCP Integration" from the numbered roadmap entirely — it
remains referenced only as a non-goal (`AGENTS.md`, `SPEC-001`), not a
scheduled milestone. No completed milestone's record was altered at any
point.

## Roadmap position

The original M01 roadmap sketch (Foundation Definition ... Production
Hardening) was fully consumed at M14 — M12/M13/M14 were each renamed from
their original placeholder label to their actual delivered content, same
pattern as M10/M11 before them. **M15 and M16 both have no original
placeholder to rename** — each was added because a real gap existed (M15:
no work-management model for actual feature implementation; M16: the
existing operating model wasn't connected into one discoverable bootstrap
sequence), not because a roadmap slot needed filling. Nothing beyond M16
has a sketch entry. The next real milestone is decided when a concrete
need identifies one, not by roadmap position
(`.agent/instructions/implementation.md`) — most plausibly a first real
`apps/`/`servers/`/`agents/`/`packages/` feature now that the foundation
(architecture, agent operating model, project memory, engineering
judgment, Git/quality enforcement, backlog/feature-development model, and
now a connected agent bootstrap sequence) is coherent and load-bearing.

## Technology profile

No implementation technology is in use yet — no `apps/`, `servers/`,
`agents/`, or `packages/` source exists (`architecture.yaml` →
`boundaries`). This section is populated with real languages, frameworks,
libraries, databases, infrastructure, testing, build, and deployment
tooling once a deployable actually adopts one — see
`.project/specs/SPEC-008-engineering-standards-design-and-practice.md` →
"Project technology profile." Not inventing entries here ahead of that.

## Backlog

No backlog item exists yet — `.project/backlog/` is not created (nothing
has been implemented so far to discover or defer work from; see
`ARTIFACT-TYPES.md` → "Why no ... `backlog/` yet"). Model and conventions:
`.project/specs/SPEC-010-agent-backlog-and-feature-driven-development.md`.
The first real backlog item is created the first time a feature's
analysis surfaces genuine out-of-scope work.

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
- **M11 — Architecture Validation & Boundary Integrity** — `complete`. A
  consolidation gate, not a new subsystem — inspected M01–M10 end to end
  against the actual filesystem. Findings: 3 real, low-risk documentation
  gaps (M11's own roadmap-label contradiction with its "no MCP
  milestone" instruction; `AGENTS.md`/`boundaries.md` missing pointers to
  `packages.md`/`contracts.md`; one stale "(once M02 exists...)"
  conditional in `AGENTS.md`) — all corrected. No boundary violation, no
  duplicated concept, no premature abstraction, and no source-code change
  were found or made. Full findings in this milestone's report.
- **M12 — Engineering Standards, Design & Practice Model** — `complete`.
  Renamed from the original roadmap sketch's "Project Scaffolder" — that
  label had no concrete requirement; this milestone's actual content is
  the technology-neutral engineering/design judgment layer that sits
  between `architecture.yaml` (structural boundaries) and real
  implementation. Established: universal engineering principles
  (simplicity, cohesion, coupling, reuse/generalization, decoupling,
  component/system design, testing, security, performance,
  observability), a guidance-precedence order, an exception model, and
  the technology-skill mechanism (an ordinary skill scoped to one
  technology, loaded only when that technology is actually involved) —
  `.project/specs/SPEC-008`, `.agent/instructions/engineering-standards.md`,
  a "Technology skills" section added to `.agent/skills/README.md`. **No
  technology skill created** — this repository has no implementation
  technology in use yet (see "Technology profile" above); the mechanism
  is documented for the first real one. No new ADR (see "Authoritative
  decisions").
- **M13 — Repository Structure, Git Governance & Quality Enforcement** —
  `complete`. Renamed from the original roadmap sketch's "Self-Hosting" —
  that label had no concrete requirement; this milestone's actual content
  is the Git/quality enforcement layer, **implemented, not just
  documented**: real `commit-msg`/`pre-commit`/`pre-push` hooks installed
  via native `core.hooksPath` (no third-party hook manager — `ADR-009`),
  an expanded `pnpm run validate` (added `validate:architecture` and
  `secrets:scan`), and a CI job extended with those plus `format:check`
  and a PR commit-message-range check — `SPEC-009`,
  `.agent/instructions/git-governance.md`. `tooling/` boundary populated
  for the first time (`git-hooks/`, `scripts/`). Two portability issues
  found and fixed while building/testing this: `pnpm`'s Windows shim
  needs `shell: true` to spawn from Node, and a CRLF line ending breaks a
  hook's shebang — both documented in `ADR-009`, and a `.gitattributes`
  (new) now forces LF repo-wide to prevent recurrence. All three hooks
  were verified against real `git commit` calls (accept/reject cases),
  not just unit-tested in isolation; scratch/test commits were undone
  with a mixed `git reset` to preserve this milestone's own working-tree
  changes. **No technology-specific tooling added** — this repository has
  no implementation technology in use yet (see "Technology profile"
  above). Branch protection remains a documented policy, not yet an
  enforced GitHub-host setting — see `SPEC-009` → "Enforcement status".
- **M14 — Autonomous Repository Engineering Tooling** — `complete`.
  Renamed from the original roadmap sketch's "Production Hardening" — no
  production system exists to harden. Matured M13's implementation rather
  than adding a new subsystem: `pre-commit`'s format/secret checks are now
  scoped to staged files only (`prettier --check --ignore-unknown
<staged>`, not the whole repository — a real bug was caught and fixed
  here: prettier _errors_, not skips, on an explicit unsupported-extension
  path); CI now runs `pnpm run validate` as one step instead of
  re-listing six checks that duplicated `package.json`'s own definition;
  a deliberate hook-management evaluation (native `core.hooksPath` vs.
  Husky vs. Lefthook) was recorded as an addendum to `ADR-009` and
  **reaffirmed** native hooks — the cross-platform issues those tools
  solve were already found and fixed directly at M13; a real fresh
  `git clone` + `pnpm install` was exercised end-to-end to confirm
  hook installation actually works with no manual step, not just in the
  already-initialized working copy; `tooling/README.md` (new) gives the
  directory its own onboarding/troubleshooting entry point, matching the
  `.agent/README.md`/`.project/README.md` precedent. Failure-path testing
  (invalid commit message, an unrelated unstaged formatting change, a
  forbidden top-level directory, a real lint error) was performed via
  synthetic fixtures, each removed immediately after. **No new ADR** — the
  hook-management evaluation is an addendum to the existing `ADR-009`,
  reaffirming rather than changing its decision. **No technology-specific
  tooling added** — none is in use yet (see "Technology profile" above).
- **M15 — Agent Backlog & Feature-Driven Development Model** —
  `complete`. Not a rename of a placeholder — the first milestone added
  because a real gap existed. Establishes: a single, repository-native
  backlog (`BACKLOG-<NNN>`, `.project/backlog/` — not yet created, zero
  items exist) distinguished by a `kind:` field rather than split into
  separate product/project/agent/technical backlogs (`ADR-010`); the
  backlog/feature/task/RFC/SPEC boundary; feature-driven development as
  the preferred implementation approach, integrated with — not
  replacing — the existing lifecycle/loop (`SPEC-004`/`SPEC-006`); the
  central rule that discovery does not automatically become
  implementation scope; ambiguity/RFC/SPEC escalation criteria; and one
  new engineering-graph relationship type, `discovered-from`
  (`SPEC-007`, `engineering-graph.md`), for backlog-item provenance.
  `.project/specs/SPEC-010`, `.agent/instructions/backlog-and-feature-development.md`.
  **No backlog item created** — nothing has been implemented yet to
  discover or defer work from; the model governs the first real feature
  once one exists.
- **M16 — Agent Repository Operating Contract** — `complete`. Not a
  rename — added because a real gap existed: M01–M15's operating model
  was correct but not connected into one discoverable bootstrap sequence.
  A cold-start audit (tracing a fresh agent's path through
  `CLAUDE.md`/`AGENTS.md` against 6 concrete scenarios — new
  feature, exploration-only, mid-implementation discovery, conflicting
  ADR, new technology with no skill, Git completion) found **2 real
  gaps, not invented ones**: `CLAUDE.md` carried a stale, drifting
  duplicate of `AGENTS.md`'s checklist (including a leftover "once
  quality gates exist (M02)" conditional M11's cleanup pass missed
  because it only checked `AGENTS.md`'s copy) — fixed by trimming
  `CLAUDE.md` to a genuine short adapter with no restated checklist; and
  `.agent/instructions/repository-orientation.md` was unreferenced from
  the entry chain despite being purpose-built for it — fixed with one
  pointer from `AGENTS.md`. New: `SPEC-011` (the bootstrap sequence,
  mapped onto M01–M15's existing pieces by pointer, not restatement;
  confirms `SPEC-008`'s existing guidance-precedence hierarchy already
  covers what this milestone asked to define, so none was reinvented)
  and `.agent/instructions/agent-operating-contract.md` (the concise
  entry point, read first in a fresh session). **No new ADR** — this
  milestone connects and corrects discoverability, it makes no new
  architectural decision (same precedent as M11). **No new
  runtime/orchestrator/engine of any kind.**

## Currently active

Nothing beyond finishing M16's own validation pass. No open TASK/RFC/
RESEARCH/BACKLOG artifacts exist (none have been needed yet).

## Authoritative decisions

`ADR-001`–`ADR-006`, `ADR-008`, `ADR-009`, `ADR-010` — `accepted`, in force.
`ADR-007` — `superseded` by `ADR-008` (kept as historical record).
M06 through M12 introduced no new ADR — all are process/instruction
content (or, for M11, corrections to existing documentation) operating
within the existing architecture, not a change to a boundary, dependency
direction, or ownership decision. M13 introduced one new ADR (`ADR-009`
— the Git hook enforcement mechanism): a genuine new-tooling decision per
`change-management.md`, not a boundary/dependency-direction/ownership
change. M14 introduced no new ADR — it added a dated addendum to
`ADR-009` (the hook-management evaluation), reaffirming that decision
rather than making a new one. M15 introduced one new ADR (`ADR-010` —
single, repository-native backlog): a genuine decision between real
alternatives (one backlog vs. several; repository-native vs. external),
not a restatement of an existing one. M16 introduced no new ADR — same
category as M11: a consolidation/connection pass with corrections to
existing documentation, not a boundary/dependency-direction/ownership
decision.

## Blocked

Nothing.

## Next

Not yet defined — see "Roadmap position" above. Do not begin
implementation work (a package, app, server, or agent) without a
concrete, demonstrated need, and not without explicit approval — see
`../../.agent/instructions/implementation.md` ("stay inside the current
milestone").

## Open questions carried forward

None currently.
