# Claude handoff: Tasks 1 and 2

## Current state

- Repository: `code_base_squid`; branch: `feature/01.1.01-S1-T2-organization-view`.
- Task 2 work exists in the working tree and is **not committed**. Do not assume every uncommitted file belongs to these tasks; the session memo says its exact origin is unknown.
- The available notes identify Task 2 as `organization-view`. Task 1's exact tracker title/acceptance text is unavailable; this handoff calls the confirmed organization query-gateway slice "Task 1" based on the commit history. Confirm the tracker wording before claiming tracker completion.
- Read `AGENTS.md`, `CLAUDE.md`, `architecture.yaml`, and the feature contract before making further changes. Keep feature ownership and the existing repository control-plane boundaries.

## Test report: Task 1 and Task 2

This status is based on the local test files and the 2026-10-01 session memo. Tests were not rerun for this handoff. "Pass" means the memo recorded the owning suite as passing; it does not mean each case has a separate CI result.

| Task / test cases | Status | Evidence / reason |
|---|---|---|
| Task 1: gateway scopes live organizations to owner/workspace membership; excludes deleted/unrelated organizations; checks ordering, tenant isolation, 50-record p95, and query index | **Pass (recorded)** | `servers/api/features/workspace/tests/organization.gateway.test.ts`; session memo records API tests 24/24 passing. |
| Task 1: authenticated organization route success/empty, unauthenticated 401, gateway failure without partial data, and create response | **Pass (recorded)** | `servers/api/features/workspace/tests/organization.route.test.ts`; API suite recorded 24/24. |
| Task 1: creation denied without policy or with wrong/denied action/subject | **Pass (recorded)** | `servers/api/features/workspace/tests/organization.command.test.ts`; API suite recorded 24/24. |
| Task 2: sign-in session authorizes organization query; sign-out revokes it | **Pass (recorded)** | `servers/api/tests/auth-organization-flow.test.ts`; API suite recorded 24/24. |
| Task 2: only allow-listed Mongoose models/collections are used | **Pass locally (recorded)** | `servers/api/tests/collection-allow-list.test.ts`; local `repo.mjs check` recorded passing. GitHub CI is still pending. |
| Task 2: web gateway authenticated/no-store success, API error, malformed payload, network error | **Pass (recorded)** | Four explicit cases in `apps/web/tests/integration/organization-list.test.tsx`; web suite recorded 12/12. |
| Task 2: empty/setup action, error/retry without stale results, result ordering, 50-item render p95 | **Pass (recorded)** | Same web integration suite; web suite recorded 12/12. |
| Task 1/2: GitHub CI for dependency guardrail, policy binding, collection allow-list | **Blocked / not run** | The branch changes are uncommitted and no CI result is recorded. A local pass is not a GitHub CI pass. |
| Task 2: web typecheck and production build on Next.js 16.3.6 | **Blocked / pending** | The memo says the 16.3.6 package could not be downloaded/linked; prior success was on 16.3.5. |
| Task 2: clean secret scan | **Blocked** | TruffleHog found a verified credential in ignored local `servers/api/.env`. Rotate at the provider, then rescan. Secret value is intentionally omitted. |
| Task 2: real-browser keyboard walkthrough and peer approval | **Pending manual/external work** | No browser walkthrough or independent engineer approval is recorded. |

**GitHub references:** [repository](https://github.com/Coderatory-Codebase/code_base_squid), [Task 1 gateway commit `14b3191`](https://github.com/Coderatory-Codebase/code_base_squid/commit/14b3191), and [Task 2 branch URL](https://github.com/Coderatory-Codebase/code_base_squid/tree/feature/01.1.01-S1-T2-organization-view). The Task 2 work described here is uncommitted locally, so its latest files may not appear at that branch URL. No Task 1/2 issue or pull-request URL was present in the local notes; do not invent one. Add the actual tracker/PR link when available.

**Why counts may differ:** the local report has implementation/test evidence, while the external tracker snapshot still showed Task 2 as implementation 4/5, test cases 0/4, DoD 0/9. That is stale/unreconciled tracker state, not a recorded test failure. There are no known failing test cases in the session memo; the blocked items above are missing CI, install/build, secret rotation/rescan, and manual/review evidence.

## Task 1 - organization query gateway (confirmed code scope)

**Implemented:** commit `14b3191` added the API organization query gateway, model, types, tests, workspace registration/dependencies, and architecture update. Commit `8d06c29` normalized the gateway test formatting. The gateway scopes live organizations to the principal as owner or workspace member, sorting by latest use then name. Current uncommitted code extends the gateway with creation and preview-fixture upsert operations.

**Evidence:** `servers/api/features/workspace/db/organization.gateway.ts`, `integrations/organization.model.ts`, `tests/organization.gateway.test.ts`, and `servers/api/features/workspace/README.md`.

**Still to establish:** no Task 1 acceptance document or tracker state was found. Do not infer its exact Definition of Done or mark external tracker checkboxes complete without checking the tracker. The outstanding validation/security/review items below apply to the current combined branch and may also affect this slice.

## Task 2 - organization view (branch/task scope)

**Implemented in the current tree:**

- Web sign-in and server-rendered organization workspace/list pages.
- Server-side web gateways for authentication and organizations; session token stays in the HttpOnly cookie/server request path.
- API auth/session feature, authenticated organization endpoints, create flow and policy check.
- Organization empty, error, retry, and create interactions; API query scoping and related tests.
- Root README, feature contract/runbook, access logging, latency regression thresholds, and related API configuration/dependency changes.

**Evidence:** `apps/web/app/(public)/sign-in/`, `apps/web/app/(app)/workspace/`, `apps/web/features/auth/`, `apps/web/features/organizations/`, `servers/api/features/auth/`, `servers/api/features/workspace/`, `servers/api/tests/`, plus root `README.md` and `servers/api/features/workspace/README.md`.

**Acceptance status from `.project/TASK-2-ACCEPTANCE.md`:** implementation steps 5/5 covered; four requested gateway cases are present (4/4); empty/error/retry behavior, ordering and 50-item render threshold also have tests. The external tracker still showed implementation 4/5, tests 0/4, and Definition of Done 0/9; tracker reconciliation is pending. Do not equate code coverage with external acceptance.

## Remaining work / blockers

1. Run GitHub CI on the branch and record dependency guardrail, policy-binding, and collection allow-list results.
2. A local ignored `servers/api/.env` was reported by TruffleHog as containing a verified MongoDB credential. The value was not copied into these notes. Rotate it with the provider, then rerun the managed secret scan and record a clean result.
3. Install/pin resolution for Next.js 16.3.6 was not completed in the recorded environment. Then rerun web typecheck and production build; the notes say these passed earlier on 16.3.5 only.
4. Have another engineer review and approve the change; record the review in the PR.
5. Perform and record a real-browser keyboard walkthrough of sign-in, organization list/empty/error states, and organization creation.
6. Reconcile the external Task 2 tracker counts and Definition of Done evidence.
7. Commit the intended Task 2 changes after review. The current tree is uncommitted; inspect `git status` and preserve unrelated work before staging.

## Validation already recorded (historical snapshot)

The 2026-10-01 session memo reports API tests 24/24, API typecheck/lint passing, web tests 12/12, `node codebase/cli/repo.mjs check` passing, `git diff --check` passing, and `pnpm audit --json` with zero vulnerabilities after the Next.js 16.3.6 pin. These are memo-reported results, not a fresh run against the current checkout. Web typecheck/build on 16.3.6, CI, browser keyboard review, peer review, and a clean secret scan remain unverified/pending.

## Product behavior and local preview

The app is served at `/sign-in` and `/workspace/organization`. `GET /organizations` returns live organizations owned by the user or connected to their workspace IDs, ordered by last use then name. `POST /organizations` requires authentication, a trimmed name from 1 to 80 characters, and an allow decision for `organization:create` before persistence. For local preview setup and environment variable names, follow root `README.md` and `servers/api/.env.example`; never put real credentials in source control or this handoff.

## Suggested next action for Claude

First inspect `git status`, the Task 2 acceptance matrix, and the external tracker if accessible. Complete the pending install/typecheck/build if dependencies can be resolved; then take the remaining external/manual actions from the backlog. Do not silently mark Task 1 complete in the tracker until its actual acceptance criteria are confirmed.
