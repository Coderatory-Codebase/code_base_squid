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

The foundation now includes the root definition artifacts, `.agent/`
(agent operating system), `.project/` (project memory), `tooling/`
(quality scripts and Git hooks), and a project-owned MERN/Next.js seed
application under `apps/test/web` and `servers/test/api`. The seed app is
reference/proof material for the operating layer, not the whole repo.

Current operating work is M26: realigning the repo around explicit
request routing, dual operating scope (foundation brain plus
project/product brains), dual-track discovery/delivery,
pre-implementation artifacts, current architecture in
`architecture.yaml`, and the first stack skill
(`.agent/skills/mern-nextjs-vertical-slice`). Phase 1 Intake is now
implemented as an agent-executed `REQ-*` capture workflow under
`.project/requirements/`, covered by `tooling/tests/intake.test.mjs`. See
`architecture.yaml` for current architecture and active phase, and
`.project/state/PROJECT-STATE.md` for live status.

## Quality gate

```text
pnpm install
pnpm run lint                 # ESLint (flat config, typescript-eslint, Prettier-compatible)
pnpm run typecheck            # tsc -b, strict mode
pnpm run test                 # Vitest
pnpm run build                # tsc -b
pnpm run validate:architecture  # forbidden/undeclared top-level directories
pnpm run secrets:scan         # baseline secret-pattern scan
pnpm run validate             # runs all six in sequence
```

Also available: `pnpm run format` / `pnpm run format:check` (Prettier).

`pnpm install` also installs working Git hooks (`commit-msg`,
`pre-commit`, `pre-push` — see `tooling/git-hooks/`); re-run
`pnpm run hooks:install` to (re)verify. Hooks give fast local feedback and
are bypassable (`--no-verify`); CI (`.github/workflows/ci.yaml`) is the
authoritative gate. Full model:
`.project/specs/SPEC-009-repository-structure-git-governance-and-quality-enforcement.md`,
agent-facing entry point: `.agent/instructions/git-governance.md`.
