# Workspace feature contract and runbook

## Module contract

- `GET /organizations` requires a valid bearer session and returns an array of `{ id, name }` summaries.
- The query includes live organizations owned by the principal or connected to one of the principal's workspace IDs. Deleted and unrelated organizations are excluded. Results sort by most recently used, then name.
- `POST /organizations` requires a valid bearer session and a trimmed name from 1 to 80 characters. The organization policy must allow `organization:create` for the authenticated principal before persistence runs.
- The feature owns its Organization model and query gateway. Authentication owns User and Session models; session tokens are random, only their SHA-256 hashes are stored, and sessions expire after eight hours.
- The web app reads its `workspace_session` HttpOnly cookie in the Server Component and calls the API through `apps/web/features/organizations/organizations.gateway.ts`. The token is sent in the server-to-server request and is not read by client JavaScript.

## Signals and thresholds

The API HTTP access logger records status and elapsed time for `/auth/*` and `/organizations` requests. The API gateway and web list have regression tests that require p95 below 700 ms for a 50-organization dataset. This is a test threshold; the repository does not currently configure a production latency alert provider.

## Runbook

If organization requests return 401, sign in again and confirm the session exists and has not expired. For 5xx responses, check API request logs and `/health`, then verify the API's MongoDB connection. If the 50-record latency test exceeds its 700 ms threshold, inspect the query plan and confirm the `workspaceIds_1` index is used before changing the query or index policy. The list view shows a retry action for a failed query and never renders partial results.

## Security and isolation checks

`servers/api/features/workspace/tests/organization.gateway.test.ts` verifies owner and workspace membership scoping, deletion filtering, unrelated-tenant exclusion, sorting, and index use. `servers/api/tests/collection-allow-list.test.ts` pins the current Mongoose collection set (`organizations`, `sessions`, `users`). Organization command tests verify that missing, denied, wrong-action, and wrong-subject policy decisions cannot reach persistence.
