# Story 5 acceptance review: organization-list performance and pagination

## Implementation

The API now returns organization list pages of at most 50 summaries as `{ organizations, nextOffset }`. It queries up to 51 matching documents so `nextOffset` is only present when another item actually exists. A stable sort by `lastUsedAt` descending, `name` ascending, and `_id` ascending avoids non-deterministic ordering for tied rows. Requests validate offsets from 0 through 500,000 and remain scoped to the authenticated principal on every page.

The web server loads page one with its existing HttpOnly session cookie. Further pages are requested by an authenticated Server Action that reads the same cookie server-side; the browser never receives the bearer token. The client list observes a scroll sentinel and also provides a keyboard-operable Load more button. API failures are shown with an explicit retry action. A terminal page has neither observer nor load-more control.

Owner, workspace-membership, and direct-organization-membership compound indexes support the access filters, deletion filter, and stable page ordering. The repository already emits `organization.request.signal` on success and error boundaries; list requests now include a validated `pageOffset`. The workspace Grafana dashboard includes first-page p95 filtered to offset zero, and the alert policy records the 700 ms budget pending on-call ratification.

## Task status

| Task | Status | Evidence |
|---|---|---|
| T1 Add index and measure p95 | Pass | Added `owner_list_page`, `workspace_list_page`, and `member_list_page` indexes. The isolated measurement seeded 500 direct organization memberships and sent 200 loopback first-page requests: p95 **8.91 ms** against the 700 ms budget. `explain` used `member_list_page` and `owner_list_page`. Full evidence: `servers/api/performance-results/organization-list-story-5-2026-10-07.json`. |
| T2 Automate acceptance checks | Pass locally | API route checks cover pagination parameters, unauthorized later-page requests, response shape, and errors. The Mongo-backed gateway test covers 500 memberships, disjoint 50-item pages, the 700 ms query threshold, index use, and the exactly-50 terminal page. Web tests cover page parsing, 50-item rendering, subsequent-page URL construction, and hiding pagination controls when `nextOffset` is null. |
| T3 Emit and dashboard the signal | Implemented in repository; operations pending | The existing boundary signal includes workspace/module/outcome/duration and now first-page offset; dashboard panel and 700 ms threshold are recorded. On-call approval, alert activation, and production retention remain external. |

## Validation and remaining DoD

- API and web typechecks, focused UI and API route tests, the Mongo-backed gateway test, measurement script, lint, and repository architecture check passed locally.
- The web render test measures first-page markup under 700 ms, but a real browser scroll/keyboard walkthrough remains necessary.
- Fresh CI and independent engineer approval are not available from this local implementation session.
- Ratify and activate the alert with the workspace on-call rotation; confirm central log retention with platform owners.
- No 100% coverage claim is made for this story; its plan requests automated checks for acceptance criteria but does not specify a coverage percentage.

## DoD checklist

- [x] Repository implementation steps for paging, indexes, checks, and telemetry are present.
- [ ] Dependency guardrail, policy binding, collection allow-list, and fresh CI pass on this revision.
- [x] No new collection was added; existing tenant scoping is retained for each page.
- [x] Organization request signal, first-page p95 dashboard panel, 700 ms budget, and runbook measurement command are present.
- [ ] Real-browser keyboard/scroll walkthrough recorded.
- [x] Deferred operational validation and signoff are listed in `.project/BACKLOG.md`.
- [ ] Independent engineer review and approval recorded.
- [x] Workspace API contract, root README, dashboard, alert-policy definition, and this acceptance review are updated.
- [x] Fresh Mongo-backed 500-member measurement meets the p95 budget and explain plan uses the membership page index.
