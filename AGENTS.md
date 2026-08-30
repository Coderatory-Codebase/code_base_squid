# AGENTS.md — Operating Instructions for Coding Agents

This file applies to any coding agent working in this repository (Claude,
Codex, or otherwise). It is agent-agnostic; agent-specific adapters (e.g.
`CLAUDE.md`) point here rather than duplicating it.

## What this repository is

An agent-native software foundation, not an application. See `README.md`
for the philosophy and `architecture.yaml` for the machine-readable
boundaries, dependency rules, and current milestone. Read both before making
structural changes.

## Working method

For every meaningful change:

```text
Understand → Plan → Implement → Validate → Review → Record
```

Before modifying anything:

1. Inspect the current repository state — do not assume it matches any
   prior conversation or the roadmap's target end-state.
2. Check `architecture.yaml` (`roadmap.current_phase`) to identify the
   active milestone. Do not implement future milestones ahead of their
   dependencies.
3. Load only the context relevant to the task at hand (progressive
   disclosure — see below). Don't read the whole repo to make a small
   change.
4. Plan before implementing anything non-trivial.
5. After implementing, validate consistency: does the change contradict
   `README.md`, `architecture.yaml`, `AGENTS.md`, or `CLAUDE.md`? Do the
   quality gates (once M02 exists: install → lint → typecheck → test →
   build) still pass?
6. Record non-trivial architectural decisions as ADRs in
   `.project/decisions/` (see `.project/ARTIFACT-TYPES.md` for the
   convention).

## Progressive disclosure

Load context in this order, stopping as soon as you have enough to act:

```text
CLAUDE.md (or equivalent agent entry point)
  → repository orientation (README.md, architecture.yaml)
  → relevant instruction (.agent/instructions/*)
  → relevant workflow (.agent/workflows/*)
  → relevant skill (.agent/skills/*)
  → current project state (.project/state/PROJECT-STATE.md)
  → relevant project artifact (.project/*)
  → relevant source code
```

Do not front-load the entire architecture or every instruction into a
single pass. Pull in a layer only when the task needs it.

## Structural rules

- **No top-level `modules/`, `services/`, `business-services/`, or
  `domain-services/`.** Business/domain logic lives inside the deployable
  that owns it (`servers/<name>/domains/*`, `apps/<name>/features/*`, etc.).
- **`packages/` is the only reuse boundary.** Create a package for a
  concrete, currently-needed reusable capability — not because a category
  sounds generically useful.
- **`.agent/` vs `agents/`**: `.agent/` is the engineering operating system
  (how agents work in this repo). `agents/` holds actual deployable agent
  runtimes. Do not conflate them.
- **Dependency direction**: `apps/`, `servers/`, `agents/`, `tooling/` may
  depend on `packages/`. `packages/` must never depend on `apps/`,
  `servers/`, or `agents/`. If a cycle seems necessary, the boundary is
  wrong — fix the boundary, don't add a package to route around it.
- **No speculative scaffolding.** Don't create empty directories or
  placeholder files for a capability that doesn't exist yet. A directory
  earns its place when a concrete need creates it.
- **Architecture is composable, not prescribed.** Don't impose one
  methodology (DDD, hexagonal, CQRS, etc.) repo-wide; each deployable picks
  what fits it.

## Metadata / manifests

Use YAML frontmatter or a manifest file only when it provides a concrete,
current benefit (discovery, validation, versioning, dependency resolution,
agent selection). Don't add manifests by default or for symmetry.

## Non-goals right now

Do not build, even partially: a full agent runtime, an orchestration
engine, MCP infrastructure, a populated package set, a project generator, a
graph database, a control panel, business domains, authentication, or a
working web app. These are later milestones (`architecture.yaml` →
`roadmap`). Building ahead of the current milestone is a structural error,
not a shortcut.
