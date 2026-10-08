# Story 3 acceptance review: organization dashboard, team management, and RBAC

## Scope aligned to the current repository

The repository persists organizations and user workspace IDs but has no first-class Workspace model, workspace membership records, resource-consumption telemetry, or email-delivery provider. The team and role model is therefore organization-scoped, per the product clarification for this implementation. Dashboard resource usage is reported as the actual count of workspace IDs linked to the organization; it is not presented as CPU, storage, or other unavailable infrastructure telemetry.

Invitations use manager-created, single-use links. Each token is random, only its SHA-256 hash is stored, links expire after seven days, and acceptance requires a signed-in user whose verified account email matches the invitation. The configured `WEB_ORIGIN` is used to build the shareable URL. No email provider is added; the admin copies the URL.

## Implementation status

| Task | Status | Evidence |
|---|---|---|
| T1 dashboard and metrics | Implemented | `/workspace/dashboard/[organizationId]` server-renders current team membership, linked-workspace count, and recent team audit events from the uncached API gateway. Organization list entries link to the dashboard. |
| T2 member API and gateway | Implemented | `GET /organizations/:id/dashboard`, `PATCH /organizations/:id/members/:userId`, and `DELETE /organizations/:id/members/:userId`; organization membership is persisted in the existing organization collection. |
| T3 invitation flow | Implemented | Admin/owner invitation form and copyable link; authenticated acceptance page; email match, expiry, single-use token, role from the persisted invitation. |
| T4 RBAC | Implemented | `middleware/rbac.middleware.ts` restricts invite/role/remove routes to owner/admin; service and atomic database filters repeat authorization to prevent race-based privilege changes. Member requests receive 403. Owner role cannot be changed or removed. |
| T5 accessibility | Automated checks implemented | Native labeled email/role controls and submit buttons; focused axe-core WCAG A/AA scan reports no violations on the invitation surface. jsdom cannot audit rendered color contrast; real browser contrast and screen-reader walk remain pending. |
| T6 performance | Prior measurement recorded; final remeasurement pending | `GET /organizations/:id/dashboard`: earlier 200-request loopback run with 21 members, ten linked workspaces, 50 stored events (ten returned); p95 9.55 ms vs 700 ms; 3,954 bytes vs 102,400-byte budget. Result: `servers/api/performance-results/workspace-dashboard-2026-10-07.json`. The post-audit-change remeasurement could not start its local MongoDB test server. |
| T7 documentation/backlog | Updated | Workspace API contract/runbook, root README, this acceptance review, and `.project/BACKLOG.md` record implemented behavior, evidence, and outstanding external checks. |

## Security and data behavior

- Members invited as `admin` retain that role on acceptance; invitees cannot choose or elevate their own role.
- Invitation acceptance atomically marks the invitation consumed, adds the membership, and appends the audit event within the organization document.
- Team activity is bounded to the most recent 50 team-management events; dashboards return the latest ten.
- The organization list query now includes direct organization members as well as owners and users connected through existing workspace IDs.
- Member-only dashboard access is read-only; managers require the owner/admin role. Organization data and operations remain scoped to one organization.
- Memberships, invites, and activity reuse the existing `organizations` collection; collection allow-listing does not need a new collection.

## Test and measurement evidence

- Web dashboard and accessibility tests: 5/5 passed, covering authenticated telemetry parsing, API/malformed-response failures, native control labels and keyboard semantics, and axe-core WCAG A/AA rules.
- API service and route tests: 12/12 passed, covering owner/admin authorization, protected-owner behavior, token hashing, malformed-token rejection, organization query behavior, and 403/manager invitation routes.
- Web and API typechecks, focused lint runs, and the repository architecture/policy check passed.
- A wider API run reported 15/19 passing. The four failures were Mongo-backed integration cases whose local `MongoMemoryServer` instances did not start within 60 seconds; persistence/invitation gateway coverage therefore still needs a working MongoDB test runtime.
- The recorded dashboard API budget was 9.55 ms p95 and 3,954 bytes for the documented dataset. A remeasurement after the latest audit-event changes was attempted but could not start its local MongoDB instance; rerun before treating those numbers as final.
- The axe-core jsdom run excludes the `color-contrast` rule because jsdom does not render Tailwind styles or provide canvas support. Verify contrast in a browser. This does not replace the manual keyboard/screen-reader walk.
- The story text's request for “100% test coverage” has not been certified by an instrumented line/branch coverage threshold. Do not claim 100% coverage until coverage tooling reports and verifies it.

## Definition of Done

| # | Requirement | Status | Evidence / remaining |
|---|---|---|---|
| 1 | Implementation steps are complete or explicitly scoped | Pass | All seven repository tasks are implemented; scope deviations for absent Workspace/resource/email-provider models are documented above. |
| 2 | Dependency, policy, collection, and CI checks pass | Pending | Architecture/repository policy check passes locally; obtain fresh CI validation and resolve the environment's MongoDB test-runtime blocker. |
| 3 | Tenant isolation is tested for touched data | Pass locally | Existing organization owner/workspace isolation tests plus organization-scoped gateway filters cover access boundaries; fresh complete suite should remain green. |
| 4 | Async paths have signals, thresholds, and runbook | Pass in repository | `/organizations` request signal covers dashboard/team routes; dashboard p95 and payload budgets and measurement command are documented. Production alert activation remains external. |
| 5 | Interactive surfaces have recorded keyboard/accessibility walkthrough | Pending manual | Automated structural checks and axe-core scan pass; complete real browser keyboard, screen-reader, and visual contrast review. |
| 6 | Deferred/external work is in backlog | Pass | CI, manual review, peer approval, production alert activation, and coverage certification are tracked in `.project/BACKLOG.md`. |
| 7 | Independent engineer approval | Pending external | Obtain and record an engineer review; no approval is claimed. |
| 8 | Affected documentation is updated | Pass | Root README, API feature contract/runbook, architecture quality budget, and this review updated. |
| 9 | Automated acceptance tests and performance limits pass | Partial | Web dashboard/accessibility tests and API service/routes pass; Mongo-backed API cases and a fresh performance measurement need a functioning MongoDB test runtime. |

## Operational limitations

The API dashboard definition and alert policy still require Grafana/Loki import, on-call ratification, and platform retention configuration as noted in the workspace runbook. These provider-side actions cannot be performed by repository code alone.
