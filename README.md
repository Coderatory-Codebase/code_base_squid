# nut-shyll — Agent-Native Software Foundation

A reusable software foundation from which future projects are scaffolded. It is
built to be operated by both humans and coding agents (Claude first, but not
Claude-only) under an explicit, machine-readable architecture.

## Why this exists

Most starter repos encode one opinionated app. This repo instead defines the
**boundaries, contracts, and operating model** a project needs before any
application code exists: where reusable capability lives, where business
logic lives, how agents discover context, and how architectural decisions get
recorded. Concrete apps/servers/agents/packages are added later, into a
structure that already knows where they belong.

## Repository map

```text
.agent/       Repository-level agent operating system (instructions,
              workflows, skills, templates). Describes HOW agents operate —
              not application runtime code.
.project/     Persistent engineering/project memory (state, decisions,
              specs, plans, reviews; more as needed). Describes WHAT the
              project knows.
apps/         User-facing deployable applications (web, admin, mobile, ...).
servers/      Deployable server processes (api, worker, gateway, ...).
              Business/domain logic lives inside the server that owns it.
agents/       Deployable/independently executable agent runtimes — distinct
              from .agent/, which is the engineering operating system.
packages/     Reusable capabilities: infra, protocols, transports, platform
              integrations, libraries, shared contracts, utilities. The
              primary reuse boundary in this repo.
infra/        Infrastructure and deployment configuration.
tooling/      Repository/developer tooling (generators, scripts, lint, build).
docs/         Human-facing documentation.
```

Only directories backing a concrete, current need are populated. Empty
boundaries are not pre-filled with placeholder files.

## Development philosophy

- **Packages are the reuse mechanism.** There is no generic top-level
  `modules/`. If something is reusable across independent deployables, it
  becomes a package. If it's owned by one system, it stays inside that
  system's own domain boundary (see `architecture.yaml`).
- **Architecture is composable, not prescribed.** Feature-based, DDD,
  hexagonal, CQRS, vertical-slice, event-driven, modular monolith,
  microservices — these are patterns a project selects, not a repo-wide
  mandate.
- **Progressive disclosure.** `CLAUDE.md` stays small. Context loads on
  demand: repo orientation → relevant instruction → relevant
  workflow/skill → relevant project artifact → relevant source.
- **Agent-agnostic core.** Claude is the initial development agent, but
  artifacts, contracts, workflows, skills, and project state must remain
  usable by other agents. Claude-specific behavior lives at the adapter
  layer (`CLAUDE.md`), not baked into the artifacts themselves.
- **Decisions are recorded, not silent.** Architectural choices go into
  `.project/decisions/` as ADRs — see `.project/ARTIFACT-TYPES.md`.

## Current maturity

**M01–M10 are complete.** The root definition artifacts, workspace
tooling, `.agent/` (agent operating system), and `.project/` (project
memory) are all in place. M05–M10 established, in order: the
contract/package model (a contract is a concept, not a framework;
`packages/` is a reusable source boundary, not a nested monorepo); the
development lifecycle (`UNDERSTAND → PLAN → IMPLEMENT → VALIDATE →
REVIEW → RECORD → COMPLETE`); the capability model (instruction/
workflow/skill/tool/package/agent kept distinct — `validate-repository`
remains the only skill); the development loop (`OBSERVE → UNDERSTAND →
HYPOTHESIZE → PLAN → CHANGE → VERIFY → EVALUATE`, nested inside
IMPLEMENT); the engineering graph model (a typed relationship vocabulary
— `depends-on`, `blocks`, `affects`, ... — distinct from the untyped
`related:` cross-reference, no graph engine); and the package source
model's remaining detail (`.agent/instructions/packages.md` — package
definition, extraction criteria, workspace/TS-consumption/distribution
conventions). **No package, app, server, or deployable agent exists
yet** — none has met the demonstrated-reuse or concrete-need bar those
milestones establish. A clean clone can run
`pnpm install && pnpm run validate` successfully. See `architecture.yaml`
for the full milestone roadmap and current phase marker, or
`.project/state/PROJECT-STATE.md` for the live status (including a note
on M10's roadmap-numbering correction).

## Quality gate

```text
pnpm install
pnpm run lint        # ESLint (flat config, typescript-eslint, Prettier-compatible)
pnpm run typecheck   # tsc -b, strict mode
pnpm run test        # Vitest
pnpm run build       # tsc -b
pnpm run validate    # runs all four in sequence
```

Also available: `pnpm run format` / `pnpm run format:check` (Prettier).
