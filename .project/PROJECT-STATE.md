# Project State

## Current phase

M03.2 — First Workspace Bootstrap

STATUS: COMPLETE

REMEDIATED: 2026-09-16

DEEP REMEDIATION: 2026-09-16

ARCHITECTURE RECONCILIATION: 2026-09-16

## Implemented

- Code, control, and agent planes have explicit roots.
- Workspace units are discovered directly under the configured physical roots through `project.json` manifests, with no mandatory project namespace.
- `apps/web` and `servers/api` are documented defaults; neither is created without a real runtime requirement, and custom names are supported.
- Internal workspace-unit and task dependency graphs are validated and ordered.
- Workspace-unit tasks can be planned and executed through the repository CLI.
- Changed files map to owning workspace units and propagate through reverse dependencies.
- Affected task plans include only affected work and required task dependencies.
- Local, affected, pull-request, main, and release execution profiles are defined.
- Independent tasks can execute concurrently with dependency failure propagation and structured results.
- Cache-enabled tasks use source, dependency, architecture, and selected environment fingerprints and require outputs to exist.
- Correctness checks and risk scans are separate commands.
- Core source dependency boundaries are executable architecture checks.
- Feature-first server guidance uses optional flat role-named files, with `domain/` introduced only for meaningful domain complexity.
- Domain, service, UI, workspace-unit, and feature boundaries recognize both configured directory segments and flat filename roles.
- Root, agent, project-state, and executable architecture contracts agree on functional composition and progressive growth.
- CLI planning and execution support affected selection, dry runs, JSON, verbose output, and concurrency limits.
- Validation covers architecture configuration, registry, paths, dependencies, task references, cycles, boundaries, and missing workspace-unit manifests where a package definition identifies one.
- GitHub Actions delegates pull-request and main validation to repository-owned execution profiles.
- Control-plane discovery, graph, affected analysis, planning, execution, caching, CLI, configuration, and boundaries have automated tests.

## Workspace units

- `apps/web` is the primary Next.js 16.3.5 and React 19.3 application, using the App Router, strict TypeScript 5.9, Tailwind CSS 4, ESLint, and an explicit shadcn CLI workflow with a generated Button, configured aliases, and theme tokens.
- `servers/api` is the primary Express 5.2 API runtime, using strict TypeScript, environment-loaded and separately validated configuration, structured functional errors, a local Mongoose 9 connection boundary, graceful shutdown, and `GET /health`.
- `packages/logging` exposes the intentional `@workspace/logging` public API around Pino application logging and Morgan HTTP request logging; the API consumes it through the workspace package export.
- `packages/types` owns the categorized public API health and error contracts consumed by the server, without absorbing application-private types.
- `packages/mongodb` owns reusable Mongoose connection mechanics behind an explicit functional client contract; `servers/api/integrations/mongodb` owns API-runtime composition, optional persistence, and logging.
- `enablers/observability` owns future operational observability configuration, while an executable architecture rule prohibits duplicate server-local observability implementations.
- Web and API remain independently buildable workspace units and communicate only through the configured HTTP boundary; the control plane can run their long-lived development tasks concurrently.
- npm workspaces and the root `package-lock.json` are the sole package-management foundation.

## Bootstrap structure

- Web routing owns `layout`, home, loading, error, and not-found entry points and composes reusable UI instead of defining page-scale implementations.
- The web unit has dedicated `types/`, `validation/`, `config/`, and `constants/` boundaries. Generic page-shell, header, and feedback components compose the shadcn primitive, while focused workspace components own bootstrap-specific meaning. No feature directory exists yet.
- The API has dedicated `types/`, `validation/`, `config/`, `constants/`, and `errors/` boundaries. Error codes, messages, and HTTP statuses are fixed constants; functional error values carry structured code, status, message, and optional dynamic details.
- Committed `.env.example` files document required values. Ignored local `.env` files drive development runtimes, and validation schemas contain no environment defaults.
- Every TypeScript workspace unit explicitly enables the repository's strict compiler-option set. Repository validation enforces those options, app/server type barrels, absence of explicit `any`, validation ownership, and environment-driven schemas.
- TypeScript component props, page contracts, reusable function boundaries, API configuration, responses, errors, and runtime handles are explicitly typed; only genuinely private implementation shapes remain local.
- UI dependency direction is explicit and enforced: shadcn primitives compose into generic layout/feedback components, then application UI and thin pages. Named shadcn replacements outside the primitive root are rejected.
- Shared contract and validation ownership follow earned reuse. Cross-workspace API contracts live in categorized `packages/types`; no shared validation package exists because the current environment schemas are runtime-specific rather than duplicated contracts.
- External systems require integration boundaries. Vendor initialization cannot be hidden in server config, while reusable infrastructure and runtime-specific composition remain distinct.
- Testing follows behavior and boundaries rather than file count: deterministic adapters use unit tests, route/package/runtime composition uses integration tests, component tests require behavior, and end-to-end tests are reserved for real journeys.
- `AGENTS.md` maps agents to focused architecture, UI, integration, type/validation, testing, and development guides under `.agent/`; `architecture.yaml` and repository validators encode the objectively enforceable rules.

## Validation evidence

- All 35 control-plane tests pass, including UI composition direction, shadcn primitive ownership, external integration placement and reusable-package substitution, strict compiler options, type boundaries, explicit `any`, environment-schema defaults, config-owned validation, and API-local observability.
- All 13 workspace tests pass across logging, reusable MongoDB infrastructure, API-to-package integration, API health, structured error context, required environment validation, derived configuration, and environment-to-page composition.
- All workspace units pass strict TypeScript checks, ESLint, and production builds through the repository control plane.
- Runtime smoke tests verify the web page, API `/health`, structured startup and Morgan request logs, and graceful API shutdown.
- The local shadcn CLI command resolves from the web workspace, and workspace package exports resolve without relative cross-unit imports.
- Repository validation, architecture checks, security scanning, module parsing, dependency audit, and Git whitespace checks pass.

## Deferred until justified

- Remote artifact storage and distributed execution.
- A custom external package installer or resolver.
- Framework-specific project templates without a concrete project requirement.
- Empty feature, infrastructure, or project-knowledge folder trees.
- Authentication, users, sessions, authorization, and all other business features.
- A required MongoDB runtime connection; `MONGODB_URI` remains optional until the first persistence-backed feature.
- Extraction of errors, validation, or UI into reusable packages until real cross-boundary reuse is demonstrated.
- Live MongoDB integration coverage and feature repositories until persistence becomes required by a real feature.
- Deployment-specific standalone web packaging and production observability infrastructure.

## Next milestone

M03.3 — Auth Vertical Slice Design. Authentication is not implemented in the current workspace.
