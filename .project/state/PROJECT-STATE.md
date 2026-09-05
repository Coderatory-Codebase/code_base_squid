---
type: state
updated: 2026-09-05
---

# Project State

This file is a singleton, updated in place — read this first for "what's
going on," before opening any other artifact.

## Current phase

**M01-M25 are complete. M26 is active.** M26 was explicitly commissioned
after the user clarified that the repository must behave as an
agent-executable operating foundation for MERN/Next.js monorepo app
development, not mainly as after-the-fact records. The active work is
`SPEC-014`/`PLAN-005`/`ADR-015`/`ADR-016`/`SPEC-015`/`SPEC-016`/
`SPEC-017`/`PLAN-013`/`TRACE-024`/`SPEC-019`/`PLAN-014`/`TRACE-025`/
`PLAN-015`/`TRACE-026`/`SPEC-020`/`PLAN-016`/`TRACE-027`/`ARCH-001`/
`SPEC-021`/`PLAN-017`/`TRACE-028`/`SD-001`/`SPEC-022`/`PLAN-018`/
`TRACE-029`/`ENG-001`/`PLAN-019`/`TRACE-030`/`TASK-001`..`TASK-005`:
request routing, dual operating scope, Intake, corrected Discovery,
Specification, the Specification clarification/rework loop, and
feature-driven Decomposition that feeds the existing backlog,
Architecture as an evidence-backed design-decision phase, Feature-scoped
System Design with architectural consistency checks, Feature-scoped
Engineering Decomposition into Work Packages plus executable Tasks,
dual-track discovery and delivery, pre-implementation artifact
discipline, current architecture in `architecture.yaml`, and the first
real stack skill for MERN/Next.js
vertical slices.

The seed application remains `apps/test/web` + `servers/test/api`. It is
the reference app used to prove the foundation, not the whole repository.
Its project/product brain is `.project/projects/test/PROJECT.md`; the
repository/foundation brain remains `AGENTS.md`, `.agent/`,
`architecture.yaml`, and repository-level `.project/` artifacts.
See `../../architecture.yaml` -> `current_architecture` and
`operating_model` before reading roadmap history.

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
pattern as M10/M11 before them. **M15 through M25 all have no original
placeholder to rename** — each was added because a real gap existed or
real feature work was commissioned (M15: no work-management model for
actual feature implementation; M16: the existing operating model wasn't
connected into one discoverable bootstrap sequence; M17: no governance
existed for how technology-specific skills should enter the ecosystem;
M18: no durable way existed to reconstruct what an agent actually did on
a piece of work; M19: M18's own first trace showed the model recorded
outcomes but not how the operating model was actually executed step by
step; M20: a discovery could be noticed in a trace without ever
producing an explicit, actionable outcome; M21: the user asked for the
first real application, then redirected to strengthen the operating
model first — no request classification, no explicit planning-required
gate, human-escalation triggers scattered, no agent-agnostic manual/UI
verification rule; M22: the Authentication feature itself, resumed once
M21 was approved, with the user's "go ahead" letting the strengthened
operating model derive its own process — classification, ADR-012,
PLAN-002, implementation, backlog capture, validation, and recording —
without the user re-stating any of it; M23: M22 itself then exposed that
the operating model had no explicit foundation/project separation —
`apps/web`/`servers/api` sat directly under the global root with no
project boundary, contradicting this repository's own stated purpose of
scaffolding _future_ projects; M24: a system-level audit of the whole
operating model, using M21–M23 plus the real Authentication/Rate-
Limiting/Profile work and its own `TRACE-009`/`010` audit as behavioral
evidence rather than assuming correctness because validation was green
— found the model mostly already worked as designed, and closed four
real, evidence-grounded gaps: no named "conformance review" concept, no
Security/Accessibility REVIEW dimensions, no explicit cross-project bar
for skill creation, no explicit foundation-change-authorization rule;
M25: a second, deliberately adversarial audit of the same model,
explicitly instructed to treat M22–M24 as evidence _against_ the model
rather than proof of it, covering a larger real-evidence base (adding
`BACKLOG-006`'s rate limiting, the Profile audit/remediation, and
Account Security Settings/`ADR-014`) — investigated 20 specifically
suspected failure areas and found most were already fixed or never
real, closing two narrow, genuine gaps: tooling guidance was already in
`SPEC-012`'s scope but not stated plainly, and a real instance of a
framework-specific factual question being mistaken for a
principle-answerable one), not because a roadmap slot needed filling.
M26 is the current repair milestone. It does not add an application
feature; it realigns the operating model so future features are routed,
analyzed, planned, implemented, validated, and recorded in the intended
order. Detailed milestone history now lives in
`.project/roadmap/MILESTONES.yaml`; `architecture.yaml` is current
architecture first.

## Technology profile

Populated for the first time at M22 (`ADR-012`); paths corrected at M23
(`ADR-013`) — the technologies themselves are unchanged:

- **`apps/test/web`**: TypeScript, Next.js 16 (App Router, Turbopack),
  React 19.
- **`servers/test/api`**: TypeScript, Node.js, Express 5, Mongoose 9
  (MongoDB), `jsonwebtoken`, `bcryptjs`, `zod`, `cookie-parser`, `cors`,
  `helmet`.
- **Testing**: `vitest` (repo-wide, unchanged), `supertest` +
  `mongodb-memory-server` (`servers/test/api`, hermetic API tests
  against a real, in-memory MongoDB).
- **Dev tooling**: `tsx` (`servers/test/api` dev server).
- **Stack skill**: `.agent/skills/mern-nextjs-vertical-slice/SKILL.md`
  captures reusable guidance for seed-app features spanning Next.js,
  Express, MongoDB/Mongoose, TypeScript validation/contracts, tests, and
  manual UI verification.

`agents/` and `packages/` remain `not-yet-created` — no package exists
yet (nothing meets the demonstrated-cross-deployable-reuse bar,
`packages.md`), and no agent runtime is in scope. See
`.project/specs/SPEC-008-engineering-standards-design-and-practice.md`
→ "Project technology profile."

**Distinct from technology skills** (`.agent/skills/`): this section
records what this project has actually _adopted_ — a fact about current
repository state. A technology skill records reusable _ecosystem_
guidance that could apply to any project using that technology. Adopting
something here doesn't automatically produce a skill, and a skill
existing wouldn't mean it's adopted here — see
`.project/specs/SPEC-012-technology-ecosystem-and-guidance-governance.md`
→ "Relationship to the project technology profile." **No technology
skill was created at M22** — none of the choices above rose to durable
ecosystem guidance; they're this project's own implementation choices
(`ADR-012`).

## Backlog

Sixteen real backlog items exist — one table file,
`.project/backlog/BACKLOG.md` (single-table format since M23,
originally one file per item at M22; `Scope`/`Owner` columns added at
M26, `Level`/`Parent` columns added by `TRACE-026`): `BACKLOG-001` (email
verification), `BACKLOG-002` (password reset/account recovery),
`BACKLOG-003` (OAuth/social login), `BACKLOG-005` (frontend component/
E2E test coverage) — from M22's own scoping, `captured`; `BACKLOG-006`
(rate limiting/brute-force protection) — `completed`, implemented
post-M23 (`TRACE-007`); `BACKLOG-004` (server-side refresh-token
revocation/session management) — `completed`, implemented via the
account security settings feature (`TRACE-012`/`ADR-014`); `BACKLOG-007`
(auth audit/security logging), `BACKLOG-008` (MFA/2FA/passkeys) — from
M23's corrective review of M22, `captured`; `BACKLOG-009` (client-IP
detection behind the Next.js proxy, for correct rate limiting) —
discovered while implementing `BACKLOG-006`, `captured`; `BACKLOG-010`
is completed (roadmap history extraction); `BACKLOG-011` remains captured
for operating-layer validators; `BACKLOG-012` is completed (explicit
multilevel backlog table migration); and `BACKLOG-013` through
`BACKLOG-016` are ready project/product rows produced by `DECOMP-001`:
one personal-notes epic and three personal-notes Features. Model and
conventions:
`.project/specs/SPEC-010-agent-backlog-and-feature-driven-development.md`
→ "Persistence" (single-table format, added M23).

## Traces

Twenty-eight real traces exist (`.project/traces/`): `TRACE-001` (M18's own
execution, assembled mostly near the end), `TRACE-002` (M19's own
execution — the first written progressively, checkpoint by checkpoint),
`TRACE-003` (M20's own execution — also progressive; honestly records
zero genuine discoveries rather than manufacturing a backlog item),
`TRACE-004` (M21's own execution — progressive, and the first to include
a real, executed cold-start simulation as its own checkpoint rather than
only a narrative claim), `TRACE-005` (M22's own execution — the first to
trace a real, multi-technology application feature; records five
genuine implementation-time discoveries, all resolved `needed now`), and
`TRACE-006` (M23's own execution — the first to carry an explicit
`FOUNDATION`/`PROJECT`/`BOTH` classification throughout, and the first
to include a corrective review of a prior milestone's own real output,
finding and fixing two genuine record-keeping gaps M22 left behind), and
`TRACE-007` (`BACKLOG-006`'s implementation — the first trace of a
single selected backlog item rather than a numbered milestone;
demonstrates the model correctly refusing to silently pick which
backlog item counted as "the next feature," and correctly declining to
guess a security-relevant proxy-trust setting instead of implementing it
speculatively), `TRACE-008` (the user profile feature — asked for the
one genuinely ambiguous thing, what "profile" means when the `User`
model has no fields to build one from, rather than guessing a scope),
`TRACE-009` (a genuine audit trace — cold-start re-inspection of
`TRACE-008`'s own output, refusing to assume correctness because
validation was green; found real gaps validation couldn't catch), and
`TRACE-010` (the approved remediation — every finding resolved via
already-existing rules with zero human escalation needed, including one
deliberate, reasoned decision _not_ to fix something the audit had
flagged as borderline), `TRACE-011` (M24's own execution — a
system-level, evidence-based audit of the operating model itself,
including a real 20-scenario cold-start walkthrough and a reflexive
conformance check applying the very mechanism this milestone
introduced to its own claims), and `TRACE-012` (account security
settings — the third real feature; correctly resolved a genuine
architecture decision — a server-side session store, `ADR-014` — as a
necessary dependency of scope the user had already selected, rather
than re-asking or silently building it undocumented), and `TRACE-013`
(M25's own execution — a second, deliberately adversarial audit of the
operating model, including a root-cause classification for every real
M22–M24 failure and 13 genuine cold-start scenario walkthroughs; its
most consequential finding is negative — most suspected gaps were
already fixed or never real — stated honestly rather than manufactured
into a longer report), `TRACE-014` (personal notes), `TRACE-015`
(M26 operating-model realignment), `TRACE-016` (roadmap history
extraction), `TRACE-017` (dual operating-scope clarification),
`TRACE-018` (Intake phase implementation, superseded by the correction),
`TRACE-019` (real Intake execution producing `REQ-001`), `TRACE-020`
(Intake correction removing the standalone CLI/contract framework),
`TRACE-021` (Discovery phase implementation and real Discovery execution
producing `DISC-001`), `TRACE-022` (Discovery correction expanding Phase
2 from uncertainty capture into lens-based current-state, gap/capability,
and synthesis analysis), and `TRACE-023` (Specification phase
implementation and real draft Specification execution producing
`SPEC-018`), and `TRACE-024` (Specification clarification/rework
correction, preserving the initial blocked `SPEC-018`, reworking
`DISC-001` first after clarification, and revising `SPEC-018` to
`ready-for-decomposition` for the clarified baseline), `TRACE-025`
(initial Decomposition lifecycle phase, producing `DECOMP-001` from ready
`SPEC-018` while stopping before Architecture and implementation
planning), and `TRACE-026` (Phase 4 feature-driven Decomposition rework,
completing `BACKLOG-012` and representing `DECOMP-001` output as
`BACKLOG-013` through `BACKLOG-016`), `TRACE-027` (Phase 5
Architecture, producing `ARCH-001` from `DISC-001`, `SPEC-018`,
`DECOMP-001`, and backlog Features while selecting reuse of the existing
personal-notes architecture and stopping before Feature-scoped System
Design), and `TRACE-028` (Phase 6 Feature-scoped System Design, producing
`SD-001` for exactly `BACKLOG-014` while stopping before Engineering
Decomposition).
None is a retroactive trace of M01-M17, which predate the
model and aren't traced.
Model and conventions:
`.project/specs/SPEC-013-agent-execution-traceability.md`. Observational
only — never a substitute for the ADR/SPEC/BACKLOG/PLAN/REVIEW that
actually holds a decision, and not created for most interactions
(proportional to work significance).

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
- **M17 — Technology Ecosystem & Guidance Governance** — `complete`. Not
  a rename — added because a real gap existed: M12 established that
  technology skills exist and how they're structured, but not who
  decides one should exist or when creating one needs a human. This
  milestone answers exactly those questions and nothing else: the
  ecosystem-vs-project boundary (a project's implementation choice never
  silently becomes ecosystem policy); explicit skill creation criteria
  and non-criteria (skill proliferation is a real cost, not a formality
  to wave through); a hard human-approval requirement before any durable
  technology skill is created or materially changed (routine
  implementation autonomy is unaffected — only _shared, durable_
  guidance changes need a human); conflict handling (project decision >
  skill > skill vs. stale-skill); and version-sensitivity/authoritative-
  source/maintenance principles, several of which `SPEC-008` already
  covered and are pointed to rather than restated. `.project/specs/SPEC-012`,
  `.agent/instructions/technology-guidance.md`. **No technology skill
  created** — zero technologies are adopted (see "Technology profile"
  above, now clarified as distinct from what a skill represents). **No
  new ADR** — same category as M07/M12/M16: process/instruction content
  built on already-decided architecture, not a new boundary/dependency-
  direction/ownership decision.
- **M18 — Agent Execution Traceability & Repository Operating Record** —
  `complete`. Not a rename — added because a real gap existed: nothing
  recorded how a piece of agent work was actually done (what was
  requested, decided, implemented, validated) in a durable, auditable
  way. Establishes the `TRACE-<NNN>` artifact type — **observational,
  never authoritative**: it references the ADR/SPEC/BACKLOG/PLAN/REVIEW/
  Git records that actually hold a decision, never duplicates them;
  proportional to work significance (most interactions need none);
  decision provenance distinguishes human/agent/existing-rule/external-
  guidance/validation-result as the source of every consequential
  decision; integrity rules forbid claiming validation, approval, or a
  change that didn't happen. `TRACE` joins `SPEC-007`'s graph node types
  — no new relationship type was needed, the existing vocabulary already
  covers "a trace references X." `.project/specs/SPEC-013`,
  `.agent/instructions/traceability.md`. **One real trace was created,
  not left hypothetical**: `TRACE-001` records this milestone's own
  execution — a genuine worked example, not a retroactive trace of
  M01–M17 (which predate the model and are explicitly not traced). **One
  new ADR** (`ADR-011` — repository-native trace persistence, same
  reasoning as `ADR-010`): a genuine decision between real alternatives
  (repository-native vs. an external telemetry/observability system).
- **M19 — Operating-Model Execution Traceability** — `complete`. Not a
  rename — added because M18's own first trace (`TRACE-001`) exposed a
  real limitation: it recorded _what happened overall_ but not _how_ the
  lifecycle/loop/governance flows were actually executed step by step.
  Adds a concrete "Checkpoint structure" (stage/status, actions,
  observations, constraints, discoveries, decisions + source/status,
  human input, scope impact, validation, failures/remediation, outcome,
  references — all optional per checkpoint) and a hard "Progressive
  recording" rule — a trace is written _while_ the work happens, not
  reconstructed afterward — to the **same** `TRACE` artifact type;
  no second trace type, no new lifecycle. `.project/specs/SPEC-013`
  amended (blockquote + two new sections), `.agent/instructions/traceability.md`
  updated. **`TRACE-002` is the real proof**: written checkpoint by
  checkpoint during this milestone's own execution, including an
  honestly-recorded real `format:check` failure and its fix (not
  smoothed into a bare "passed"). **No new ADR** — an addition to
  `SPEC-013`'s existing model, not a new decision between real
  alternatives (same category as M14's `ADR-009` addendum).
- **M20 — Continuous Discovery & Backlog Capture** — `complete`. Not a
  rename — added because a real gap existed: a trace could record that a
  discovery happened without the discovery ever producing an explicit,
  actionable outcome — meaningful future work could be noticed and then
  quietly forgotten. Amends `SPEC-010` (already the backlog/feature
  authority — no new SPEC): discovery made explicitly cross-cutting
  (any lifecycle stage, captured as it happens, not only ANALYZE/
  IMPLEMENT or end-of-feature); a five-outcome "Discovery decision
  model" (needed now / decision required / future work / already
  tracked / rejected) unifying pieces that already existed scattered
  across the spec; an expanded, itemized "Meaningful discovery
  threshold"; an explicit "Discovery/backlog reconciliation" completion
  check folded into `development-lifecycle.md`'s existing "Work
  complete" criteria (one bullet, not a new stage). `SPEC-013` gained one
  cross-reference (a checkpoint's `discoveries` field should carry the
  five-outcome resolution). **`TRACE-003` is the real proof** — and,
  honestly, recorded **zero genuine discoveries** during this milestone's
  own execution rather than manufacturing a `BACKLOG-<NNN>` to
  demonstrate the mechanism; `.project/backlog/` remains uncreated. **No
  new ADR** — same category as M14/M16/M19: an addition to an
  already-decided model, not a new decision between real alternatives.
- **M21 — Autonomous Agent Execution & Technology Discovery** —
  `complete`. Not a rename — added when the user redirected before the
  first real application: strengthen the operating model so an agent can
  derive request classification, planning necessity, human-escalation
  points, and technology/skill handling from the repository alone. A
  cold-start audit (same discipline as `M16`'s, one new scenario) found
  most of the requested behavior already existed and needed only
  connecting: feature slicing (`SPEC-010`), missing-skill handling
  (`technology-guidance.md`/`SPEC-012`), continuous discovery
  (`SPEC-010`, M20), progressive checkpoint-structured tracing
  (`SPEC-013`), engineering-lens selection (`SPEC-008`), Git governance
  (`SPEC-009`). **Four genuine gaps fixed**: no request-classification
  step (fixed — `SPEC-011` → "Request classification"); no explicit
  "is planning required" gate (fixed —
  `development-lifecycle.md` → "When planning is required"); human-in-
  the-loop escalation triggers discoverable only by reading four specs
  in full (fixed — `SPEC-011` → "Human-in-the-loop", a consolidated
  index by reference, no restatement); no agent-agnostic statement of
  manual/UI verification — it existed only as a Claude-Code-specific
  instruction, a real `ADR-006` gap (fixed — `validation.md`, one
  bullet). All four are amendments — **no new SPEC, no new ADR** (same
  category as M16/M19/M20: connective/clarifying content on
  already-decided architecture, not a new decision between real
  alternatives). `TRACE-004` (this milestone's own execution) is the
  real proof, and the first trace to include an actually-executed
  cold-start simulation ("Build a new authentication feature using the
  application's current technology stack") as its own checkpoint,
  confirming all 20 elements the milestone's completion criteria named
  are reachable without the user naming a process — including a
  correctly-surfaced human-clarification point (the technology profile
  is still empty, so "current technology stack" doesn't resolve alone),
  recorded as a pass, not a gap. **No backlog item created** — no
  genuine, independent, out-of-scope discovery occurred;
  `.project/backlog/` remains uncreated. The Authentication feature
  itself was explicitly deferred, not built, per this milestone's own
  constraint.
- **M22 — Authentication Feature (first application)** — `complete`.
  The repository's first real application feature, and the first
  milestone with real `apps/`/`servers/` source. `apps/web` (Next.js 16
  App Router, React 19) and `servers/api` (Express 5, Mongoose 9/
  MongoDB) — two independent deployables (`ADR-012`), matching "MERN +
  Next.js" as the user stated it. JWT access (~15 min) + refresh (~7
  day) tokens in `httpOnly`/`SameSite=Lax` cookies, delivered
  same-origin via a Next.js rewrite proxy (`/api/**` → `servers/api`) to
  avoid cross-origin cookie/CORS complications in local dev. Core scope
  only, per the user's own earlier confirmation: register, login,
  logout, current-user, refresh, route protection
  (`/dashboard` redirects unauthenticated). **One new ADR** (`ADR-012` —
  the stack/architecture decisions: deployable split, session strategy,
  cookie-delivery mechanism, contract placement, password hashing, and
  the accepted no-server-side-revocation limitation) and **one new
  PLAN** (`PLAN-002` — acceptance criteria, implementation steps). **Five
  real backlog items** — the first this repository has had —
  captured for genuinely deferred scope (email verification, password
  reset, OAuth, refresh-token revocation, deeper frontend test
  coverage), not built and not dropped. Verified by `servers/api`'s
  `supertest`/`mongodb-memory-server` test suite (10 tests, all
  acceptance criteria) and a real manual pass through both dev servers
  (register → dashboard → logout → redirect, duplicate-email rejection,
  bad-login rejection, refresh) — test data cleaned up and dev servers
  stopped afterward. Five genuine implementation-time discoveries
  surfaced and were resolved directly (`bcrypt`→`bcryptjs` for
  native-build friction, pnpm 11 build-script approval, two real
  TypeScript errors, and — notably — disabling `next dev`'s
  auto-generated nested `AGENTS.md`/`CLAUDE.md`, which would have
  directly conflicted with this repository's own root-level convention).
  This milestone was itself produced by M21's strengthened operating
  model in response to a bare "go ahead" — see `TRACE-005`.
- **M23 — Foundation/Project Separation & Autonomous Feature Execution
  Model** — `complete`. Not a rename — added when M22 (the first real
  feature) exposed that the operating model had no explicit separation
  between the reusable foundation and an application/project consuming
  it. **One new ADR** (`ADR-013` — `apps/`/`servers/`/`agents/` become
  project-owned boundaries: `apps/<project>/<app>`, never
  `apps/<app>` directly) — a genuine decision between real alternatives,
  same category as `ADR-009`–`ADR-012`. M22's application corrected in
  place: `apps/web` → `apps/test/web`, `servers/api` → `servers/test/api`
  (`test` — the user's own answer when asked, not guessed), verified
  with a full `pnpm install` + `pnpm run validate` pass. Everything else
  is amendment, not a new decision (same category as M16/M19/M20/M21):
  `SPEC-010` gained "Phase determination" (feature → phases → tasks) and
  a corrected single-file backlog persistence model
  (`.project/backlog/BACKLOG.md`, was five per-item files); `SPEC-008`
  gained "Use vs. build vs. adopt"; `SPEC-012` gained "Implementation-
  area skills" (the same governance already built for technology
  skills, generalized); `SPEC-011` gained a project/foundation boundary
  check and a `FOUNDATION`/`PROJECT`/`BOTH` trace classification;
  `SPEC-013` gained a matching checkpoint field. **A genuine corrective
  review of M22** (not a blind re-approval) found two real gaps M22
  itself should have caught — `AGENTS.md`'s stale "authentication"/"web
  app" non-goals and `ARTIFACT-TYPES.md`'s stale backlog-not-yet-created
  language — both fixed; confirmed `README.md`'s stale "M01–M14" maturity
  section is **not** a gap (`repository-orientation.md` already
  designates `architecture.yaml`/`PROJECT-STATE.md` as authoritative
  over it by design). Three genuinely new backlog items surfaced by this
  review (`BACKLOG-006`..`008` — rate limiting, audit logging, MFA/2FA),
  not manufactured. `TRACE-006` (this milestone's own execution)
  includes a real 10-scenario cold-start run, all reachable without the
  user naming a process. The Authentication feature's own behavior is
  unchanged — this milestone corrected structure and governance around
  it, not its functionality.
- **M24 — Autonomous Engineering Operating Model** — `complete`. Not a
  rename — commissioned to inspect the operating model as a **system**
  (not file-by-file), using M21–M23 plus the real Authentication/Rate-
  Limiting/Profile work and its own audit (`TRACE-009`/`010`) as
  behavioral evidence, explicitly not assuming correctness because
  validation was green. **Central finding**: the target request-to-
  completion flow was already mapped, almost line for line, onto
  existing sections, and demonstrably worked in practice —
  `TRACE-007` correctly refused to silently pick a backlog item and
  asked; `TRACE-008` correctly escalated its one genuine ambiguity and
  proceeded autonomously otherwise; `TRACE-010` resolved every audit
  finding via already-existing rules with zero escalation needed,
  including one case where the correct call was declining a proposed
  fix. **Four real, evidence-grounded gaps closed, none manufactured**:
  (1) no named "conformance review" concept distinguishing "recorded a
  process" from "independently verified" — `TRACE-009` was itself the
  undocumented precedent, now named in `SPEC-013`/`development-
lifecycle.md`; (2) Security and Accessibility were not named `REVIEW`
  dimensions despite being core `SPEC-008` principles, plausibly
  contributing to the exact defects `TRACE-009` later caught; (3)
  `SPEC-012`'s "repeated use" skill-creation criterion didn't state the
  cross-project bar `TRACE-009`/`010` had to derive by judgment, now
  explicit; (4) foundation-change authorization was demonstrated by
  consistent precedent across 6+ milestones but never stated as a rule,
  now an explicit `SPEC-011` subsection. **No new SPEC, no new ADR**
  (all four are amendments to already-active SPECs, same category as
  M16/M19/M20/M21/M23 — connective/clarifying, not a new decision
  between real alternatives), **no new skill** (re-confirmed, not
  re-decided — this project's technologies still don't clear the now-
  explicit cross-project bar), **no application code, no backlog item**
  (no genuine out-of-scope discovery occurred — this milestone's
  findings were the deliverable itself). `TRACE-011` includes a real
  20-scenario cold-start walkthrough (3 scenarios specifically
  exercising the 4 closed gaps) and a reflexive conformance check —
  applying this milestone's own new mechanism to verify its own claims
  before reporting them.
- **M25 — Autonomous Engineering Operating Model Audit** — `complete`.
  Not a rename — a **deliberately adversarial** second audit,
  explicitly instructed to treat M22–M24 (including work M24 itself
  hadn't seen yet: rate limiting, the Profile remediation, Account
  Security Settings) as evidence _against_ the model, with 50 stated
  acceptance criteria and an explicit prohibition on "checklist
  explosion" or manufacturing gaps to look thorough. Investigated 20
  specifically suspected failure areas against real repository evidence
  (not memory of it) — most were either already fixed by M23/M24 (and
  now _evidenced_ working via `TRACE-012`'s own conformance-review
  checkpoint, not just documented) or were never real gaps (e.g. the
  suspected `domains/` placement problem: `architecture.yaml` already
  explicitly documents `servers/<project>/api/domains/*`, matched
  exactly). **Two genuine, narrow gaps closed**, both connective
  clarifications to the already-active `SPEC-012`, not new mechanisms:
  (1) tooling guidance (lint/test/CI/build) was already inside
  `SPEC-012`'s stated scope but not said plainly enough to be obvious
  on a read-through; (2) a real instance (`TRACE-009`'s Mongoose
  `runValidators` finding) of a framework-specific _factual_ question
  being mistaken for a technology-neutral _principled_ one the
  missing-guidance flow could answer — now distinguished explicitly.
  Ran 13 genuine cold-start scenario walkthroughs with no pre-written
  recipe (trivial bugfix, new CRUD feature, MFA, Redis adoption,
  UI-heavy dashboard, API-heavy reporting, cross-project promotion,
  project-local convention, ambiguous real-time-notification tech
  choice, vendor-replacement approval, backlog discovery, no-backlog
  typo fix, multi-lens image upload) — all 13 resolved to a specific,
  defensible answer; the two closest calls (image storage architecture,
  chart-library choice) both correctly resolved to "proceed with the
  simplest adequate default, name the trade-off" rather than asking
  something already within the model's authority to decide.
  Deliberately declined one plausible-sounding fix (an explicit
  "adjacent-capability scan" step) after concluding it would be real
  checklist explosion for a lens/mechanism that already exists and has
  already produced four real backlog items. **No new SPEC, no new ADR,
  no new skill, no application code, no backlog item.** `TRACE-013`'s
  most consequential finding is stated honestly as a negative result:
  the operating model built at M21/M23/M24 is, on this harder scrutiny,
  already doing most of what M25 was asked to prove.

## Currently active

M26 operating-model realignment is active. Its first slice is complete
(`SPEC-014`, `PLAN-005`, `ADR-015`, `TRACE-015`): request routing,
dual-track discovery/delivery, pre-implementation artifact discipline,
current architecture in `architecture.yaml`, first MERN/Next.js
vertical-slice skill, and corrected report placement. Its second slice is
also complete (`PLAN-006`, `TRACE-016`, `BACKLOG-010`): detailed
milestone history moved to `.project/roadmap/MILESTONES.yaml`. Its third
slice is complete (`ADR-016`, `PLAN-007`, `TRACE-017`): the operating
model now has an explicit repository/foundation brain, a project/product
brain for `test`, and `Scope`/`Owner` backlog columns. Its fourth slice
is corrected and complete (`SPEC-015`, superseded `PLAN-008`,
`PLAN-009`, `TRACE-018`, `TRACE-020`): Phase 1 Intake is an
agent-executed governed workflow that creates `REQ-*` artifacts and stops
before Discovery. The real demonstration artifact is
`.project/requirements/REQ-001-add-personal-notes-functionality-to-the-test-application.md`,
with trace `TRACE-019`. It has since been consumed by Discovery in
`DISC-001`, then by Specification in `SPEC-018`, then decomposed in
`DECOMP-001`, then architected in `ARCH-001`; Implementation Planning has
not been executed and implementation has not started. No application
feature is currently selected. This Intake
demonstration is separate from the historical personal-notes feature
implementation recorded under `TRACE-014`/`PLAN-004`; it does not
authorize or imply any new app work. Its fifth slice is corrected and
complete (`SPEC-016`,
`PLAN-010`, `PLAN-011`, `TRACE-021`, `TRACE-022`): Phase 2 Discovery is
an agent-executed governed workflow that consumes `REQ-*`, investigates
the requested outcome through relevant lenses, establishes current
state, identifies gaps and needed capabilities, creates `DISC-*`, and
stops before Specification. The real Discovery artifact is
`.project/discovery/DISC-001-personal-notes-test-application.md`, now
corrected to record dynamic lens selection, lens findings, current-state
evidence, gap/capability analysis, decisions needed, and synthesis.
Discovery initially completed with status `needs-clarification` because
the requested notes capability appeared already present in the current
seed app, but the intended delta was not established. Its sixth slice is
complete (`SPEC-017`, `SPEC-018`, `PLAN-012`, `TRACE-023`): Phase 3
Specification is an agent-executed governed workflow that consumes
`DISC-*`, transforms material Discovery findings into explicit testable
requirements or unresolved blockers, creates ordinary `SPEC-*` artifacts,
and stops before Decomposition. The real Specification artifact is
`.project/specs/SPEC-018-personal-notes-test-application.md`. Its seventh
M26 slice is complete (`PLAN-013`, `TRACE-024`): Specification now has a
clarification/rework path that preserves the initial blocked
`SPEC-018`, routes the supplied product clarification back through
Discovery, reworks `DISC-001` first, and then revises `SPEC-018` to
`active` with readiness `ready-for-decomposition` for the clarified
baseline. Its eighth M26 slice is complete (`SPEC-019`, `PLAN-014`,
`TRACE-025`): Phase 4 Decomposition is an agent-executed governed workflow
that consumes a ready `SPEC-*`, creates a `DECOMP-*` product/system scope
map, accounts for active requirements, and stops before Architecture. Its
ninth M26 slice is complete (`PLAN-015`, `TRACE-026`): Phase 4 was
reworked to be feature-driven, complete `BACKLOG-012`, and represent the
real `SPEC-018` decomposition through existing backlog rows `BACKLOG-013`
through `BACKLOG-016`. The real Decomposition artifact is
`.project/decomposition/DECOMP-001-personal-notes-baseline.md`.
Its tenth M26 slice is complete (`SPEC-020`, `PLAN-016`, `TRACE-027`,
`ARCH-001`): Phase 5 Architecture is an agent-executed governed workflow
that consumes Discovery evidence, an approved Specification, a ready
Decomposition, and backlog Feature rows; distinguishes current technical
state from target architecture; maps Features to architectural
responsibilities; records evidence-backed decisions, trade-offs, and open
decisions; and stops before Feature-scoped System Design. The real
Architecture artifact is
`.project/architecture/ARCH-001-personal-notes-baseline.md`.
Its eleventh M26 slice is complete (`SPEC-021`, `PLAN-017`, `TRACE-028`,
`SD-001`): Phase 6 System Design is an agent-executed governed workflow
that consumes exactly one selected eligible backlog Feature plus the
relevant Specification, Decomposition, and high-level Architecture
baseline; creates a concrete behavioral and interaction design; performs
an architectural consistency check; and stops before Engineering
Decomposition. The real System Design artifact is
`.project/system-design/SD-001-manage-owned-personal-notes.md`.
Its twelfth M26 slice is complete and corrected (`SPEC-022`, `PLAN-018`,
`TRACE-029`, `ENG-001`, corrected by `PLAN-019`/`TRACE-030`): Phase 7
Engineering Decomposition is an agent-executed governed workflow that
consumes exactly one approved Feature System Design, creates Engineering
Work Packages, derives executable `TASK-*` artifacts, records
dependencies, affected areas, verification expectations, and readiness for
Implementation, while stopping before source changes. The real
Engineering Decomposition artifact is
`.project/engineering/ENG-001-manage-owned-personal-notes.md`; executable
Tasks are `.project/tasks/TASK-001-web-notes-experience.md` through
`.project/tasks/TASK-005-notes-verification-readiness.md`. Tasks are
created but not executed, and implementation has not started.

Discovery is reworked and complete after clarification. Specification is
active with readiness `ready-for-decomposition` for the clarified
baseline only.
Decomposition is complete with readiness `ready-for-architecture` for
`DECOMP-001`. The resulting project/product backlog hierarchy is
`BACKLOG-013` (epic) with `BACKLOG-014`, `BACKLOG-015`, and `BACKLOG-016`
as ready Features.

Architecture is complete with readiness for Feature-scoped System Design
for `ARCH-001`. The selected target
architecture reuses the existing `test` project-owned web/API, notes
domain, auth/session, owner-scoped data-access, and persistence
boundaries.

System Design is complete with readiness
`ready-for-engineering-decomposition` for `SD-001` / `BACKLOG-014`.
Architectural assessment is compatible and Architectural Impact is none.

Engineering Decomposition is complete with readiness
`ready-for-implementation` for `ENG-001` / `SD-001` / `BACKLOG-014`.
The readiness is valid only after the executable Task layer
`TASK-001`..`TASK-005`; implementation has not started.

Previously: `BACKLOG-006` (rate limiting) was completed post-M23 —
see `TRACE-007`. A user profile feature (editable `displayName`,
`/profile` page) was then built directly from a user request — see
`TRACE-008` — then audited (`TRACE-009`) and remediated (`TRACE-010`):
`runValidators` defense-in-depth, deduplicated route error handling,
`PATCH /me` rate limiting (extends `BACKLOG-006`'s completed scope,
not a new item), `<Link>` navigation, and `aria-live` accessibility
fixes. M24 then system-audited the operating model itself (see
"Completed") — no application work resulted. After M24, account
security settings (change password + session management) was built
directly from a user request — see `TRACE-012`/`ADR-014`/`PLAN-003`;
closes `BACKLOG-004`. M25 then re-audited the operating model a second
time, adversarially (see "Completed") — no application work resulted.
After M25, a personal notes feature (create/view/edit/delete, scoped to
the authenticated user) was built directly from an explicit,
project-and-deployable-naming request — see `TRACE-014`/`PLAN-004`; a
new `servers/test/api/src/domains/notes/*` domain (model/contracts/
service/routes, mirroring the existing `auth`/`session` domain shape)
and a new `apps/test/web/src/app/notes/*` page/component plus
`lib/notes-client.ts`, verified by 20 new tests (route-level CRUD,
cross-user ownership isolation returning `404`, and a persistence-layer
`runValidators` defense-in-depth test) and a real manual pass through
both dev servers and a live MongoDB (register two users, create/list/
get/update/delete notes, confirm cross-user `404`s on read/update/
delete, confirm unauthenticated `401`s, confirm the real Next.js
same-origin proxy and `/notes` redirect-when-unauthenticated behavior).
One real discovery resolved during REVIEW, not left for later: the new
mutating routes (`POST`/`PATCH`/`DELETE /api/notes*`) initially had no
rate limiting, inconsistent with the existing "every mutating
authenticated route gets one" convention `TRACE-010` established for
`PATCH /me` — fixed by reusing `auth.rate-limit.ts`'s existing
`createProfileRateLimit` factory, not a new decision. No new ADR (a
straight analogy to the existing `Session`-record pattern, not a new
architectural decision) and no new backlog item (the feature's own
frontend components fall under `BACKLOG-005`'s already-existing scope,
noted there rather than duplicated; genuinely speculative adjacent
capabilities — search, tagging, sharing, export, pagination — were
considered and explicitly not backlogged, consistent with M20's/M25's
precedent of not manufacturing items without a concrete signal of
need). Eight `captured` `BACKLOG` items remain (`BACKLOG-001`..`003`,
`005`, `007`..`009`, `011`) — none selected for application
implementation. Not proceeding to another application feature without
explicit instruction.

## Authoritative decisions

`ADR-001`–`ADR-006`, `ADR-008`, `ADR-009`, `ADR-010`, `ADR-011` —
`accepted`, in force. `ADR-007` — `superseded` by `ADR-008` (kept as
historical record). M06 through M12 introduced no new ADR — all are
process/instruction content (or, for M11, corrections to existing
documentation) operating within the existing architecture, not a change
to a boundary, dependency direction, or ownership decision. M13
introduced one new ADR (`ADR-009` — the Git hook enforcement mechanism):
a genuine new-tooling decision per `change-management.md`, not a
boundary/dependency-direction/ownership change. M14 introduced no new
ADR — it added a dated addendum to `ADR-009` (the hook-management
evaluation), reaffirming that decision rather than making a new one. M15
introduced one new ADR (`ADR-010` — single, repository-native backlog):
a genuine decision between real alternatives (one backlog vs. several;
repository-native vs. external), not a restatement of an existing one.
M16 and M17 introduced no new ADR — both are process/instruction/
governance content built on already-decided architecture (same category
as M07/M11/M12), not a boundary/dependency-direction/ownership decision.
M18 introduced one new ADR (`ADR-011` — repository-native trace
persistence): the same category of genuine decision as `ADR-010`,
between real alternatives (repository-native vs. an external
telemetry/observability system). M19 introduced no new ADR — same
category as M14's `ADR-009` addendum: an addition to `SPEC-013`'s
existing model (a checkpoint structure, a progressive-recording rule),
not a new decision between real alternatives. M20 introduced no new ADR
— same category: an addition to `SPEC-010`'s existing model (a
discovery decision procedure, a completion check), not a new decision
between real alternatives. M21 introduced no new ADR — same category:
`SPEC-011`/`development-lifecycle.md`/`validation.md` amendments
(a classification taxonomy, a planning gate, a consolidated
human-in-the-loop index, one agent-agnostic validation bullet), not a
new decision between real alternatives. **M22 introduced one new ADR**
(`ADR-012` — MERN + Next.js stack and authentication architecture): a
genuine decision between real alternatives (deployable split, session/
cookie strategy, contract placement), same category as
`ADR-009`/`ADR-010`/`ADR-011`, not a restatement of an existing one.
**M23 introduced one new ADR** (`ADR-013` — project-ownership boundary
for `apps/`/`servers/`/`agents/`): a genuine decision between real
alternatives (project-scoped vs. flat deployable paths), same category
as `ADR-009`–`ADR-012`, not a restatement of an existing one. **M24
introduced no new ADR** — same category as M16/M19/M20/M21: four
connective/clarifying amendments (a named conformance-review concept,
two new `REVIEW` dimensions, an explicit cross-project skill-creation
bar, an explicit foundation-change-authorization rule) to already-
active SPECs, none a new decision between real alternatives. **The
account security settings feature introduced one new ADR** (`ADR-014` —
server-side session record for refresh tokens): a genuine decision
between real alternatives (stay stateless vs. a `sid`-keyed session
record vs. fully opaque server-side sessions), same category as
`ADR-009`–`ADR-013`, resolved as a necessary dependency of scope the
user had already selected, not a restatement of an existing one. **M25
introduced no new ADR** — same category as M16/M19/M20/M21/M24: two
connective/clarifying amendments to `SPEC-012` (tooling already in
scope, stated plainly; a framework-fact vs. principle distinction),
neither a new decision between real alternatives. **M26 introduced two
new ADRs**: `ADR-015` (`architecture.yaml` is current architecture first
and milestone history second), a genuine architecture-document role
decision discovered during the realignment; and `ADR-016` (dual
operating scope), the explicit decision that the repository/foundation
brain and each project/product brain are maintained separately while
sharing one operating model.

## Blocked

Nothing.

## Next

Do not proceed to Implementation unless explicitly requested and the
source Engineering Decomposition is ready. `ENG-001` is ready only for
`BACKLOG-014` after `TRACE-030` and its executable Tasks
`TASK-001`..`TASK-005`; it does not authorize executing those Tasks,
sibling Feature decomposition/design, or unrelated notes enhancements by
itself. The remaining M26 follow-up is broader validators for artifact and
architecture drift (`BACKLOG-011`). Do not begin another application
feature until it is selected from explicit user request or backlog.

## Open questions carried forward

None currently.
