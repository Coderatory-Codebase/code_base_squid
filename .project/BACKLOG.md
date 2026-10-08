# Backlog

Current status: repository-side implementation and acceptance evidence are complete for Story 2. Manual/external review items remain outstanding because they require a real browser, external engineer signoff, or provider-side operational setup.

Items still outstanding:

- [x] Run the branch's pull request through GitHub CI and record dependency guardrail, policy-binding, collection allow-list, and acceptance-test results. [PR #5 validate job passed](https://github.com/Coderatory-Codebase/code_base_squid/actions/runs/37146423798/job/111271208564).
- [x] Execute the acceptance suites in CI; `pnpm run validate` passed in the PR job. The local `tsx` runner limitation remains specific to this environment.
- [ ] Rotate the verified MongoDB credential present in the ignored local `servers/api/.env` at its provider, then rerun managed TruffleHog and record a clean scan. Do not copy the credential into source control or task comments. This is external provider work, not a repository code change.
- [ ] Configure production alerting for the new asynchronous organization query path; no alert provider is configured in this workspace.
- [x] Confirm the Next.js 16.3.6 dependency is installed, then run Web typecheck and production build. Both checks pass in this workspace.
- [ ] Get approval from at least one other engineer and record the reviewer in the pull request.
- [ ] Perform and record a real browser keyboard walk through sign-in, the organization list/empty/error states, and organization creation.
- [x] Reconcile the task tracker implementation steps (5/5), gateway test cases (4/4), and Definition of Done evidence with this acceptance review.

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

## Story 6 — organization lifecycle

Organization archive, restore, and soft-delete flows are implemented at the organization boundary. A first-class Workspace write surface is absent, so lifecycle enforcement for downstream workspace writes and cross-instance timing remain blocked; soft-deleted data is intentionally retained pending an approved retention period.

- [x] Add an explicit lifecycle state machine, owner-only policy, and version-checked atomic persistence.
- [x] Expose authenticated lifecycle transitions and return current state on version conflicts.
- [x] Keep archived organizations readable while blocking team-management writes; keep soft-deleted organizations out of list and dashboard reads.
- [x] Add owner lifecycle controls with confirmation, optimistic state feedback, and accessible status announcements.
- [x] Record indefinite archive/soft-delete retention and require a separate approved purge migration before data removal.
- [x] Add lifecycle domain/service, HTTP route, and accessibility checks; include the accessibility check in the standard web test command.
- [x] Verify Mongo-backed version conflicts, archive write guards, restore, and soft-delete transitions with the isolated lifecycle gateway test.
- [ ] Run fresh full repository validation/CI. A wider members-gateway run also hit a MongoMemoryServer startup timeout in an unrelated existing test; the focused lifecycle persistence test passed.
- [ ] Add lifecycle checks to the browser keyboard/screen-reader walkthrough and obtain independent engineer approval.
- [ ] Add the missing Workspace model/write boundary before claiming archived-parent enforcement or cross-instance transition timing.

See `.project/STORY-6-ACCEPTANCE.md` for the implemented contract, local evidence, and infrastructure-dependent acceptance items.

Repository-complete evidence:

- Web dashboard/accessibility checks: 5/5 passed in the focused run.
- API service/route checks: 12/12 passed in the focused run; the wider API run passed 15/19, with four Mongo-backed tests blocked by MongoMemoryServer startup timeout.
- Story 2 acceptance review is aligned with its recorded repo evidence; Story 3's Mongo-backed verification, fresh CI, real-browser review, engineer approval, coverage certification, and provider-side operational configuration remain open.
