# Muhammad Umair — Sprint 1 pending-work audit

Scope: repository implementation for the five assigned stories in `.project/SQUID-CONTEXT.md`:
`02.1.02-S1` through `02.1.02-S4`, plus `01.2.02-S1`. Do not update the external Squid
tracker from this task.

## Findings before implementation

- S1 has Identity invitation domain/gateway code and unit tests. The server-rendered list
  endpoint is now registered, uses the workspace-session bearer token, scopes to the
  authenticated user's only active workspace, and authorizes owner/admin membership via
  a central ability and command bus. Identity create/revoke/resend handlers are now
  composed, but writes do not yet append events atomically through the outbox; real
  Mongo, CI integration and measured performance evidence remain required by task records.
- S2 has acceptance and validity domain rules, a separate legacy Mongo `invitations`
  adapter, and a client acceptance surface. The public service/route, persistence wiring,
  identity-session-to-workspace command principal, and live consumer/outbox flow are
  absent or explicitly dependent on prerequisite work in its task records.
- S3 has pure revoke/resend rules, scoped list gateway, central policy-bound commands,
  and web management controls. Their writes still need atomic outbox integration.
- S4 has a generic invalid-link view and domain rule. Token lookup, acceptance route wiring,
  and official integration/journey evidence are absent or environment-dependent.
- `01.2.02-S1` has no dedicated local task record. The existing workspace settings read is
  organization-default settings; `WorkspaceRecord` currently has no timezone/week-start
  settings contract, so it cannot be represented as completion of this distinct story.

## Work log

### Completed in this pass

- Added `GET /identity/user-invitations` to the API composition. The route accepts only
  the bearer session emitted by the existing web sign-in, resolves one active workspace,
  and dispatches a read command through the central command bus. Identity binds that
  command to `workspace.invitation.manage`; the policy re-reads the active persisted
  membership and refuses non-manager or guest actors. The response omits raw token hashes
  and inviter identifiers. The server-only web query now forwards the HttpOnly session as
  a bearer header. Four focused policy/service/controller cases and the existing service,
  gateway, and principal checks passed (17/17 total) before the consumer-role test was
  added; the current combined API run passes 18/18. Focused web run passes 5/5.
- Corrected the Workspace `InvitationAccepted` consumer to apply the role carried by the
  accepted invitation event instead of silently substituting the workspace default role;
  guest invitations still receive the forced `guest` role. Added a deterministic unit
  case. The event producer/transactional outbox/worker are still absent, so this fixes the
  consumer contract but does not complete the acceptance story.
- `02.1.02-S1` AC-3 code path: the invite service now recovers when concurrent first-time
  invites contend on the pending `(workspaceId, email)` unique index. It rotates the
  stored token hash via the existing scoped replacement operation, invalidating the
  losing request's earlier pending token; only that exact Mongo duplicate-key shape is
  handled as this race. Added a regression case in the invitation service suite.
- `02.1.02-S1` T2 empty state now links to the organization list so a user has a next
  action. The test asserts the link.
- The existing team-invitation form now validates email on the server action and returns
  an inline, labelled field error. Added focused tests for valid/invalid email handling.
- `02.1.02-S4` invalid invitation presentation is wired into the existing acceptance
  page for malformed tokens and `error=invalid`, with one generic message for all invalid
  outcomes. Added a presentation regression test. The page still reads the existing
  organization invitation flow, not Identity's separate collection.
- Replaced S1 placeholder Mongo test skips with real database test implementations for
  create/expiry, token-hash persistence, pending replacement, invalid-email no-write and
  tenant/soft-delete scoping. They require `TEST_MONGODB_URI` pointing to an isolated test
  Mongo database; that variable is unavailable here, so these cases skip locally. The
  document test does not cover outbox/log secrecy, and the data test does not verify the
  query explain plan.
- Updated `.project/02.1.02-S1-T3.md` and `.project/02.1.02-S1-STORY-AUDIT.md` with the
  change and its verification limits.
- Verification: `node ./node_modules/tsx/dist/cli.mjs --test
  features/identity/tests/user-invitation.service.test.ts` from `servers/api` — 7 passed.
- Verification: targeted ESLint for the modified service and test — passed.
- Verification: web invitation page suite — 3 passed, including the new empty-state
  action. Targeted ESLint for the modified web files — passed.
- Verification: the invite-form validation and accessibility suites — 7 passed; targeted
  ESLint — passed.
- Verification: combined S1 service and Mongo integration suite — 7 unit tests passed;
  5 database integration cases skipped because no isolated `TEST_MONGODB_URI` was set.
- An attempt to launch a local Mongo replica set was denied by this execution sandbox
  (`connect EACCES 127.0.0.1:<ephemeral-port>`); no database results are claimed.
- API workspace `tsc --noEmit` was attempted directly; it reports pre-existing broad
  Express, MongoDB driver and mongodb-memory-server declaration incompatibilities across
  the API workspace. The package-manager command could not canonicalize the repo path in
  this execution environment. No clean workspace typecheck is claimed.

### Still pending or blocked

- S1 T2 has no safe authenticated workspace/manager principal wired to the Identity list
  endpoint. The server-side list endpoint is now wired. It resolves the bearer session,
  requires exactly one active workspace, re-reads its persisted membership for policy,
  and returns only invitation ID/email/status/role/dates (never token hashes). Focused
  route/service policy tests pass. A workspace-selection UI for users with multiple
  active memberships and real Mongo-backed HTTP verification remain outstanding.
- S1 T3's official Integration/Contract/Load and recorded Accessibility cases still need
  real Mongo/outbox, central policy, k6/CI, and deployed preview evidence. Unit checks do
  not satisfy those methods.
- S1 T4/T5 still need a composed HTTP signal/dashboard with agreed threshold and measured
  seeded target-volume query performance.
- The read-only invitation-list command now uses the centrally named
  `workspace.invitation.manage` ability with the command bus. The existing invitation
  create/revoke/resend routes now use that same persisted-membership policy boundary;
  the write operations still need event append in the same transaction before their
  story implementation can be treated as complete.
- S2 acceptance producer/worker wiring and Identity token lookup remain pending.
- S2/S3/S4 official database-backed contract/integration/preview cases remain blocked by
  the missing shared prerequisites and Docker Mongo environment. S4's invalid-link view
  still lacks a production token lookup route.
- `01.2.02-S1` has no task-specific acceptance/task record in `.project`; its product
  contract cannot be inferred safely. Existing organization defaults are distinct from
  the requested per-workspace timezone/week-start read, and `WorkspaceRecord` does not
  currently model those settings. Implement only after its source ACs/contract are
  available and the settings producer dependency is wired.

No Squid tracker fields were changed. The five assigned stories remain unverified as a
group; no story or task is represented as done by this repository audit.
