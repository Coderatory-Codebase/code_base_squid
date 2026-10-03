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

Local acceptance-test coverage: **4/4 gateway cases implemented**. The test suite could not be executed in this environment: the `tsx` runner exits at startup because Node's `os.userInfo()` returns `ENOMEM`. This is an environment startup failure, not a failed assertion. The task tracker still shows 0/4 and needs an external update.

## Definition of Done

| # | Requirement | Status | Evidence / remaining action |
|---|---|---|---|
| 1 | Implementation steps ticked or explicitly dropped with a reason | Repository complete; tracker pending | All five implementation steps are checked above and supported by the implementation. The external task tracker still needs its checkboxes reconciled to 5/5. |
| 2 | Dependency guardrail, policy-binding check, and collection allow-list pass in CI | Local static checks pass; CI and test execution pending | `repo.mjs check`, API typecheck, Web typecheck, and the Web production build pass locally. Test execution is blocked at `tsx` startup by Node `os.userInfo()` returning `ENOMEM`. The workflow runs on pull requests and pushes to `main`, not feature-branch pushes; run/record CI from a pull request. |
| 3 | Tenant isolation proven for new collections touched | Test implemented; execution pending | Mongo-backed gateway test includes owned, member, other-workspace, unrelated, and deleted organizations and asserts every returned result belongs to the principal and is live. Test execution is blocked by the `tsx` startup error above. User/session records are identity/session collections, not tenant-owned collections. |
| 4 | New asynchronous paths have a signal, threshold, and runbook line | Documented; production alert pending | API access logs include response status and duration. API query and web render regression tests use a 700 ms p95 threshold for 50 organizations. Runbook is in `servers/api/features/workspace/README.md`; no production alert provider is configured. |
| 5 | New interactive surfaces have a recorded keyboard walk | Pending manual browser check | Exercise and record tab order, focus visibility, form validation, empty/error actions, and organization creation in a real browser. |
| 6 | Discovered deferred work is in the backlog | Pass | CI/test execution, credential rotation/security rescan, reviewer approval, keyboard walk, alerting, and tracker reconciliation are listed in `.project/BACKLOG.md`. |
| 7 | At least one other engineer reviewed and approved | Pending external review | Record another engineer's approval on the pull request. |
| 8 | Affected module contract, runbook, and user-facing docs updated | Pass | See `servers/api/features/workspace/README.md` and root `README.md`. |
| 9 | No new critical or high security findings | Dependency audit documented as passing; secret scan and credential rotation pending | `pnpm audit --json` was recorded as 0 vulnerabilities after pinning Next.js 16.3.6, the advisory's patched version. The prior TruffleHog report identified a verified MongoDB credential in the ignored local `servers/api/.env`; rotate it at the provider and rescan. The credential itself is not included here. |

