# Project State

## Current phase

M03.2 - First Workspace Bootstrap

STATUS: COMPLETE

UI, PACKAGE MANAGER, AND MODULE RECONCILIATION: 2026-09-17

## Implemented

- The repository remains the workspace. The repository-owned control plane, project manifests, dependency graph, task runner, affected analysis, cache, checks, scans, and execution profiles remain the monorepo foundation.
- pnpm 11.19.0 is the actual workspace package manager. `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `workspace:*` internal dependencies, package scripts, project tasks, CI, generator defaults, and operating guidance are aligned; the npm workspace field and `package-lock.json` were removed.
- pnpm dependency build scripts are deny-by-default except for the explicit `esbuild` and `unrs-resolver` allowlist required by installed tooling.
- `packages/ui` is an operational strict TypeScript workspace package with controlled compiled exports, package-local shadcn configuration, a generated shadcn Button primitive, generic PageHeader, PageShell, and MessageState compositions, and a component test.
- `apps/web` consumes generic UI only through the `@workspace/ui` root API. Application-specific workspace components remain local, while the former app-local primitive, layout, feedback, and utility implementations were removed.
- Tailwind CSS scans the UI package source and applies the shared shadcn CSS-variable tokens. The rendered home route composes the package Button through application-owned workspace UI.
- API constants are categorized under `constants/errors`, `constants/http`, and `constants/runtime`, with controlled category and root exports. Existing categorized web, API, and shared types remain in their owning boundaries.
- MongoDB remains server-owned under `servers/api/integrations/mongodb`; no database package or speculative integration was introduced.
- Architecture validation enforces pnpm workspace policy, `workspace:` dependencies, the native-build allowlist, UI ownership, named shadcn primitive ownership, feature ownership, package export surfaces, deep-import boundaries, categorized module exports, and constants/types dumping-ground rules.
- New and refactored code remains functional and compositional, with no classes, dependency-injection containers, mutable global state, or explicit `any`.

## Validated

- A frozen pnpm install succeeds across its six-package scope (the root plus five project workspaces) and executes only the two allowlisted dependency build scripts.
- Repository syntax, architecture, security scan, project discovery, and package-manager checks pass with no issues.
- All five TypeScript workspaces pass independent `tsc --noEmit`: web, API, UI, logging, and shared types.
- All five TypeScript workspaces pass independent ESLint tasks.
- Production builds pass for web, API, UI, logging, and shared types. Next.js compiled and type-checked the app and generated `/` and `/_not-found`.
- 42 control-plane tests pass. Fourteen workspace tests pass: four web, eight API, one UI, and one logging test.
- The shadcn 4.21.0 CLI and package-local `ui:add` workflow are operational, and package exports resolve from the web tests and production build.
- Controlled failures detected all required representative violations: duplicate shadcn primitive, flat constants, unexported package deep import, invalid workspace dependency, feature UI inside `packages/ui`, and generic UI inside `apps/web`. All temporary files and manifest changes were removed, and the real tree passes cleanly afterward.
- Production runtime smoke checks returned HTTP 200 from the web application, rendered the expected UI-package-backed content, and returned the healthy API payload from `/health` with startup and request logging.
- `git diff --check` passes.

## Deferred

- A required live MongoDB connection, feature repositories, models, and live-provider integration coverage remain deferred until a persistence-backed feature exists.
- Remote artifact storage, distributed execution, deployment-specific standalone web packaging, and production observability infrastructure remain deferred until operational requirements justify them.

## Not applicable

- Authentication, users, sessions, and authorization are outside M03.2 and were not introduced.
- `packages/validation` is not justified because current environment schemas are runtime-specific and not shared.
- Additional feature, form, navigation, persistence, or infrastructure folder hierarchies are not justified by current source responsibilities.

## Next milestone

M03.3 - Auth Vertical Slice Design. Authentication is not implemented in the current workspace.
