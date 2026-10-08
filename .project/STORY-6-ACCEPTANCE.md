# Story 6 acceptance review: organization lifecycle

## Implemented contract

- `PATCH /organizations/:organizationId/lifecycle` accepts `archive`, `restore`, or `delete` with a non-negative `expectedVersion`.
- Only the organization owner may transition lifecycle state. Invalid transitions return `400`, unauthorized requests return `401`, non-owners return `403`, missing organizations return `404`, and stale concurrent updates return `409` with the latest lifecycle state.
- Archive and restore are reversible. Delete is a soft-delete and is only allowed after archiving. Every successful transition increments the lifecycle version.
- Persistence checks owner, current state, and expected version in the same atomic MongoDB update. Organization lists omit deleted records; dashboards remain readable while archived and omit deleted records.
- Invitations, invitation acceptance, member role changes, and member removal require the organization to be active at their persistence boundary. Existing organization information remains readable while archived.
- Owner controls are available on the organization dashboard. Deletion requires browser confirmation; action feedback is announced through a polite status region, and failed requests restore the server-reported/current state.
- Archived records are retained indefinitely. Soft-deleted records are retained indefinitely until legal, product, and on-call owners approve a retention period and a separate purge migration. The policy is recorded in `enablers/observability/workspace/organization-lifecycle-retention.json`.
- The idempotent schema/index migration is `servers/api/migrations/20261007-organization-deletion-archive.ts`.

## Scope boundary and remaining acceptance

This repository has no first-class Workspace model or workspace rename/write API. Lifecycle state therefore cannot be enforced at downstream workspace mutation boundaries. Cross-instance transition latency has not been measured. These guarantees require that missing workspace write surface and a distributed test; they are not claimed by this implementation.

Production retention enforcement, browser keyboard/screen-reader review, independent engineer approval, and fresh CI are external or environment-dependent sign-offs. A Mongo-backed transition/race test must be run where MongoMemoryServer starts successfully.

## Verification

- Lifecycle domain/service and HTTP route coverage lives in `servers/api/features/workspace/tests/organization-lifecycle.test.ts` and `servers/api/features/workspace/tests/organization.route.test.ts`.
- Mongo-backed lifecycle transition and archived-write guard test passed in isolation; it verifies stale-version rejection, restore, and soft-delete against a disposable database.
- Dashboard lifecycle accessibility coverage lives in `apps/web/tests/integration/organization-lifecycle-accessibility.test.tsx` and is part of the standard web test command.
- Run focused checks with `pnpm --filter @workspace/api typecheck`, `pnpm --filter @workspace/api exec tsx --test features/workspace/tests/organization-lifecycle.test.ts features/workspace/tests/organization.route.test.ts`, `pnpm --filter @workspace/web typecheck`, and `pnpm --filter @workspace/web exec tsx --test tests/integration/organization-lifecycle-accessibility.test.tsx`.
- The standard web suite passed 25/25 tests. API typecheck and build passed; focused lifecycle/domain and route tests passed 14/14. The isolated Mongo lifecycle persistence test passed. Lifecycle-scoped API lint and web lifecycle lint passed. The full API lint command still reports pre-existing no-await test stubs in `members.service.test.ts` and findings in auth/organization gateway files.
