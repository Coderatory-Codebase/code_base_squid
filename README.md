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

**M01–M09 are complete.** The root definition artifacts exist (`README.md`,
`architecture.yaml`, `AGENTS.md`, `CLAUDE.md`); the pnpm/TypeScript
workspace, lint/format/test/build tooling, and CI foundation are in place;
`.agent/` establishes the minimum agent operating system; `.project/`
establishes the project memory/artifact system; M05 establishes the
contract/package model — a contract is a concept (a type, interface,
schema, API spec, or event definition, as the boundary needs), not a
framework, and `packages/` is a reusable source boundary, not a nested
monorepo; M06 establishes the development lifecycle — a shared
`UNDERSTAND → PLAN → IMPLEMENT → VALIDATE → REVIEW → RECORD → COMPLETE`
protocol that the feature/bugfix/refactor/review workflows reference
instead of each restating; M07 establishes the capability model —
instruction/workflow/skill/tool/package/agent kept explicitly distinct,
with `validate-repository` remaining the repository's only skill; and M08
establishes the development loop — `OBSERVE → UNDERSTAND → HYPOTHESIZE →
PLAN → CHANGE → VERIFY → EVALUATE`, the iterative reasoning nested inside
M06's IMPLEMENT stage, distinguishing fact/assumption/hypothesis/decision
and evidence-based stopping from unlimited retries; and M09 establishes
the engineering graph model — a documented vocabulary of typed
relationships (`depends-on`, `blocks`, `affects`, `owned-by`, ...)
distinct from the existing untyped `related:` cross-reference, with no
graph engine or database (`.agent/instructions/engineering-graph.md`).
No package currently exists — one is added once a capability has
demonstrated reuse across ≥2 independent deployables (see
`.project/decisions/ADR-008`). A clean clone can run
`pnpm install && pnpm run validate` successfully. There are still no
apps, servers, or deployable agents — those land in M10 onward. See
`architecture.yaml` for the full milestone roadmap and current phase
marker, or `.project/state/PROJECT-STATE.md` for the live status.

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
