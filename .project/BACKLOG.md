# Backlog

Current status: repository-side implementation and acceptance evidence are complete for Story 2. Manual/external review items remain outstanding because they require a real browser, external engineer signoff, or provider-side operational setup.

Items still outstanding:

- [ ] Story 4 Task 1 follow-up: connect the Mongo-backed `InvitationAccepted` Workspace consumer to the invitation acceptance producer and queue worker. The consumer, atomic membership/event receipts, archived refusal, tenant-isolation acceptance check, signal/dashboard threshold, and runbook are now present; no producer or worker exists in this checkout, so live event delivery and the 5-second runtime objective remain unverified.

- [ ] Story 3 Task 3 AC-2 follow-up: connect the `01.2.01` workspace-setup consumer to `settingsOf` and replace the test-only contract adapter with a test of the real consumer. This checkout has no `01.2.01` production consumer; the current contract test verifies `settingsOf` for a member and the exact refusal text, but does not exercise that absent consumer.
- [ ] Story 2 Task 6 follow-up: reconcile the authoritative S2 acceptance criteria and red-before/green-after evidence. The checked-in `.project/STORY-2-ACCEPTANCE.md` identifies `01.1.01-S2` and covers organization setup, while the S2-T4/T5 contracts cover settings updates. Task 6 currently has four focused settings-update acceptance checks, all passing; confirm the mapping against the correct Story 2 acceptance criteria before claiming historical red-run evidence.
- [x] Story 2 Task 6: add HTTP/MongoDB acceptance checks for owner update, invalid-value no-write, stale-version Conflict, member refusal, and update signal. Focused suite passed 4/4; focused ESLint passed; `pnpm run scan` on 2026-10-08 was clean.
- [ ] Story 2 Task 7 follow-up: perform a real keyboard and screen-reader walkthrough before release. The local DOM check now records settings-field/save order, conflict-action order, theme-token focus styles, and failure rollback announcements; no physical browser/device walkthrough was performed, per the user's device-access instruction.
- [x] Story 2 Task 7: add theme-aware visible focus rings and verify focus order, Conflict announcements, and optimistic rollback in the focused jsdom test (1/1 pass; focused ESLint pass). See `.project/01.1.03-S2-T7.md`.
- [ ] Story 2 Task 4 follow-up: run CI for the update-path change and obtain independent engineer approval. The local security scan and focused type/lint review are separate from CI; the 700 ms update p95 / 5% error-rate thresholds are proposed pending on-call ratification, and provider-side Grafana alert activation remains external. This task adds no collection or interactive surface.

- [x] Run the branch's pull request through GitHub CI and record dependency guardrail, policy-binding, collection allow-list, and acceptance-test results. [PR #5 validate job passed](https://github.com/Coderatory-Codebase/code_base_squid/actions/runs/37146423798/job/111271208564).
- [x] Execute the acceptance suites in CI; `pnpm run validate` passed in the PR job. The local `tsx` runner limitation remains specific to this environment.
- [ ] Rotate the MongoDB credential in the ignored local `servers/api/.env` at its provider and replace it locally without sharing it. The latest 2026-10-08 managed TruffleHog scan is clean after correcting `.trufflehog-exclude-paths.txt` to match Windows and POSIX paths for the already-excluded local env files; the credential itself remains local and was not copied into source control or task comments. A direct `updateUser` attempt was rejected by Atlas (`AtlasError`); Atlas Console requires interactive sign-in, so the credential remains unchanged pending owner/admin action. Next.js and `eslint-config-next` are on 16.3.8, and `pnpm audit` reports no high dependency advisory.
- [ ] Configure production alerting for the new asynchronous organization query path; no alert provider is configured in this workspace.
- [ ] Reconcile Task 2's requested Vitest runner with the API workspace, which declares Node's built-in `node:test` via `tsx` and no Vitest dependency. The domain checks currently pass under the declared runner; do not add another runner without a task/architecture decision.
- [ ] Repair the API workspace typecheck baseline. The 2026-10-07 Task 3 typecheck attempt reported existing Express request/response typing failures, missing `mongodb-memory-server` exports, and invalid `node:test` skip-option calls; the 2026-10-08 Task 1 focused domain typecheck passed, while a full API typecheck still reports unrelated errors in other files.
- [x] Rerun the managed security scan with workspace filesystem access on 2026-10-07; `pnpm run scan` completed cleanly with TruffleHog 3.97.5 and no issues. The first sandboxed attempt could not resolve `apps/web` and did not produce a valid report.
- [x] Upgrade Next.js and its ESLint config to 16.3.8 for the September 2026 security release. Web typecheck passed; the production build was not rerun after the patch update.
- [ ] Get approval from at least one other engineer and record the reviewer in the pull request.
- [ ] Perform and record a real browser keyboard walk through sign-in, the organization list/empty/error states, and organization creation.
- [x] Reconcile the task tracker implementation steps (5/5), gateway test cases (4/4), and Definition of Done evidence with this acceptance review.
- [ ] Reconcile the imported `01.1.03-S2-T1` card's sample `{ workspaceId, organizationSettingId, updatedAt }` index and `architecture/collections.json` references with this repository's design. Current evidence shows `workspace_settings_live_cover` supports the real query and `organizations` is already allow-listed; revisit only if a separate organization-setting history collection is introduced.

- [ ] Task 3 follow-up: perform and record the preview keyboard/screen-reader walk for organization setup and obtain engineer approval. Current revision `2711805f` CI `validate` passed ([run 37320647778](https://github.com/Coderatory-Codebase/code_base_squid/actions/runs/37320647778)). Track upstream remediation for high-severity braces@3.0.3 advisory GHSA-vfj7-8cjw-p6xm; local audit reports it, while CI validation passed.

## Story 3 — organization dashboard and team management

Repository implementation is complete; acceptance/sign-off remains open for external review and final validation:

- [x] Add organization dashboard with live team membership, linked workspace count, and recent team audit activity.
- [x] Add owner/admin RBAC, role assignment/removal, and email-bound, seven-day, single-use invitation links.
- [x] Add dashboard performance budget and record passing measurement: 200 requests, p95 9.55 ms (<700 ms), 3,954-byte payload (<102,400 bytes).
- [x] Add invite form structural accessibility checks and focused axe-core WCAG A/AA scan. The jsdom scan excludes visual color contrast; verify it in a real browser.
- [ ] Run full final `pnpm run validate` and verify fresh CI for the Story 3 revision. The local repository architecture check passes; full acceptance remains blocked by MongoMemoryServer startup failures.
- [ ] Perform and record a real browser keyboard, screen-reader, and visual contrast walkthrough.
- [ ] Obtain independent engineer approval.
- [ ] Instrument and verify the requested 100% line/branch coverage threshold before claiming it.
- [ ] Import/activate production Grafana alerting and confirm platform-side retention with its owners.
- [x] Run focused Story 3 UI/accessibility tests: 5/5 pass; API service and route tests: 12/12 pass.
- [ ] Rerun Mongo-backed API integration and the dashboard performance budget when the local MongoDB test runtime is available. The attempted run had four database-dependent failures because MongoMemoryServer did not start within 60 seconds; performance was previously measured at 9.55 ms p95 and 3,954 bytes, before the latest audit-event change.
- [x] Verify web/API typechecks, focused lint, and the repository architecture/policy check after linking `@types/jsdom`.

The Story 3 model is organization-scoped because this repository has no first-class Workspace entity; linked workspace count is the available persisted usage metric, not CPU/storage telemetry. Email delivery is not configured; admins share generated invitation links. See `.project/STORY-3-ACCEPTANCE.md` for details and evidence.

## Story 5 — organization list performance

Repository implementation is in place; database-backed performance evidence and external DoD items remain pending:

- [x] Return organization summaries in bounded 50-item pages, with a look-ahead result so an exactly-50 list has no next page.
- [x] Load subsequent pages as the list scrolls and provide an accessible manual Load more control; keep session-token use server-side.
- [x] Add owner/workspace/member compound list indexes and deterministic ordering.
- [x] Add API and web checks for pagination shape, malformed offsets, terminal pages, and 50-item rendering.
- [x] Emit validated first-page offset in the existing organization request signal and add a dedicated first-page p95 dashboard panel with the 700 ms budget.
- [x] Run the Mongo-backed 500-membership query test and `measure:organization-budget`: 2/2 gateway tests passed; 200-request p95 was 8.91 ms (<700 ms) and explain used `member_list_page` and `owner_list_page`. Result: `servers/api/performance-results/organization-list-story-5-2026-10-07.json`.
- [ ] Run fresh repository validation and CI for this revision.
- [ ] Record real-browser scrolling/keyboard accessibility review and independent engineer approval.
- [ ] Ratify/activate production alerting and confirm log-retention configuration with the responsible platform owners.

See `.project/STORY-5-ACCEPTANCE.md` for the endpoint contract, test evidence, and remaining Definition of Done items.

Repository-complete evidence:

- Web dashboard/accessibility checks: 5/5 passed in the focused run.
- API service/route checks: 12/12 passed in the focused run; the wider API run passed 15/19, with four Mongo-backed tests blocked by MongoMemoryServer startup timeout.
- Story 2 acceptance review is aligned with its recorded repo evidence; Story 3's Mongo-backed verification, fresh CI, real-browser review, engineer approval, coverage certification, and provider-side operational configuration remain open.
