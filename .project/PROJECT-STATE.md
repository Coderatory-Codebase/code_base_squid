# Project State

## Current phase

M03.2 — First Workspace Bootstrap

STATUS: COMPLETE

REMEDIATED: 2026-09-16

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

- `apps/web` is the primary Next.js 16.3.5 and React 19.3 application, using the App Router, strict TypeScript 5.9, Tailwind CSS 4, ESLint, and a working shadcn/ui Button with its generated import path and theme tokens.
- `servers/api` is the primary Express 5.2 API runtime, using strict TypeScript, separated Zod environment validation, a local Mongoose 9 connection boundary, composed logging and error middleware, graceful shutdown, and `GET /health`.
- `packages/logging` exposes the intentional `@workspace/logging` public API around Pino application logging and Morgan HTTP request logging; the API consumes it through the workspace package export.
- `enablers/observability` owns future operational observability configuration, while an executable architecture rule prohibits duplicate server-local observability implementations.
- Web and API remain independently buildable workspace units and communicate only through the configured HTTP boundary; the control plane can run their long-lived development tasks concurrently.
- npm workspaces and the root `package-lock.json` are the sole package-management foundation.

## Bootstrap structure

- Web routing owns `layout`, home, loading, error, and not-found entry points.
- The web unit separates environment access, Zod validation, derived API configuration, fixed constants, shell UI, and its shadcn/ui foundation. No feature directory exists yet.
- The API separates environment access, Zod validation, derived runtime configuration, and fixed constants, then composes logging, database, middleware, app, and HTTP server through explicit functional dependencies. No business feature exists yet.
- Environment guidance is provided through unit-local `.env.example` files; secrets and local environment files are ignored.
- Every TypeScript workspace unit explicitly enables the repository's strict compiler-option set, and repository validation enforces both the presence of `tsconfig.json` and those options.

## Validation evidence

- All M03/M03.1 control-plane tests pass, with three additional remediation checks covering strict TypeScript configuration and API-local observability ownership.
- Logging, API health, error-boundary, environment-validation, and web server-render tests pass, including rendering the generated shadcn/ui Button.
- All workspace units pass strict TypeScript checks, ESLint, and production builds through the repository control plane.
- Runtime smoke tests verify the web page, API `/health`, structured startup and Morgan request logs, and graceful API shutdown.
- Repository validation, architecture checks, security scanning, module parsing, workspace package resolution, dependency audit, and Git whitespace checks pass.

## Deferred until justified

- Remote artifact storage and distributed execution.
- A custom external package installer or resolver.
- Framework-specific project templates without a concrete project requirement.
- Empty feature, infrastructure, or project-knowledge folder trees.
- Authentication, users, sessions, authorization, and all other business features.
- A required MongoDB runtime connection; `MONGODB_URI` remains optional until the first persistence-backed feature.
- Extraction of database, errors, validation, or UI into reusable packages until real cross-boundary reuse is demonstrated.
- Deployment-specific standalone web packaging and production observability infrastructure.

## Next milestone

M03.3 — Auth Vertical Slice Design. Authentication is not implemented in the current workspace.
