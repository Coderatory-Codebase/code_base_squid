# code_base_squid

This repository is a pnpm monorepo with a Next.js web app in `apps/web` and an Express API in `servers/api`. Run `pnpm install` from the repository root, then use `pnpm run dev` to start both development servers.

## Organization workspace

The organization workspace is available at `/workspace/organization` after signing in at `/sign-in`. It lists organizations owned by the signed-in user, connected to one of that user's workspaces, or joined as an organization member, 50 at a time. Further pages load as you scroll, with a keyboard-accessible **Load more organizations** control; lists of exactly 50 do not request or show an empty second page. The list is loaded through authenticated server requests and does not expose the session token to browser-side JavaScript. If the list is empty, use **Set up an organization** to create one.

Open an organization to view its dashboard at `/workspace/dashboard/<organization-id>`. Owners and admins can invite members using a seven-day single-use link, change member roles, and remove members. Invitees must sign in with the invited email address. Dashboard counts reflect stored team memberships and linked workspace IDs; this repository does not yet store resource-consumption telemetry or define a separate Workspace entity.

For a local preview account, configure `MONGODB_URI`, `PREVIEW_USER_EMAIL`, `PREVIEW_USER_PASSWORD`, and `PREVIEW_WORKSPACE_ID` in the API environment, start the API, then run `pnpm --filter @workspace/api seed:preview`. Set `NEXT_PUBLIC_API_BASE_URL` in the web environment to the API base URL. Keep real credentials in ignored environment files; `.env.example` documents the variable names.

See [the workspace feature contract and runbook](servers/api/features/workspace/README.md) for API behavior and operational guidance.

See the [Story 5 acceptance review](.project/STORY-5-ACCEPTANCE.md) for first-page performance, pagination, and organization-list telemetry status.

## Repository commands

Use `pnpm run projects`, `pnpm run graph`, `pnpm run tasks`, `pnpm run check`, `pnpm run validate`, and `pnpm test` from the repository root to inspect and validate the workspace.

## Task 1 and Task 2 validation

GitHub Actions validation passed for [PR #5](https://github.com/Coderatory-Codebase/code_base_squid/pull/5), commit `b6774abaacd22f4c2f7041b1fe5cf40c1c847cff`. The [validate job](https://github.com/Coderatory-Codebase/code_base_squid/actions/runs/37146423798/job/111271208564) completed successfully, including the frozen-lockfile install, PR commit validation, and `pnpm run validate` (tests, lint, typecheck, and build).

See the [Task 2 acceptance review](.project/TASK-2-ACCEPTANCE.md) for test coverage and remaining Definition of Done items.

See the [Story 3 acceptance review](.project/STORY-3-ACCEPTANCE.md) for the dashboard, RBAC, invitation-security, accessibility, and performance evidence.
## Squid integration notes

### Kernel scoped collection handle (`servers/api/kernel/gateway`)

- `createScopedHandle`: workspace-bound find/insert/update/softDelete, with no unscoped method.
- Updates are version-conditional (ARC-008); conflicts use `version_conflict`.
- A query without workspace scope throws `workspace_required` before reaching the driver.
- New error codes are declared in `ApiErrorCode` (`packages/types`).
- Deferred: Mongo adapter for `RawCollection`, policy-binding check, collection allow-list, and kernel 409 mapping in the service layer.

### Tenant isolation proof (PACK-TENANT)
- `servers/api/integrations/mongodb/scoped-collection.ts`: Mongo implementation of the kernel `RawCollection` port.
- `servers/api/integrations/mongodb/tests/pack-tenant.test.ts`: replica-set test proving cross-tenant reads/writes are blocked and missing workspace scope makes zero driver calls.
- `mongodb-memory-server` build scripts are explicitly governed by `pnpm-workspace.yaml`; the Mongo binary downloads on first test run.
- `integrations/mongodb/scoped-collection.ts`: Mongo implementation of the kernel `RawCollection` port.
- `integrations/mongodb/tests/pack-tenant.test.ts`: replica-set test (mongodb-memory-server) proving cross-tenant reads/writes are blocked and no-workspace calls make zero driver calls.
- `mongodb-memory-server` build script is explicitly declined in `pnpm-workspace.yaml` (`allowBuilds: false`); the mongod binary downloads on first test run.
- Deferred: collection allow-list, policy-binding check, CI cache for the mongod binary.
