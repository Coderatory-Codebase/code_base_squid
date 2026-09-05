# Operating Model Overview — Architecture, Agent, and Project

This is the single narrative explainer for how `nut-shyll` actually works:
what the repository is for, how the two operating layers (`.agent/` and
`.project/`) function together, what features exist today in the real
application, and why each piece exists. It is a **reference document**,
not a governed artifact (`ARTIFACT-TYPES.md`'s nine types) — it doesn't
carry a decision of its own, it synthesizes and points at the artifacts
that do. Read `.project/state/PROJECT-STATE.md` for the live, terse
"what's going on right now"; read this for the fuller "how does the whole
thing work and why is it built this way."

---

## 1. What this repository is

`nut-shyll` is a **reusable software foundation**, not one opinionated
application. Most starter repos ship a single app with a framework choice
baked in. This repository instead defines, before any application code
exists:

- where reusable capability lives (`packages/`)
- where business/domain logic lives (`apps/`, `servers/`, `agents/`,
  scoped per project)
- how an agent discovers context and decides what to do
- how architectural decisions get recorded and stay discoverable
- how features get planned, built, validated, and remembered

It is built to be operated by **both humans and coding agents** (Claude
first, but explicitly not Claude-only — see "Agent-agnostic core" below),
under an explicit, machine-readable architecture (`architecture.yaml`).
Concrete apps/servers/agents/packages get added later, into a structure
that already knows where they belong. The one real project built so far
inside this foundation is `test` (`apps/test/web` + `servers/test/api`) —
see §6. Its project/product brain is
`.project/projects/test/PROJECT.md`.

---

## 2. The two-layer model: FOUNDATION vs. PROJECT

This is the single most load-bearing structural idea in the repository
(`ADR-013`, established M23, after the first real feature exposed the gap):

| Layer          | What it is                                                                                                         | Lives in                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FOUNDATION** | The reusable engineering operating system itself — rules, conventions, governance, the agent's own operating model | `AGENTS.md`, `CLAUDE.md`, `architecture.yaml`, `.agent/`, repository-level `.project/specs`, `.project/decisions`, `.project/state`, `.project/roadmap`, `tooling/`, `FOUNDATION` backlog rows |
| **PROJECT**    | A concrete application or product built _using_ the foundation                                                     | `.project/projects/<project>/PROJECT.md`, `apps/<project>/`, `servers/<project>/`, `agents/<project>/`, `PROJECT` backlog rows                                                                 |

The rule this produces: `apps/`, `servers/`, and `agents/` are
**project-owned boundaries** — a deployable lives at
`apps/<project>/<app>` (e.g. `apps/test/web`), never directly at
`apps/<app>`. This repository exists to scaffold _future_ projects; the
global roots must never become a dumping ground where a second, unrelated
project's deployables sit as flat siblings of the first. `packages/` and
`tooling/` are unaffected — they stay repository-/cross-project-level
boundaries, not project-scoped.

**Why this matters for an autonomous agent**: every request first gets
classified as touching the foundation, a project, or both
(`SPEC-011` → "Foundation vs. project classification"; current label for
both is `CROSS_CUTTING`). Foundation
changes carry a genuinely high bar — see §5.4 — because they're shared,
durable, and affect every future project scaffolded from this repository,
not just the one currently being worked on. A project's own
implementation choice never silently becomes foundation policy.

`ADR-016` makes this a dual operating-scope model: the repository has a
foundation brain, and each real project/product has a scoped project
brain. A coding agent follows both when building product features: first
the foundation, then the owning project memory, then the source.

---

## 3. The `.agent/` layer — how agents operate

```text
.agent/
├── instructions/   Standing rules an agent applies while working here.
├── workflows/      Lifecycle specs for common change types (not an engine).
├── skills/         Discoverable, self-describing capabilities.
└── templates/      Authoring templates for the above.
```

This directory answers **"how do I operate in this repository?"** — it is
not application code and not project memory (that's `.project/`, §4).

### 3.1 The bootstrap/discovery sequence

A fresh agent session (no prior context) follows one discoverable path,
not a memorized process:

```text
CLAUDE.md (agent-specific entry point, kept intentionally small)
  → AGENTS.md (the agent-agnostic rulebook)
  → .agent/instructions/agent-operating-contract.md (the connected sequence)
  → .agent/instructions/repository-orientation.md (orient: purpose, boundaries, state)
  → CLASSIFY the request (SPEC-011 → "Request classification")
  → .agent/instructions/*  (whichever standing rules the task actually needs)
  → .agent/workflows/*     (the lifecycle for this kind of change)
  → .agent/skills/*        (a concrete capability, if one is needed)
  → .project/state/PROJECT-STATE.md  (current phase, decisions, what's next)
  → .project/projects/<project>/PROJECT.md  (when work targets a project)
  → .project/*              (a specific spec/plan/decision/trace, if needed)
  → source code
```

This is **progressive disclosure**, not a checklist to read end-to-end
before every change: only the layers a given task actually needs get
loaded. `CLAUDE.md` deliberately does not restate `AGENTS.md`'s content —
it did once, drifted stale, and that was corrected at M16 by making it a
thin adapter instead.

### 3.2 The standing instructions (`.agent/instructions/`)

Each file owns one concern, referenced by pointer rather than restated
elsewhere:

| File                                 | Owns                                                                                                                                                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent-operating-contract.md`        | The connected bootstrap sequence itself — the concise entry point read first in a fresh session                                                                                                                                           |
| `repository-orientation.md`          | What to read to understand "where am I, what exists"                                                                                                                                                                                      |
| `boundaries.md`                      | The structural boundaries (`apps/`, `servers/`, `agents/`, `packages/`, `infra/`, `tooling/`) and what belongs where                                                                                                                      |
| `capability-model.md`                | The six-way distinction: instruction / workflow / skill / tool / package / agent — kept genuinely distinct, not blurred                                                                                                                   |
| `development-lifecycle.md`           | `UNDERSTAND → PLAN → IMPLEMENT → VALIDATE → REVIEW → RECORD → COMPLETE`; proportionality; the "when is planning required" gate; review dimensions (including Security and Accessibility, added M24); the conformance-review concept (M24) |
| `development-loop.md`                | `OBSERVE → UNDERSTAND → HYPOTHESIZE → PLAN → CHANGE → VERIFY → EVALUATE` — the tighter iteration loop nested _inside_ IMPLEMENT                                                                                                           |
| `backlog-and-feature-development.md` | Feature-driven development; the backlog model; phase determination (feature → phases → tasks); discovery capture                                                                                                                          |
| `engineering-standards.md`           | Technology-neutral engineering principles (simplicity, cohesion, coupling, reuse/generalization, testing, security, performance, observability) and the guidance-precedence order; "use vs. build vs. adopt"                              |
| `technology-guidance.md`             | How technology/implementation-area skills enter the ecosystem; when a skill is warranted vs. when a project-local decision is enough; human-approval requirement for durable guidance                                                     |
| `traceability.md`                    | The `TRACE` artifact — progressive, checkpoint-structured execution recording                                                                                                                                                             |
| `engineering-graph.md`               | The relationship vocabulary between artifacts (`depends-on`, `blocks`, `implements`, `supersedes`, ...) — optional, used only when precision is actually needed                                                                           |
| `packages.md`                        | The package/reuse model — when something graduates from project-local code to a shared package                                                                                                                                            |
| `contracts.md`                       | What a "contract" is (a type/interface/schema/API spec — a concept, not a framework)                                                                                                                                                      |
| `validation.md`                      | What counts as done: automated gate + real manual/UI verification for user-facing changes                                                                                                                                                 |
| `git-governance.md`                  | Hooks, commit conventions, branch/PR policy                                                                                                                                                                                               |
| `change-management.md`               | When to ask a human vs. proceed autonomously; commit-only-when-asked                                                                                                                                                                      |
| `implementation.md`                  | Staying inside the current milestone's actual scope                                                                                                                                                                                       |

### 3.3 Workflows (`.agent/workflows/`)

Not an execution engine — plain lifecycle specs for the common change
shapes (`app-analysis.md`, `feature.md`, `bugfix.md`, `refactor.md`,
`review.md`), each referencing `development-lifecycle.md`'s stage model
rather than restating it.

### 3.4 Skills (`.agent/skills/`)

A **skill** is discoverable, self-describing capability guidance — most
commonly a technology skill (framework-/library-specific knowledge) or an
implementation-area skill (a cross-cutting concern like "API error
handling," generalized at M23 to use the same governance as technology
skills). Skill creation has a real bar (`SPEC-012`): routine use of an
already-adopted technology stays fully autonomous and never triggers
skill creation; a skill is only warranted for genuinely reusable
_ecosystem_ knowledge, demonstrated by repeated need across **at least
two independent projects** (the cross-project bar made explicit at M24),
and any durable skill creation/material change requires human approval.
`.agent/skills/README.md` holds the full model. Today two skills exist:
`validate-repository` and `mern-nextjs-vertical-slice`. The latter was
created at M26 after the user explicitly confirmed the repo's seed
purpose as feature-driven MERN/Next.js monorepo development. Project-
level choices still remain project convention unless they clear the
skill bar; this skill exists because the seed stack and vertical-slice
delivery shape are now part of the foundation itself.

### 3.5 The "capability model" — six distinct concepts, not blurred

`capability-model.md` keeps these apart on purpose, because collapsing
them is a common failure mode: **instruction** (a standing rule),
**workflow** (a lifecycle spec for a change type), **skill** (discoverable
capability guidance), **tool** (something an agent invokes), **package**
(reusable, distributable source), **agent** (a deployable, independently
executable runtime — distinct from `.agent/`, which is the _engineering_
operating system, not a runtime agent itself).

---

## 4. The `.project/` layer — durable project memory

```text
.project/
├── ARTIFACT-TYPES.md   Single source of truth: types, metadata, lifecycle.
├── state/               PROJECT-STATE.md — one singleton, current status.
├── backlog/              BACKLOG.md — one singleton table, deferred/discovered work.
├── decisions/             ADR-<NNN> — accepted architectural decisions.
├── specs/                  SPEC-<NNN> — what should exist / required behavior.
├── architecture/            ARCH-<NNN> — architecture phase records.
├── plans/                   PLAN-<NNN> — how a spec is/was accomplished.
├── reviews/                  REVIEW-<NNN> — point-in-time evaluations.
└── traces/                    TRACE-<NNN> — the execution journey of one unit of work.
```

This directory answers **"what does the project know, decide, plan, and
remember?"** — durable engineering memory, never runtime behavior.

### 4.1 Artifact types and what each is for

| Type                         | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Lifecycle                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **SPEC**                     | _What_ should exist or be true — required behavior/properties, not implementation steps. Stays `active` independent of whether the work implementing it is done.                                                                                                                                                                                                                                                                                                          | `draft → active → superseded → archived`                                                                                        |
| **PLAN**                     | _How_ a spec (or part of one) gets accomplished — ordered steps, explicit scope boundaries.                                                                                                                                                                                                                                                                                                                                                                               | `draft → active → superseded → archived`, ends `complete`/`superseded`                                                          |
| **ADR**                      | An architectural decision: context, decision, consequences. A genuine choice between real alternatives — not created for routine implementation choices already resolvable from existing guidance.                                                                                                                                                                                                                                                                        | `proposed → accepted → superseded → deprecated`                                                                                 |
| **ARCH**                     | Architecture phase output for a work item: current state, target architecture, boundaries, Feature mapping, evidence-backed decisions, trade-offs, risks/open decisions, and handoff. Does not replace ADRs or `architecture.yaml`.                                                                                                                                                                                                                                       | `complete`, `needs-clarification`, or `blocked`                                                                                 |
| **BACKLOG item**             | Work that's known, discovered, deferred, or produced as feature-driven product units by Decomposition, but not necessarily current scope. One singleton table file, not one file per item (corrected at M23). `Level`/`Parent` record hierarchy separately from workflow `Status`. Discovery never automatically becomes implementation scope.                                                                                                                            | `captured → clarifying → ready → selected → in-progress → review → completed` (+ `deferred`/`blocked`/`rejected`/`superseded`)  |
| **TRACE**                    | The record connecting one coherent unit of agent work's execution journey — request, guidance consulted, decisions (with source), scope, implementation, discoveries, validation, review, Git outcome. Written progressively, as checkpoints actually complete — never reconstructed after the fact. References the ADR/SPEC/PLAN/BACKLOG/REVIEW that actually holds a decision; never replaces them. Proportional to work significance — most interactions produce none. | `created → oriented → understood → analyzed → scoped → planned → implementing → validating → reviewing → recording → completed` |
| **REVIEW**                   | An evaluation of completed work against its plan/spec.                                                                                                                                                                                                                                                                                                                                                                                                                    | `draft → final`                                                                                                                 |
| TASK, RFC, RESEARCH, HANDOFF | Defined conventions, not yet instantiated — created the first time real work meets their criteria, never pre-scaffolded.                                                                                                                                                                                                                                                                                                                                                  | see `ARTIFACT-TYPES.md`                                                                                                         |

### 4.2 The two singletons

`PROJECT-STATE.md` and `BACKLOG.md` are updated in place, not versioned
per-entry — `PROJECT-STATE.md` is the one file that answers "what's going
on" without opening anything else; `BACKLOG.md` is one table (columns:
ID/Scope/Owner/Level/Parent/Title/Kind/Status/Priority/Source/
Dependencies/Notes), a single repository-native backlog rather than
several kind-specific ones (`ADR-010`).

### 4.3 Durable vs. ephemeral

`.project/` holds durable knowledge only — a session's scratch reasoning
is not written here; it's discarded when the session ends unless
something in it is worth promoting to a real artifact.

---

## 5. The autonomous execution model — how a request actually gets handled

This is the part that turns "documented conventions" into "an agent
reliably does the right thing without being told the engineering
methodology each time." It has been built, audited, and re-audited
adversarially across seven milestones (M21, M23, M24, M25, and validated
by real execution at M26 — see §7).

### 5.1 The flow

```text
ORIENT → CLASSIFY → is-planning-required? → GUIDANCE DISCOVERY →
USE-VS-BUILD-VS-ADOPT → ARCHITECTURE (if needed) → PHASE/TASK DECOMPOSITION →
ENGINEERING-LENS SELECTION → IMPLEMENT → DISCOVER (continuous) →
VALIDATE → REVIEW (incl. conformance review) → RECORD → GIT
```

- **Classify** (`SPEC-011`): what kind of request is this — application
  implementation, bugfix, refactor, technology adoption, exploration,
  governance/operational — and does it touch the foundation, a project,
  or both?
- **Planning-required gate** (`development-lifecycle.md`): an explicit
  trigger set — multi-step/multi-file, new architecture, technology
  adoption, security-sensitive, external integration, schema change,
  unclear requirements, consequential trade-offs → a PLAN is written
  first. A trivial, single-approach change proceeds proportionally
  without one.
- **Guidance discovery** (`SPEC-012`): for every technology/
  implementation area actually involved, is there already-sufficient
  guidance (a principle, an existing skill, established project
  convention)? If something is missing: is it _routine_ (use current
  ecosystem knowledge directly) or genuinely _reusable, durable ecosystem
  knowledge_ (propose a skill, subject to human approval)? A
  technology-neutral principle answering a design question is not the
  same as a framework-specific factual behavior question only current
  docs can answer (a real distinction sharpened at M25, after a Mongoose
  API-behavior mistake was initially misclassified as principle-coverable).
- **Use vs. build vs. adopt** (`SPEC-008`): an ordered check per
  capability — use what already exists → reuse existing project code →
  adopt an established library → build new, only once the earlier options
  are genuinely exhausted.
- **Phase determination** (`SPEC-010`): feature → phases → tasks, with
  the phase _set itself_ derived from the feature (not a fixed checklist
  copied onto every request).
- **Engineering lenses** (`SPEC-008`): correctness, architecture,
  maintainability, reuse, security, privacy, accessibility, performance,
  reliability, testing, QA, observability, UX, operational readiness —
  _selected_ per feature with a reason, not mechanically all applied.
- **Discovery** (`SPEC-010`, made cross-cutting at M20): any stage can
  surface something worth remembering, resolved to one of five real
  outcomes — needed now / decision required / future work (→ real
  backlog entry) / already tracked / rejected. Nothing is silently
  dropped, and nothing is manufactured just to demonstrate the mechanism
  — a real, honestly-recorded "zero discoveries" outcome is valid.
- **Traceability** (`SPEC-013`): a progressive `TRACE` records the above
  as it happens, proportional to significance.
- **Conformance review** (added M24): comparing the recorded process
  against what was _actually_ verified, not just what was claimed —
  distinguishing "the agent recorded a process" from "the record is
  independently verified."

### 5.2 Human-in-the-loop — asking only when it's genuinely a permission question

`SPEC-011` consolidates every escalation trigger into one discoverable
index (by reference, not restatement): a genuine product/business/vendor/
infrastructure/security decision, a new durable ecosystem skill, an
architectural disagreement, a materially ambiguous request. The
repeatedly-applied distinction: _"I need information"_ (resolvable myself
— proceed) vs. _"I need permission"_ (a decision only the human can
authorize — stop and ask exactly that one thing, with options, trade-offs,
and a recommendation). Never asked merely because multiple valid
implementation choices exist.

### 5.3 Continuous discovery → backlog

Real example from the live backlog (`.project/backlog/BACKLOG.md`):
`BACKLOG-009` (correct client-IP detection behind the Next.js proxy) was
discovered _while implementing_ `BACKLOG-006` (rate limiting) — a
security-relevant setting deliberately left unset rather than guessed,
because guessing a proxy-trust configuration without knowing the real
deployment topology is itself a spoofing risk.

### 5.4 Foundation-change authorization (explicit rule added M24)

Changing `.agent/`, `architecture.yaml`, `AGENTS.md`, or `.project/specs`
about the model itself carries a genuinely high bar — evidenced by real,
demonstrated behavioral failure, not a plausible-sounding improvement.
Across M21–M26, most audits' correct outcome was **declining** a
plausible fix rather than adding it (explicitly to avoid "checklist
explosion" — turning the model into a long mandatory sequence instead of
principles + decision procedures + proportional judgment).

---

## 6. The real application — what's built, and why

The one project scaffolded inside this foundation so far is **`test`**
(`apps/test/web` — Next.js 16/React 19; `servers/test/api` — Express 5/
Mongoose 9/MongoDB), built feature by feature, each directly from a
human product request with the engineering process derived by the model
above rather than specified by the human.

| Feature                                   | Purpose                                                                                      | What it does                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication** (M22, `ADR-012`)       | The foundation's first real application feature — establishes the stack and session strategy | Register, login, logout, current-user, JWT access (~15 min) + refresh (~7 day) tokens in `httpOnly` cookies, same-origin via a Next.js rewrite proxy, route protection (`/dashboard` redirects unauthenticated)                                                                    |
| **Rate limiting** (`BACKLOG-006`)         | Brute-force protection on credential endpoints                                               | `express-rate-limit` on `/register`, `/login`, `/refresh`, later extended to `/me` and password change                                                                                                                                                                             |
| **User profile**                          | Let a user set a display name                                                                | `displayName` field, `/profile` page, `PATCH /me`                                                                                                                                                                                                                                  |
| **Account security settings** (`ADR-014`) | Give users real control over their own sessions                                              | Change password (forces revocation of _other_ sessions — a secure default), a server-side `Session` collection (extends the JWT model to support real revocation, closing `BACKLOG-004`), `/settings` page listing active sessions with per-session and revoke-all-others controls |
| **Personal notes** (M26)                  | The live behavioral test case for the operating model itself (§7)                            | Full CRUD (create/view/edit/delete), strictly scoped to the authenticated owner at the database query layer, reusing the existing rate-limit/validation/error-handling conventions rather than inventing new ones                                                                  |

Each feature is documented by its own `PLAN`/`ADR` (where a genuine
architectural decision existed) and `TRACE` (its execution record) — see
`.project/state/PROJECT-STATE.md` → "Completed" for the full account of
each, including every real implementation-time discovery and how it was
resolved.

**Deliberately not built yet** (real, tracked, not forgotten):
`BACKLOG-001`/`002` (email verification, password reset — blocked on an
email-provider decision), `BACKLOG-003` (OAuth — blocked on a provider
decision), `BACKLOG-005` (frontend component/E2E test coverage — no
toolchain adopted yet), `BACKLOG-007` (audit/security logging),
`BACKLOG-008` (MFA/2FA/passkeys), `BACKLOG-009` (proxy-aware IP
detection). None of these are missing by oversight — each was
deliberately deferred with a stated reason.

---

## 7. How the model has been tested (not just documented)

Documentation claiming an agent _can_ behave a certain way is not
evidence that it _does_. This repository has repeatedly tested that
distinction rather than assuming it:

- **M21, M23**: cold-start scenario walkthroughs (a fresh agent's path
  through a concrete request, checked against what the repository
  actually makes discoverable).
- **M24**: a system-level audit using the real Authentication/Rate-
  Limiting/Profile work as behavioral evidence — found the target flow
  already mapped onto existing sections and demonstrably working; closed
  four real, evidence-grounded gaps.
- **M25**: a deliberately adversarial second audit against a larger real-
  evidence base (50 stated acceptance criteria, 13 cold-start scenario
  walkthroughs) — found most suspected gaps were already fixed or never
  real; closed two narrow, genuine ones.
- **M26**: the most rigorous test to date — rather than simulate
  cold-start reasoning from within an already-informed session, a
  genuinely fresh agent (no memory of this repository's prior sessions)
  was given only a product-level request ("add personal notes CRUD") and
  had to self-orient, self-classify, self-plan, self-architect, self-
  implement, self-validate, and self-review using only the repository
  itself. Verdict: **PASS** — every one of 17 audited behavioral items
  passed with real, checkable evidence (not merely "the right words
  appear in a document"). Two honest, disclosed limitations were
  recorded (an HTTP-level rather than real-browser manual check; a stale
  test-environment baseline caught and corrected before it could corrupt
  the run) — neither reflecting a defect in the repository's own
  operating model. Full record: `.project/traces/TRACE-014-personal-notes.md`
  and `.project/reports/REPORT-001-m26-behavioral-audit.md`.

The consistent, honestly-recorded finding across all of these: the
operating model, once past its first few milestones of construction,
correctly does most of what it claims — and every genuine gap found was
closed narrowly, not papered over with a longer checklist.

---

## 8. `architecture.yaml` — the structural source of truth

The one machine-readable file every other document must stay consistent
with. It defines:

- **Principles** (§2's FOUNDATION/PROJECT boundary, packages-are-the-
  reuse-mechanism, agent-agnostic-core, composable-architecture,
  progressive-disclosure, explicit-boundaries, decisions-are-recorded).
- **Boundaries** — one stated purpose per top-level directory
  (`.agent/`, `.project/`, `apps/`, `servers/`, `agents/`, `packages/`,
  `infra/`, `tooling/`), each marked `created`/`not-yet-created` — empty
  boundaries are never pre-filled with placeholder files.
- **Roadmap history** — `.project/roadmap/MILESTONES.yaml` holds the full
  milestone history (M01–M26), each entry stating what was actually
  delivered and why the milestone existed (a real gap or commissioned
  feature, not a renamed placeholder past M14).
- **`current_phase`** — the live marker for where the repository is now.

`pnpm run validate:architecture` enforces the boundary declarations
against the real filesystem on every validation run — this is not
aspirational documentation, it's a checked invariant.

---

## 9. Quality gate — how correctness is actually enforced, not just claimed

```text
pnpm install
pnpm run lint                    # ESLint
pnpm run typecheck                # tsc -b, strict
pnpm run test                      # Vitest (+ supertest/mongodb-memory-server for the API)
pnpm run build                      # tsc -b / next build
pnpm run validate:architecture       # forbidden/undeclared top-level directories
pnpm run secrets:scan                 # baseline secret-pattern scan
pnpm run validate                      # all six, in sequence
pnpm run format:check                   # Prettier
```

`pnpm install` also installs real Git hooks (`commit-msg`, `pre-commit`,
`pre-push`, native `core.hooksPath` — no third-party hook manager,
`ADR-009`) for fast local feedback; CI (`.github/workflows/ci.yaml`),
running `pnpm run validate` directly, is the authoritative gate. None of
this substitutes for real manual/UI verification of user-facing changes
(`validation.md`) — automated-green is necessary, not sufficient.

---

## 10. Reading order for a newcomer (human or agent)

1. `README.md` — why this repository exists, in one page.
2. This file, or `.project/state/PROJECT-STATE.md` for the terser live
   version — how it all works and what's built right now.
3. `AGENTS.md` → `.agent/instructions/agent-operating-contract.md` — the
   actual operating rules, if you're about to do work here.
4. `architecture.yaml` — the structural ground truth.
5. Whatever specific `SPEC`/`ADR`/`PLAN`/`TRACE` the task at hand
   actually needs — not read wholesale, pulled in on demand.
