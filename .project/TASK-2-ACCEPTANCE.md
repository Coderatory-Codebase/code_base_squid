# Task 2 acceptance review: organization view

## Implementation steps

The five implementation steps shown in the task tracker are covered by the current branch:

- [x] Add the organization segment under `apps/web/app/(app)/workspace/organization/page.tsx`.
- [x] Read organizations through the server-side gateway; the client does not fetch the list.
- [x] Render the empty state and its resolving action.
- [x] Render the error state with a retry action.
- [x] Keep domain modules out of client components.

The implementation is complete in the repository. The task tracker still needs these checks reconciled because its checkboxes are external to this checkout.

## Acceptance tests

The four requested gateway cases are present in `apps/web/tests/integration/organization-list.test.tsx`: authenticated no-store success, API failure, malformed response, and network failure. The same suite covers the empty-state action, query error/retry without partial results, order preservation, and the 50-record rendering threshold. The API suite covers authenticated organization routing, policy binding, tenant isolation, and explicit collection allow-listing.

Acceptance-test coverage: **4/4 gateway cases implemented and CI passed**. GitHub Actions PR #5 ran `pnpm run validate` successfully on commit `b6774abaacd22f4c2f7041b1fe5cf40c1c847cff`, including the test suites. The local `tsx` runner startup issue (`os.userInfo()` returns `ENOMEM`) does not affect the successful CI run. The task tracker still needs an external update to reconcile its 0/4 count.

## Definition of Done

| # | Requirement | Status | Evidence / remaining action |
|---|---|---|---|
| 1 | Implementation steps ticked or explicitly dropped with a reason | Repository complete; tracker pending | All five implementation steps are checked above and supported by the implementation. The external task tracker still needs its checkboxes reconciled to 5/5. |
| 2 | Dependency guardrail, policy-binding check, and collection allow-list pass in CI | Pass | [PR #5 validate job](https://github.com/Coderatory-Codebase/code_base_squid/actions/runs/37146423798/job/111271208564) passed, including `pnpm install --frozen-lockfile`, PR commit validation, and `pnpm run validate`. |
| 3 | Tenant isolation proven for new collections touched | Pass | The Mongo-backed tenant-isolation test is included in the API suite, and the full `pnpm run validate` CI step passed. The test covers owned, member, other-workspace, unrelated, and deleted organizations. User/session records are identity/session collections, not tenant-owned collections. |
| 4 | New asynchronous paths have a signal, threshold, and runbook line | Documented; production alert pending | API access logs include response status and duration. API query and web render regression tests use a 700 ms p95 threshold for 50 organizations. Runbook is in `servers/api/features/workspace/README.md`; no production alert provider is configured. |
| 5 | New interactive surfaces have a recorded keyboard walk | Pending manual browser check | Exercise and record tab order, focus visibility, form validation, empty/error actions, and organization creation in a real browser. |
| 6 | Discovered deferred work is in the backlog | Pass | CI/test execution, credential rotation/security rescan, reviewer approval, keyboard walk, alerting, and tracker reconciliation are listed in `.project/BACKLOG.md`. |
| 7 | At least one other engineer reviewed and approved | Pending external review | Record another engineer's approval on the pull request. |
| 8 | Affected module contract, runbook, and user-facing docs updated | Pass | See `servers/api/features/workspace/README.md` and root `README.md`. |
| 9 | No new critical or high security findings | Dependency audit documented as passing; secret scan and credential rotation pending | `pnpm audit --json` was recorded as 0 vulnerabilities after pinning Next.js 16.3.6, the advisory's patched version. The prior TruffleHog report identified a verified MongoDB credential in the ignored local `servers/api/.env`; rotate it at the provider and rescan. The credential itself is not included here. |

