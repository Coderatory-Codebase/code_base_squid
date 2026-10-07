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

Repository-complete evidence:

- Web dashboard/accessibility checks: 5/5 passed in the focused run.
- API service/route checks: 12/12 passed in the focused run; the wider API run passed 15/19, with four Mongo-backed tests blocked by MongoMemoryServer startup timeout.
- Story 2 acceptance review is aligned with its recorded repo evidence; Story 3's Mongo-backed verification, fresh CI, real-browser review, engineer approval, coverage certification, and provider-side operational configuration remain open.
