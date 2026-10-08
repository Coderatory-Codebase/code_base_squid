# Task 3 handoff — Acceptance checks

**Story:** `01.1.03-S1` — A member sees the organization’s settings and where each value comes from
**Task:** `01.1.03-S1-T3` — Automate the acceptance checks for this Story
**Branch:** `feature/01.1.03-S1-organization-workspace-data-gateway`

## What has been done

Only part of **Subtask 1** has been implemented: an automated integration check for **AC-1**.

In `servers/api/features/workspace/tests/organization.gateway.test.ts` (around line 78):

- Changed the test database from a standalone MongoDB memory server to a one-node replica set, as AC-1’s verification approach asks.
- Seeded “Acme Design” with owner `organization-owner` and the explicit timezone `Europe/London`.
- Queried as a separate workspace member (`workspace-member`) and asserted the timezone is marked `owner`, while week start, date format, and workspace setup rule have their expected defaults.
- Kept the deleted-organization, workspace isolation, and covering-index assertions in the same test.
- Added a zero-row isolation assertion after removing the current workspace’s organization.

These edits are **uncommitted**. The test file’s typecheck passes, but its test run is not verified yet.

## Task 3 checklist status

1. **Write one automated check per acceptance criterion:** Partial — AC-1 only. AC-2, AC-3, and AC-4 checks remain.
2. **Run checks and confirm the expected failures:** Not done. The focused test command failed in this environment before tests ran.
3. **Implement until checks pass:** Not done for Task 3. The new AC-1 check still needs a successful run; remaining criteria need their checks and implementation.
4. **Add permission-refusal case:** Not done.

## Dependencies shown by the tracker

Task 3 is marked **Waiting on** `01.4.01`, `01.4.04`, and `01.1.01`.

- AC-2/AC-3 need the settings page’s read-only and error/retry behavior (the current page is only a scaffold at `apps/web/app/(app)/workspace/organization-setting/page.tsx`).
- AC-4 needs the performance/load-test setup for the 200-view, 700 ms p95 target.
- The permission-refusal case needs the principal/policy behavior from `01.4.04`.

The tracker shows these as Task 3 dependencies overall; it does not assign each dependency to individual checklist steps.

## Validation and resume command

- Passed: `pnpm.cmd --filter @workspace/api run typecheck`
- Not verified: `pnpm.cmd --filter @workspace/api exec tsx --test features/workspace/tests/organization.gateway.test.ts` — pnpm did not resolve `tsx`.
- Direct invocation of the installed `tsx` entry point also failed with Node error `uv_os_get_passwd returned ENOMEM`.

Run the focused test from `servers/api` in the normal development terminal, then continue with AC-2 through AC-4 and the permission-refusal case.
