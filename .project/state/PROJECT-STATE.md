---
type: state
updated: 2026-08-31
---

# Project State

This file is a singleton, updated in place — read this first for "what's
going on," before opening any other artifact.

## Current phase

**M01–M22 are complete.** M23+ is **not yet defined** — the original M01
roadmap sketch ended at M14; M15 through M22 are all genuinely new
milestones added beyond it (not renames of a placeholder), and nothing
beyond M22 has a sketch entry either. M22 is the repository's first real
application feature (Authentication, MERN + Next.js) — `apps/web` and
`servers/api` now exist with real source. See "Roadmap position" below
before assuming any specific next milestone. See `../../architecture.yaml`
→ `roadmap` for the full milestone list.

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
pattern as M10/M11 before them. **M15 through M22 all have no original
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
without the user re-stating any of it), not because a roadmap slot
needed filling. Nothing beyond M22 has a sketch entry. The next real
milestone is decided when a concrete need identifies one, not by roadmap
position (`.agent/instructions/implementation.md`) — most plausibly the
next feature slice (from the M22 backlog, `BACKLOG-001`..`005`, or a new
one) now that the foundation (architecture, agent operating model,
project memory, engineering judgment, Git/quality enforcement,
backlog/feature-development model, connected agent bootstrap sequence
with explicit request classification and human-in-the-loop indexing,
technology-guidance governance, progressive execution traceability,
continuous discovery capture, and now a real, working first application)
is coherent and load-bearing.

## Technology profile

Populated for the first time at M22 (`ADR-012`):

- **`apps/web`**: TypeScript, Next.js 16 (App Router, Turbopack), React 19.
- **`servers/api`**: TypeScript, Node.js, Express 5, Mongoose 9 (MongoDB),
  `jsonwebtoken`, `bcryptjs`, `zod`, `cookie-parser`, `cors`, `helmet`.
- **Testing**: `vitest` (repo-wide, unchanged), `supertest` +
  `mongodb-memory-server` (`servers/api`, hermetic API tests against a
  real, in-memory MongoDB).
- **Dev tooling**: `tsx` (`servers/api` dev server).

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

Five real backlog items exist (`.project/backlog/`, created for the
first time at M22): `BACKLOG-001` (email verification), `BACKLOG-002`
(password reset), `BACKLOG-003` (OAuth/social login), `BACKLOG-004`
(server-side refresh-token revocation), `BACKLOG-005` (frontend
component/E2E test coverage) — all `discovered-from` the Authentication
feature's own scoping (`PLAN-002`/`ADR-012`), all `captured`, none
started. Model and conventions:
`.project/specs/SPEC-010-agent-backlog-and-feature-driven-development.md`.

## Traces

Five real traces exist (`.project/traces/`): `TRACE-001` (M18's own
execution, assembled mostly near the end), `TRACE-002` (M19's own
execution — the first written progressively, checkpoint by checkpoint),
`TRACE-003` (M20's own execution — also progressive; honestly records
zero genuine discoveries rather than manufacturing a backlog item),
`TRACE-004` (M21's own execution — progressive, and the first to include
a real, executed cold-start simulation as its own checkpoint rather than
only a narrative claim), and `TRACE-005` (M22's own execution — the
first to trace a real, multi-technology application feature rather than
only documentation/instruction changes; records five genuine
implementation-time discoveries, all resolved `needed now`). None is a
retroactive trace of M01–M17, which predate the model and aren't traced.
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

## Currently active

Nothing beyond finishing M22's own validation pass. No open TASK/RFC/
RESEARCH artifacts exist. Five `captured` `BACKLOG` items exist
(`BACKLOG-001`..`005`) — none selected or in progress.

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

## Blocked

Nothing.

## Next

Not yet defined — see "Roadmap position" above. The five `BACKLOG` items
(`BACKLOG-001`..`005`) are the most concrete known candidates for
follow-up feature work; none is selected yet. Do not begin new
implementation work without a concrete, demonstrated need, and not
without explicit approval — see
`../../.agent/instructions/implementation.md` ("stay inside the current
milestone").

## Open questions carried forward

None currently.
