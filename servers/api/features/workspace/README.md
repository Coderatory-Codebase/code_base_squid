# Workspace feature contract and runbook

## Module contract

- `GET /organizations` requires a valid bearer session and returns an array of `{ id, name }` summaries.
- The query includes live organizations owned by the principal or connected to one of the principal's workspace IDs. Deleted and unrelated organizations are excluded. Results sort by most recently used, then name.
- `POST /organizations` requires a valid bearer session and a trimmed name from 1 to 80 characters. The organization policy must allow `organization:create` for the authenticated principal before persistence runs.
- The feature owns its Organization model and query gateway. Authentication owns User and Session models; session tokens are random, only their SHA-256 hashes are stored, and sessions expire after eight hours.
- The web app reads its `workspace_session` HttpOnly cookie in the Server Component and calls the API through `apps/web/features/organizations/organizations.gateway.ts`. The token is sent in the server-to-server request and is not read by client JavaScript.

## Signals, dashboard, and thresholds

Every `/organizations` request emits `organization.request.signal` with `workspace=Platform`, `module=workspace`, operation, status, outcome, and `durationMs`, including 4xx/5xx responses. The Grafana dashboard definition is `enablers/observability/workspace/organization-dashboard.json`; it charts request volume, error rate, and p95 latency from the API's structured JSON logs. Import it into the Grafana instance connected to the central Loki log source to make it visible.

The machine-readable alert policy is `enablers/observability/workspace/organization-alert-policy.json`. It proposes an error rate above 5% for five minutes (minimum 20 requests) and request p95 above 700 ms for five minutes. **On-call ratification is still pending**; do not enable paging until the workspace rotation records its approver and approval date in that file. Central log-platform owners must enforce the stated 30-day telemetry retention. These external operational actions cannot be completed by repository changes alone.

## Runbook

For 401 responses, sign in again and confirm the session exists and has not expired. For 5xx responses or elevated error rate, inspect the dashboard's error rate and request logs, then check `/health` and MongoDB connectivity. For p95 above 700 ms, inspect the dashboard and run `pnpm --filter @workspace/api measure:organization-budget`; the command seeds 50 organizations in an isolated disposable MongoDB, sends 200 loopback HTTP requests to `GET /organizations`, checks `workspaceIds_1`, and writes a dated result under `servers/api/performance-results/`. It never connects to `MONGODB_URI` or modifies a configured database. The list view shows a retry action for a failed query and never renders partial results.

## Security and isolation checks

`servers/api/features/workspace/tests/organization.gateway.test.ts` verifies owner and workspace membership scoping, deletion filtering, unrelated-tenant exclusion, sorting, and index use. `servers/api/tests/collection-allow-list.test.ts` pins the current Mongoose collection set (`organizations`, `sessions`, `users`). Organization command tests verify that missing, denied, wrong-action, and wrong-subject policy decisions cannot reach persistence.
