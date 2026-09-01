---
id: TRACE-010
type: trace
title: Remediation of TRACE-009's user profile audit findings
status: completed
created: 2026-09-01
related:
  [TRACE-008, TRACE-009, BACKLOG-006, BACKLOG-007, SPEC-008, SPEC-010, SPEC-011, SPEC-012, SPEC-013]
---

# TRACE-010: Remediation of the User Profile Audit

Written progressively per `SPEC-013` → "Progressive recording."

## Request

Approved: proceed with `TRACE-009`'s findings autonomously wherever
existing rules/proportionality already determine the answer; stop and
ask only for a genuinely consequential decision. Explicit instructions:
stay `PROJECT`-scoped unless a real `FOUNDATION` gap is found; determine
(not assume) whether the form-component duplication is actually
worth extracting; determine whether `PATCH /me` rate limiting is new
scope or an update to existing tracked work; update `BACKLOG-007`'s
scope note if warranted; follow the full feature-development process,
not a bare bug-fix pass.

**Classification** (`SPEC-011`): `PROJECT`. No foundation change
anticipated; will record explicitly if that changes.

## Checkpoint: classify / applicable guidance / understand

**Status**: completed.

**Applicable guidance identified**: `SPEC-008` → "Reuse and
generalization" (the form-component question), "Use vs. build vs.
adopt" (n/a — no new dependency), "Anti-pattern handling" (premature
abstraction vs. ceremonial layers, both cut against different
findings); `SPEC-010` → "Discovery decision model" (the `PATCH /me`
rate-limit question), "Phase determination"; `SPEC-012` (whether any
finding now clears the skill-creation bar — audit already answered no,
re-confirmed below, not re-litigated from scratch).

**Understanding**: seven findings from `TRACE-009`, none flagged as
requiring human approval by the audit itself; this session's job is to
apply engineering judgment to each rather than mechanically "fix
everything found."

## Checkpoint: analyze — per-finding disposition

**Status**: completed.

1. **`runValidators` missing** — real defense-in-depth gap, routine
   correctness fix, no decision needed. **Fix directly.**
2. **Duplicated error-response/clear-cookies patterns** — `SPEC-008` →
   "Reuse and generalization": now 3 real, independent call sites per
   pattern, genuinely the same concept (not superficially similar) —
   clears the extraction bar. **Fix directly** (two small helpers, not
   a new layer — stays inside `auth.routes.ts`'s existing proportional
   structure).
3. **`<a href>` instead of `<Link>`** — mechanical, no decision needed.
   **Fix directly**, all 4 existing internal links.
4. **Missing `aria-live` on save confirmation** — routine accessibility
   correctness, no decision needed. **Fix directly.**
5. **Form-component consolidation — evaluated, not mechanically
   applied**: login and register genuinely share structural identity
   (same two fields, same shape) but were already a deliberate M22
   judgment call to keep separate (two small, independently readable
   ~60-line files vs. a `mode` prop). The profile form is structurally
   different in kind, not just content — one disabled field + one
   editable field, edit-existing vs. create-new semantics, no password
   field at all. The only literally-shared code across all three is the
   error-paragraph render and the submit-button loading-label pattern —
   a few lines each. Extracting a shared `<FormField>`/`<AuthForm>`
   wrapper here would be `SPEC-008`'s "premature abstraction" anti-
   pattern: guessing a shape from three consumers whose actual fields
   and semantics differ, trading a few duplicated lines for an added
   indirection. **Decision: do not extract. Correct as-is, considered
   and declined**, not silently skipped.
6. **`PATCH /me` has no rate limiting** — `SPEC-010` → "Discovery
   decision model": is this new scope, or an update to already-tracked
   work? `PATCH /me` did not exist when `BACKLOG-006`/`TRACE-007` scoped
   and implemented rate limiting — it was added afterward by
   `TRACE-008`, so its omission was never a deliberate exclusion, it's a
   genuine gap in an already-completed item. Classified **"already
   tracked → update, don't duplicate"**: this extends `BACKLOG-006`'s
   actual completed scope rather than becoming a new item. Severity is
   low (requires an existing valid session — no credential-guessing
   surface) but the fix is trivial (reuse the same factory the rest of
   the router already uses) and leaving one of four mutating auth
   routes unprotected while the other three are is an inconsistent
   security posture a production standard would flag. **Fix directly**,
   `BACKLOG-006`'s row updated to note the extension, not a new row.
7. **`BACKLOG-007`'s scope note** — its stated scope (login/logout/
   failed-attempts) doesn't mention profile-field changes, which are
   also genuinely security-relevant audit events (account-modification
   history). **Warranted** — update the existing row's Notes, not a new
   item.
8. **Skill/guidance proposal** — re-confirmed: still only one project
   exists; none of the above rises above project-local convention.
   **No proposal.**
9. **Foundation gap** — none of the above touches `.agent/`, `.project/
specs/`, `architecture.yaml`, or `AGENTS.md`. **None found.**

**Human decision points found**: none. Every finding resolves via
already-existing rules (`SPEC-008` extraction bar, `SPEC-010` discovery
routing, `SPEC-012` skill-creation criteria) or routine correctness —
consistent with the audit's own conclusion that no architectural/
consequential decision was skipped. Proceeding without escalation, as
instructed for exactly this case.

## Checkpoint: phase determination / plan

**Status**: completed.

**Phases**: backend (validators, error helpers, rate limit), frontend
(`Link`, `aria-live`), backlog bookkeeping (`BACKLOG-006`/`007` notes),
testing (defense-in-depth test, rate-limit test). No architecture/API-
contract phase — no new endpoint, no shape change.

**Plan**: implement all four direct fixes plus the `PATCH /me` rate
limit; add/extend tests for the two behavior changes that need one
(`runValidators`, rate limiting); update the two backlog rows; run the
full validation gate; manual-verify the two behavior changes for real
(this touches request-handling behavior, not just presentation).

## Checkpoint: implement

**Status**: completed.

**Actions — backend**: `updateDisplayName` now passes
`runValidators: true`. Extracted `sendError`/`sendUnauthenticated`
helpers in `auth.routes.ts`, applied at all 6 previously-duplicated call
sites. Added `createProfileRateLimit` (`auth.rate-limit.ts`, 20/15min)
and applied it to `PATCH /me` alongside `requireAuth`.

**Actions — frontend**: `<a href>` → Next.js `<Link>` in
`login/page.tsx`, `register/page.tsx`, `dashboard/page.tsx`,
`profile/page.tsx` (4 files, all pre-existing internal links). The save
confirmation in `profile-form.tsx` now renders inside a permanent
`role="status" aria-live="polite"` element (text toggles, element
stays, so it's announced); the error paragraph gained `role="alert"`
(same class of issue, directly adjacent, trivial — not separately
itemized by the audit but the same fix).

**Actions — tests**: added a direct `updateDisplayName` service-level
test proving the 60-char limit is enforced even when the route's `zod`
validation is bypassed entirely (would have failed before the
`runValidators` fix — verified this by reasoning through the change,
not by reverting it to re-fail). Extended `auth.rate-limit.test.ts`
with `describe.each` over both rate-limit factories instead of a
second, near-duplicate describe block — same concern the audit raised
about the login/register/profile forms, applied to the test file
itself.

**Actions — backlog**: `BACKLOG-006`'s row updated to note the `PATCH
/me` extension (not a new row — "already tracked" per the discovery
model). `BACKLOG-007`'s title and Notes updated to include profile-field
changes.

**Discoveries during remediation**: none beyond what `TRACE-009`
already surfaced — this checkpoint applied judgment to existing
findings, it didn't uncover new ones.

**Deviations from plan**: none.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: `pnpm --filter @nut-shyll/test-api run
typecheck`, `pnpm --filter @nut-shyll/test-web run typecheck` — both
passed on the first run. `pnpm run test` — 19/19 passed (16 existing +
3 new: the defense-in-depth test and the parametrized rate-limit suite
covering both factories) — no regression from the `auth.routes.ts`
refactor. Full `pnpm run validate` (lint, typecheck, test, build,
`validate:architecture`, `secrets:scan`) — **passed on the first run**,
no fix-cycle needed this time. **Manual verification** (`validation.md`,
M21 bullet — this changes real request-handling behavior, not only
presentation): started both real dev servers; sent 21 real `PATCH
/api/auth/me` requests — the first 20 returned `200`, the 21st returned
`429`, confirming the new limiter is actually wired into the live
request path, not just present in test-only code. Fetched the real
rendered `/profile` HTML and confirmed `aria-live` is present and
`<Link>` still emits a real `<a href="/dashboard">` (correct for
no-JS/SEO, client-navigated once hydrated). Test data cleaned up from
the local dev database; both dev servers stopped afterward.

## Checkpoint: review

**Status**: completed.

**Self-review**: every fix traces to a specific `TRACE-009` finding;
nothing was added beyond what was found and approved. The one
deliberate non-fix (form-component extraction) is recorded with its
reasoning, not silently dropped. `git status` reconfirmed no foundation
file touched. Security — `runValidators` now provides real defense in
depth; `PATCH /me` now has consistent rate-limit coverage with the
other three mutating auth routes. Accessibility — both the save
confirmation and the error message are now announced. Maintainability —
the error-handling duplication that would have grown with every future
route is now centralized in two small helpers. No new abstraction was
introduced beyond what the actual duplication (3+ real call sites)
justified.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `servers/test/api`'s `auth.service.ts`,
`auth.rate-limit.ts`, `auth.routes.ts`, `auth.routes.test.ts`,
`auth.rate-limit.test.ts` (all amended); `apps/test/web`'s
`login/page.tsx`, `register/page.tsx`, `dashboard/page.tsx`,
`profile/page.tsx`, `profile/profile-form.tsx` (all amended);
`.project/backlog/BACKLOG.md` (`BACKLOG-006`/`007` rows updated, no new
row); this trace. No SPEC/ADR/PLAN/skill change — every fix resolved via
already-existing rules, no new decision was made.

## Checkpoint: git

**Status**: completed (no Git action taken) — `change-management.md` →
"commit only when asked."

## Outcome

`completed`. Every `TRACE-009` finding was either fixed directly (5),
deliberately declined with recorded reasoning (1), or resolved via the
existing discovery model into an update to already-tracked work (2) —
zero required human escalation, confirming the audit's own conclusion.
No foundation change; no new skill/guidance; no new backlog item.
