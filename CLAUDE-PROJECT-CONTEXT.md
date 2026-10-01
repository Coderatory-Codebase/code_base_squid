# `code_base_squid` — Claude Project Context

This is the primary handoff document for an agent working on this repository. Read it first, then read `AGENTS.md`, `architecture.yaml`, and only the narrow agent guide relevant to the requested change.

## What this repository is

`code_base_squid` is an **agent-native pnpm monorepo foundation**, not yet a finished product. It provides a deliberately small, validated starting point for a Next.js web app and an Express API. The implemented runtime feature is a health endpoint and a home page which proves the web-to-API boundary. Authentication and product business features have **not** been implemented.

Current recorded phase: `M03.2 – First Workspace Bootstrap` (complete). The next stated milestone is **M03.3 – Auth Vertical Slice Design**.

The repository itself is the workspace. Do **not** add a mandatory project-name folder between the repository root and `apps/`, `servers/`, `packages/`, or `prebuilt/`.

## Non-negotiable architecture

```text
Agent / policy plane: .agent/, .project/, AGENTS.md, CLAUDE.md, architecture.yaml
Control plane:        codebase/              (custom repository orchestration)
Code plane:           apps/, servers/, packages/, prebuilt/
Enabler plane:        enablers/              (operations and platform support)
```

- `codebase/` owns discovery, dependency graphing, planning, task ordering, caching, repository-specific checks/scans, result normalization, and the repo CLI.
- Do **not** introduce Nx, Turborepo, Lerna, or another monorepo orchestrator.
- Let standard tools do their own jobs: pnpm for packages/audit, `tsc` for types, ESLint for linting, each project’s declared test runner for tests, and TruffleHog for secret scanning.
- Use functional modules, immutable values, pure functions where practical, and explicit dependency objects/factories. Do not add classes, inheritance, DI containers, service locators, or mutable global registries.
- Grow the structure only when a concrete product need requires it. Do not create empty folders, speculative packages, auth scaffolding, provider integrations, or persistence layers.

## Workspace map

| Unit | Role | Current responsibility |
| --- | --- | --- |
| `apps/web` | Next.js 16 / React 19 application | Thin App Router UI; public `/` demonstrates the foundation and links to API health. |
| `servers/api` | Express 5 API runtime | Configured HTTP server, CORS, JSON/error middleware, `/health`, optional Mongo lifecycle. |
| `packages/ui` | Generic React UI package | shadcn `new-york` primitives, Tailwind tokens, generic `PageHeader`, `PageShell`, `MessageState`, Button. |
| `packages/types` | Shared contracts | Categorized API environment, error, and health TypeScript contracts. |
| `packages/logging` | Shared logging | Pino-based structured application and HTTP logger. |
| `packages/tsconfig` | Shared compiler policy | Strict base policy plus Node and Next presets. |
| `packages/eslint-config` | Shared lint policy | Node, React, and Next ESLint configs. |
| `codebase` | Repository control plane | Custom CLI, manifests, graph, task runner, cache, checks, scans, generators. |
| `enablers` | Operational support | Reserved for concrete infrastructure/operations capability; no runnable unit yet. |
| `prebuilt` | Reusable composed solutions | Reserved; no solution exists yet. |

Internal dependencies must use `workspace:*`. `pnpm-workspace.yaml` is authoritative. The required package manager is `pnpm@11.19.0` and Node is `>=20.19.0`.

## Runtime behaviour and request flow

```text
Browser
  -> apps/web (Next App Router, public home route)
     -> reads NEXT_PUBLIC_API_BASE_URL
     -> renders local workspace-foundation feature using @workspace/ui
     -> links to GET {API_BASE_URL}/health

API process
  -> validates environment
  -> creates Pino logger and optional MongoDB integration
  -> creates Express app
     -> HTTP logger -> CORS -> JSON parser -> health router -> 404 -> error handler
  -> GET /health returns { status: "ok", service, environment }
```

`servers/api/integrations/mongodb` is a server-owned adapter. MongoDB is optional: without `MONGODB_URI` the API starts without persistence and logs that fact. Future feature repositories should depend on this integration contract, not import Mongoose directly. Do not extract a database package until a second runtime genuinely needs it.

## Important source locations

### Web

- `apps/web/app/layout.tsx` — global document and metadata.
- `apps/web/app/(public)/page.tsx` — thin public home route; obtains validated API configuration and composes the feature.
- `apps/web/features/workspace-foundation/` — application-owned foundation display (`WorkspaceFoundation`, runtime summary, API-health link). This is an example feature, not generic UI.
- `apps/web/config/` and `apps/web/validation/env.validation.ts` — validates `NEXT_PUBLIC_API_BASE_URL` as a URL.
- `apps/web/.env.example` — local default: `http://127.0.0.1:4000`.

### API

- `servers/api/server.ts` — runtime composition and graceful SIGINT/SIGTERM shutdown.
- `servers/api/bootstrap/create-app.ts` — Express middleware and feature-router composition.
- `servers/api/features/health/` — reference feature. `routes` compose delivery, `controllers` translate HTTP, and `services` own the health operation.
- `servers/api/middleware/errors.ts` — Zod, application-error, 404, and unknown-error response boundary.
- `servers/api/config/` + `validation/env.validation.ts` — validates API environment. No default values are allowed in environment validation.
- `servers/api/.env.example` — expected local API settings; `MONGODB_URI` is optional.

### Packages

- `packages/ui/src/index.ts` — **only supported public UI import surface**. Application code must import from `@workspace/ui`, not internal UI files.
- `packages/ui/src/primitives/` — package-owned official shadcn primitives. Add a suitable primitive via `pnpm run ui:add <name>`; do not hand-copy a competing named primitive.
- `packages/ui/src/styles/theme.css` — shared semantic theme tokens, consumed by `apps/web/app/globals.css`.
- `packages/types/src/api/` — categorized shared contracts. Promote types here only when they genuinely cross a workspace boundary.
- `packages/logging/src/` — `createLogger` and HTTP logging adapter. Pretty local output is used outside production; production remains JSON.

### Control, governance, and project knowledge

- `architecture.yaml` — machine-readable authoritative policy. It is JSON-compatible YAML and must remain parseable by Node without a YAML dependency.
- `AGENTS.md` — operating rules and command list.
- `.agent/instructions/architecture.md` — ownership and feature boundary rules.
- `.agent/instructions/ui-composition.md` — shadcn/Tailwind composition rules.
- `.agent/instructions/integrations.md` — external system boundary rules.
- `.agent/standards/{development,testing,types-validation}.md` — implementation standards.
- `.project/PROJECT-STATE.md` — durable implementation/validation record and deferred work.
- `.github/workflows/control-plane.yml` — CI: frozen pnpm install, commitlint, then `pnpm run validate`.

## How to make a change

1. Classify it first: application, reusable package, infrastructure/enabler, project knowledge, foundation, or control plane. Application work does not authorize a foundation/control-plane refactor.
2. Read `AGENTS.md`, `architecture.yaml`, and the narrowest relevant guide listed above.
3. Inspect the target unit through the repo CLI before editing.
4. Keep product behavior owned by a feature. Server features live in `servers/<runtime>/features/<feature>/` and external consumers use the feature root `index.ts`, never deep imports.
5. Add only necessary layers. A small server feature may use flat role-named files. Use `routes/`, `controllers/`, `services/`, `repositories/`, etc. only when each is a meaningful boundary. Create `domain/` only for real framework-independent domain complexity.
6. Keep pages thin. UI composition direction is:

   ```text
   shadcn primitive -> packages/ui generic component/composition
   -> application UI -> feature UI -> page/route
   ```

7. Validate at the smallest useful scope, then run broader checks appropriate to the blast radius. Record material architecture changes in durable project documentation.

## Commands

Run all commands from this repository root after installing dependencies with the pinned pnpm version.

```text
pnpm run projects                         # discover units
pnpm run graph                            # internal dependency graph
pnpm run tasks                            # available tasks
pnpm run affected                         # changed units
pnpm run repo -- plan <task> --affected   # inspect execution plan
pnpm run dev                              # web + API (concurrency 2)
pnpm run build
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run check                            # repository architecture/governance checks
pnpm run scan                             # pnpm audit + managed TruffleHog scan
pnpm run validate                         # full validation pipeline
```

The custom CLI supports `--dry-run` to inspect execution and `--json` for stable machine-readable output. Prefer it over ad-hoc workspace discovery/task scripts.

## Boundaries and decisions Claude must preserve

- Packages cannot import apps, servers, or prebuilt units. Apps and servers cannot import one another directly.
- Server domain code cannot depend on Express, Mongoose, Next, Redis, routes/controllers/models, or UI. Services cannot depend on routes/controllers/UI.
- Configuration validates and exposes values; it does not create external clients.
- Runtime-specific schemas stay local. Create `packages/validation` only after a schema is actually shared across boundaries.
- Generic UI is in `packages/ui`; product/feature UI stays under the owning app feature. Do not recreate `components/ui`, `components/layout`, or `components/feedback` inside an app.
- Keep the API's current 404/error contracts and categorized constants/types instead of making catch-all dumping-ground modules.
- Commit messages use Conventional Commits. Branches follow `feature|fix|refactor|perf|test|docs|build|ci|chore|hotfix|release/<kebab-case>`.

## Intentional gaps (do not treat as defects)

- No authentication, users, sessions, authorization, or route guards.
- No persistence-backed feature, model, repository, or live MongoDB test.
- No live external-provider coverage, queues, cache, payments, email, object storage, or observability service.
- No remote artifact cache, distributed execution, or deployment-specific standalone Next packaging.
- No `packages/validation` package yet; current runtime environment schemas are not shared.
- No prebuilt or enabler workspace unit yet.

## Good first task: authentication vertical slice

If asked to begin M03.3, first design the smallest user-facing authentication slice and identify its actual contracts, routes, storage needs, and UI. Do not pre-create a full auth architecture. Keep server code feature-owned (for example, `servers/api/features/auth/`), keep app UI feature-owned, introduce an external integration only when an actual provider is selected, and extract shared types/schemas only where both web and API truly need the same boundary contract.

## Current confidence and caveat

`.project/PROJECT-STATE.md` records a previously clean, full validation: strict type checks, ESLint, production builds, control-plane/workspace tests, audit, TruffleHog scan, and runtime smoke tests. In the present working environment, the `pnpm` executable was not available on `PATH`, so this handoff document was reviewed against source/manifests and has not rerun those commands here.
