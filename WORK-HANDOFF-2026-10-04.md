Work handoff — Organization settings story

**Date:** 4 October 2026
**Branch:** `feature/01.1.03-S1-organization-workspace-data-gateway`
**Story:** `01.1.03-S1` — A member sees the organization’s settings and where each value comes from

This note records what is in the repository now, what was verified, and where to continue.

## Work completed

### Task 1 — Workspace-scoped organization settings gateway

Committed in `2495a00` (`feat(api): add scoped organization settings gateway`).

- Added `servers/api/features/workspace/db/organization-setting.gateway.ts`.
- The gateway accepts a `Principal`, filters out deleted organizations, scopes the query to that principal’s workspace IDs, and projects only settings.
- `settingsOf` supplies defaults and labels each setting’s source as `owner` or `default`; invalid stored values throw an error.
- Added the `workspace_settings_live_cover` partial index in `servers/api/features/workspace/integrations/organization.model.ts`.
- The integration test checks the returned settings/defaults, deleted-row exclusion, query scope/projection, and explain plan/index coverage.
- An earlier run of `pnpm.cmd --filter @workspace/api exec tsx --test features/workspace/tests/organization.gateway.test.ts` reported 2 tests passed.

**Still to verify:** the updated replica-set test has not completed successfully in this environment yet.

### Task 2 — Settings page scaffold (partial)

- Added `apps/web/app/(app)/workspace/organization-setting/page.tsx`.
- It renders the page shell and heading only. It does not yet load gateway data or implement the settings, empty, error/retry, or member read-only states.
- The file is currently untracked, so it is not part of a commit yet.

### Task 1 test follow-up (uncommitted)

- In `servers/api/features/workspace/tests/organization.gateway.test.ts`, added a final assertion: after deleting the current workspace’s organization, `settingsOf` returns no rows while only another workspace’s organization remains.
- This explicitly proves the zero-row cross-workspace isolation case requested by the checklist.
- This test edit is uncommitted and still needs to be run.

## Current working tree

At the time this note was written, `git status --short` showed:

```text
 M apps/web/next-env.d.ts
 M servers/api/features/workspace/tests/organization.gateway.test.ts
?? apps/web/app/(app)/workspace/
```

`apps/web/next-env.d.ts` references Next.js development-generated route types. It was not an intentional story edit; inspect before deciding whether to keep or revert it. Do not overwrite it blindly.

## Validation and known issue

- API typecheck had passed earlier in the work.
- Updated the AC-1 test to use a one-node `MongoMemoryReplSet`; it seeds Acme Design with an owner-set Europe/London timezone and queries as a different workspace member, checking the three defaults. The test also retains the index and tenant-isolation assertions.
- API typecheck passes after that update.
- The focused test could not run in this environment: pnpm could not resolve the `tsx` executable, and invoking the installed tsx entry point directly failed in Node with `uv_os_get_passwd returned ENOMEM`. Retry on the user's normal Windows terminal.
- A manual API startup using `pnpm.cmd run dev` reached MongoDB but failed with `MongoServerError: bad auth : authentication failed`. So a live Atlas connection was not verified. The gateway test uses `mongodb-memory-server` instead.

From the repository root, rerun the focused API test:

```powershell
pnpm.cmd --filter @workspace/api exec tsx --test features/workspace/tests/organization.gateway.test.ts
```

## Remaining work

1. Run the updated focused gateway test in the normal development terminal; resolve any failure.
2. Finish Task 2: load settings through the server boundary, render value/source labels, and add empty and error/retry states. Do not fetch the organization settings directly from a client component.
3. Build Task 3 automated checks for AC-1 through AC-4 and the permission-refusal case. AC-2/3 need the page behavior; AC-4 needs the performance/load-test setup.
4. Revisit the temporary local `Principal` contract when the shared Auth/policy interface is available.
5. Record evidence/CI links and engineer review before marking the story done.

## Resume tomorrow

Start by checking `git status --short`, then run the focused gateway test above. Continue with the missing settings-page behavior; keep the existing uncommitted edits until reviewed.
