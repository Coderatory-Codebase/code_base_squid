# AGENTS.md — Operating Instructions for Coding Agents

This file applies to any coding agent working in this repository (Claude,
Codex, or otherwise). It is agent-agnostic; agent-specific adapters (e.g.
`CLAUDE.md`) point here rather than duplicating it.

## What this repository is

An agent-native software foundation for building MERN/Next.js monorepo
applications feature by feature. The application under `apps/test/web`
and `servers/test/api` is the seed/reference project used to prove the
foundation; it is not the whole repository. See `README.md` for the
philosophy and `architecture.yaml` for the machine-readable current
architecture, boundaries, dependency rules, and operating-model state.
Read both before making structural changes. Step-by-step orientation
checklist (including
verifying the actual filesystem matches these documents before trusting
them): `.agent/instructions/repository-orientation.md`. How the pieces
below connect into one bootstrap sequence, start-to-finish — read this
first if you have no context from a prior session:
`.agent/instructions/agent-operating-contract.md`.

## Request routing gate

Before choosing files or writing code, classify the user's request:

- **Foundation / operating-layer work** changes how agents operate in
  this repo: `AGENTS.md`, `.agent/`, `.project/`, `architecture.yaml`,
  workflow/skill/backlog/artifact/validation rules, or bootstrap
  behavior.
- **Seed app / product feature work** changes the MERN/Next.js seed
  application: `apps/<project>/<app>`, `servers/<project>/<server>`,
  app behavior, API behavior, data models, UI, tests, or product-facing
  backlog items.
- **Cross-cutting work** does both: a product feature also exposes a
  real foundation gap, or a foundation change must be verified through
  a seed-app feature.

Record the classification proportionally (in a TRACE when one exists,
otherwise in the plan/session). Do not treat app work as the whole repo,
and do not silently rewrite the foundation while implementing an app
feature. If the project name for app work is not obvious, ask before
creating or moving code.

The operating model has two brains that must both be respected:

- **Repository/foundation brain**: `.agent/`, `architecture.yaml`,
  `.project/state/PROJECT-STATE.md`, `.project/roadmap/`,
  `.project/specs`, `.project/decisions`, and `FOUNDATION` backlog
  rows.
- **Project/product brain**: `.project/projects/<project>/` plus the
  owning `apps/<project>/`, `servers/<project>/`, `agents/<project>/`,
  and `PROJECT` backlog rows.

For project/product work, load the foundation rules first, then the
owning project brain. For cross-cutting work, keep the foundation and
project portions separate in scope, plan, backlog updates, validation,
and trace.

If the user asks to capture raw business/product input before downstream
engineering, use the Intake workflow (`.agent/workflows/intake.md`). It
creates a `REQ-*` artifact and stops before Discovery, Architecture, or
Implementation.

If the user asks to investigate a completed Intake artifact before
Specification, use the Discovery workflow (`.agent/workflows/discovery.md`).
It consumes a `REQ-*` artifact, produces a `DISC-*` evidence artifact, and
stops before Specification, Decomposition, Architecture, or Implementation.

If the user asks to specify work from a completed Discovery artifact, use
the Specification workflow (`.agent/workflows/specification.md`). It
consumes a `DISC-*` artifact, produces an ordinary `SPEC-*` requirements
artifact, routes unresolved intent/evidence through the appropriate
clarification/rework path, and stops before Decomposition, Architecture,
or Implementation.

If the user asks to decompose work from a ready Specification, use the
Decomposition workflow (`.agent/workflows/decomposition.md`). It consumes
an `active` / `ready-for-decomposition` `SPEC-*`, produces a `DECOMP-*`
product scope evidence artifact, creates/refines ordinary backlog rows
for the resulting feature-driven product units, and stops before
Architecture, Implementation Planning, Implementation, or engineering
tasks.

If the user asks to architect work from a ready Decomposition, use the
Architecture workflow (`.agent/workflows/architecture.md`). It consumes the
relevant Discovery evidence, approved Specification, ready
`DECOMP-*`, and backlog Feature rows; produces an `ARCH-*` architecture
record; reuses ADRs/`architecture.yaml` where they already govern; and
stops before Feature-scoped System Design, Implementation, or engineering
tasks.

If the user asks to design one selected Feature after high-level
Architecture, use the System Design workflow
(`.agent/workflows/system-design.md`). It consumes exactly one eligible
backlog Feature plus the relevant Specification, Decomposition, and
`ARCH-*` baseline; produces an `SD-*` Feature-scoped System Design with an
architectural consistency check; and stops before Engineering
Decomposition, Implementation Planning, Implementation, or engineering
tasks.

## Working method

For every meaningful change:

```text
Understand → Plan → Implement → Validate → Review → Record → Complete
```

Full stage definitions, proportional artifact usage, the failure-handling
loop, and scope-control rules: `.agent/instructions/development-lifecycle.md`.
The observe/hypothesize/verify reasoning used while implementing or
debugging: `.agent/instructions/development-loop.md`. How to design and
implement well inside these stages — principles, reuse, decoupling,
technology-specific guidance via skills, precedence when guidance
conflicts: `.agent/instructions/engineering-standards.md`. How to receive
a piece of implementation work and decide what belongs in its scope
versus the backlog — feature slicing, discovery capture, deferred work,
ambiguity/RFC/SPEC escalation:
`.agent/instructions/backlog-and-feature-development.md`. What to do when
a task involves a specific technology — whether a skill already exists,
when creating/changing one is warranted, and why that always needs human
approval before it becomes shared guidance:
`.agent/instructions/technology-guidance.md`. When meaningful work
deserves a durable record of what was requested, decided, implemented,
and validated — proportional to the work, most interactions need none:
`.agent/instructions/traceability.md`.

Before modifying anything:

1. Inspect the current repository state — do not assume it matches any
   prior conversation or the roadmap's target end-state.
2. Check `architecture.yaml` to identify the current architecture,
   project boundaries, operating model, and active phase. Do not let
   historical milestone notes override the current architecture.
3. Load only the context relevant to the task at hand (progressive
   disclosure — see below). Don't read the whole repo to make a small
   change.
4. Plan before implementing anything non-trivial. For foundation work or
   seed-app features that span multiple boundaries, create/update the
   relevant SPEC/ADR/PLAN before code/config edits so artifacts shape the
   work rather than only record it afterward.
5. After implementing, validate consistency: does the change contradict
   `README.md`, `architecture.yaml`, `AGENTS.md`, or `CLAUDE.md`? Does
   `pnpm run validate` (lint, typecheck, test, build, architecture
   boundaries, secret scan) plus `pnpm run format:check` still pass?
6. Record non-trivial architectural decisions as ADRs in
   `.project/decisions/` (see `.project/ARTIFACT-TYPES.md` for the
   convention).

How change actually moves through Git — branches, commits, hooks, PRs,
CI, what's enforced vs. only documented, agent Git safety:
`.agent/instructions/git-governance.md`. Commit/push authorization rules
(commit only when asked, no force-push, no bypassing checks):
`.agent/instructions/change-management.md` — unchanged, `git-governance.md`
extends it with the concrete enforcement machinery.

## Progressive disclosure

Load context in this order, stopping as soon as you have enough to act:

```text
CLAUDE.md (or equivalent agent entry point)
  → repository orientation (README.md, architecture.yaml)
  → request routing (foundation, project/product, or cross-cutting)
  → relevant instruction (.agent/instructions/*)
  → relevant workflow (.agent/workflows/*)
     (use intake.md for raw business/product input capture; use
     discovery.md for evidence-backed investigation from REQ-* to DISC-*;
     specification.md for requirements from DISC-* to SPEC-*)
  → relevant skill (.agent/skills/*)
  → current project state (.project/state/PROJECT-STATE.md)
  → owning project brain (.project/projects/<project>/PROJECT.md, if any)
  → relevant project artifact (.project/*)
  → relevant source code
```

Do not front-load the entire architecture or every instruction into a
single pass. Pull in a layer only when the task needs it.

## Structural rules

- **No top-level `modules/`, `services/`, `business-services/`, or
  `domain-services/`.** Business/domain logic lives inside the deployable
  that owns it (`servers/<project>/<server>/domains/*`,
  `apps/<project>/<app>/features/*`, etc.).
- **`packages/` is the only reuse boundary.** Create a package for a
  concrete, currently-needed reusable capability — not because a category
  sounds generically useful. Full extraction criteria and package
  structure: `.agent/instructions/packages.md`. Same "ownership before
  reuse" rule applied to contracts specifically:
  `.agent/instructions/contracts.md`.
- **`.agent/` vs `agents/`**: `.agent/` is the engineering operating system
  (how agents work in this repo). `agents/` holds actual deployable agent
  runtimes. Do not conflate them.
- **Dependency direction**: `apps/`, `servers/`, `agents/`, `tooling/` may
  depend on `packages/`. `packages/` must never depend on `apps/`,
  `servers/`, or `agents/`. If a cycle seems necessary, the boundary is
  wrong — fix the boundary, don't add a package to route around it.
  Typed relationships between engineering entities (depends-on, blocks,
  affects, ...) describe this, never authorize a violation of it — see
  `.agent/instructions/engineering-graph.md`.
- **No speculative scaffolding.** Don't create empty directories or
  placeholder files for a capability that doesn't exist yet. A directory
  earns its place when a concrete need creates it.
- **Architecture is composable, not prescribed.** Don't impose one
  methodology (DDD, hexagonal, CQRS, etc.) repo-wide; each deployable picks
  what fits it.
- **Instructions, workflows, skills, tools, packages, and agents are
  distinct layers** — don't collapse them (a skill isn't a workflow for
  having steps, isn't a package for being reusable). See
  `.agent/instructions/capability-model.md`.

## Metadata / manifests

Use YAML frontmatter or a manifest file only when it provides a concrete,
current benefit (discovery, validation, versioning, dependency resolution,
agent selection). Don't add manifests by default or for symmetry.

## Non-goals right now

Do not build, even partially: a full agent runtime, an orchestration
engine, MCP infrastructure, a populated package set beyond what a real
feature has demonstrated, a project generator, a graph database, or a
control panel. Business domains and application features are no longer a
blanket non-goal — the Authentication feature (M22, `apps/test/web` +
`servers/test/api`) is real, working source; further business-domain work
follows `architecture.yaml` → `roadmap` and `.project/backlog/BACKLOG.md`
the same way, not built ahead of an explicit request. Building ahead of
the current milestone is a structural error, not a shortcut.
