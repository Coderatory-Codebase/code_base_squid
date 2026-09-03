---
id: TRACE-012
type: trace
title: Account security settings (change password + session management)
status: completed
created: 2026-09-01
related:
  [ADR-012, ADR-014, PLAN-003, BACKLOG-004, SPEC-008, SPEC-010, SPEC-011, TRACE-005, TRACE-011]
---

# TRACE-012: Account Security Settings

Written progressively per `SPEC-013` → "Progressive recording."

## Request

"Build user account security settings for the test project." Scope
was materially ambiguous (several plausible meanings, some already
blocked in the backlog) — asked rather than guessed. User selected:
**change password** (unblocked, no email needed) **and active
sessions/logout-of-other-devices** (requires resolving `BACKLOG-004`'s
architecture gap — no server-side session store currently exists).

**Classification** (`SPEC-011`): `PROJECT` — `apps/test/web` +
`servers/test/api`. No foundation change.

## Checkpoint: classify / guidance / understand / analyze

**Status**: completed.

**Planning-required gate** (`development-lifecycle.md`): trips —
security-sensitive, new architecture (session store), multiple
files/components, a real design decision.

**Use vs. build vs. adopt** (`SPEC-008`, M23): no new dependency needed
— MongoDB (already adopted) is sufficient for a session-record store;
JWT (already adopted) already supports an extra claim. Nothing to
adopt/build beyond project's own domain code.

**Architecture decision identified**: `ADR-012` accepted fully
stateless refresh tokens as a v1 limitation (`BACKLOG-004`). Supporting
"list my sessions" and "log out other devices" is impossible without
_some_ server-side record of issued sessions — the user's own selected
scope necessitates this, it isn't invented scope. This is a genuine
architectural decision (real alternatives for how to model it) that
extends `ADR-012`, not a routine implementation choice — resolved via a
new ADR below, not asked as a separate question, because the user's
selection already authorizes solving `BACKLOG-004` as a necessary
dependency of what they asked for (`SPEC-010` → "Dependency handling").

**Phase determination** (`SPEC-010`): architecture (session-store
design → `ADR-014`), backend (model, endpoints), frontend (settings
page), security (password-change forces other-session revocation —
secure default, `SPEC-008`), testing. No new external integration, no
data-model migration concern (no production users exist).

## Checkpoint: plan

**Status**: completed. See `ADR-014` (session-store architecture) and
`PLAN-003` (feature plan, acceptance criteria).

## Checkpoint: implement

**Status**: completed.

**Actions — backend**: `session.model.ts` (new `Session` collection —
`userId`, `userAgent`, `createdAt`, `lastUsedAt`); `session.service.ts`
(new — `createSession`/`touchSession`/`getOwnedSession`/`deleteSession`/
`deleteOtherSessions`/`listSessions`, kept separate from
`auth.service.ts` — a distinct concept from user credentials/tokens,
same reasoning `user.model.ts`/`auth.service.ts` already used).
`auth.service.ts`: `AccessTokenPayload` gained `sid`; `signAccessToken`/
`signRefreshToken` now take a `sessionId`; new `changePassword` +
`IncorrectPasswordError`. `auth.middleware.ts`: `requireAuth` now also
sets `req.sessionId`. `auth.contracts.ts`: `ChangePasswordRequest`,
`SessionSummary`. `auth.routes.ts`: `PATCH /password`,
`GET /sessions`, `DELETE /sessions/:id`, `POST /sessions/revoke-others`;
`register`/`login` now issue a session via one shared `issueSession`
helper (same reuse discipline `TRACE-010` already established for
error responses); `logout` now deletes the server-side session (reads
the access token directly, best-effort, then always clears cookies —
stays idempotent even with a missing/invalid token); `refresh` now
requires the `Session` to still exist, not only a valid JWT signature.

**Actions — frontend**: new `/settings` page (server component,
same auth-gate pattern as `/dashboard`/`/profile`) +
`change-password-form.tsx` + `session-list.tsx` (client components,
same form/`aria-live` conventions `TRACE-010` established).
`auth-client.ts` gained `changePassword`/`listSessions`/
`revokeSession`/`revokeOtherSessions` + a shared `readErrorMessage`
helper (avoids re-duplicating the error-body-parsing pattern this
file's own functions would otherwise repeat 4 more times). Dashboard
links to `/settings`.

**Discoveries during implementation**:

1. **Needed now, fixed directly**: the secret-scanner's generic-secret
   heuristic flagged a test fixture (`currentPassword: "wrong-current-
password"`, 23 chars, matched the `password\s*[:=]\s*"..{20,}"`
   pattern) — a real false positive of the kind `SPEC-009` → "Secret
   detection" already documents as expected; shortened the fixture
   value, no behavior change.
2. **Not a new discovery, a planned consequence**: `BACKLOG-004` is now
   substantially addressed by this feature (see "record" below) —
   anticipated during planning, not found during implementation.

**Deviations from plan**: none.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: `pnpm --filter @nut-shyll/test-api run
typecheck`, `pnpm --filter @nut-shyll/test-web run typecheck` — both
passed. `pnpm run test` — 29/29 passed (19 existing + 10 new: refresh
rejects a revoked session, change-password success/incorrect-current/
unauthenticated, change-password revokes other sessions, list-sessions
unauthenticated/marks-current, delete-session cross-user-rejected/
own-session-works, revoke-others). Full `pnpm run validate` — the
`secrets:scan` step failed on the first run (see discovery 1 above);
fixed, re-ran clean. `pnpm run format:check` — failed on the first run
(4 files not yet formatted), `prettier --write`, re-ran clean — same
routine pattern as every prior trace. **Manual verification**
(`validation.md`, M21 bullet — this is both a real UI change and new
security-critical request-handling behavior): started both real dev
servers; registered a user (device A), logged in a second session
(device B) with a distinct `User-Agent`; confirmed `GET /sessions`
lists both with the correct one marked current; changed the password
from device A and confirmed device A still works, device B's refresh
now returns `401`, and the old password no longer logs in; logged in a
third session (device C), called `revoke-others` from device A, and
confirmed device C's refresh is rejected while device A still works;
confirmed `DELETE /sessions/:id` on another user's session id returns
`404`, not another user's data; confirmed the real `/settings` page
renders both sections and redirects when unauthenticated. Test data
(2 users, sessions) cleaned up from the local dev database; both dev
servers stopped.

## Checkpoint: review

**Status**: completed.

**Self-review**: Correctness — every acceptance criterion in `PLAN-003`
verified by both the test suite and the real manual pass. Architecture
— `ADR-014` is a genuine decision with real alternatives considered and
rejected, not asked as a separate question because it was a necessary
dependency of scope the user already selected (`SPEC-010` → "Dependency
handling"). Security — revoked sessions are rejected server-side even
with a cryptographically valid JWT (the actual point of this feature);
password change forces other-session revocation (secure default);
cross-user session access returns `404`, never another user's data;
rate limiting applied to the new `/password` endpoint at the
strictest tier (same as login/register — a credential-mutation
endpoint deserves the same protection as credential-verification).
Accessibility — the new form/list follow the same `aria-live`/
`role="alert"` conventions `TRACE-010` established. Scope — exactly
what was selected (change password + sessions); MFA and other
`BACKLOG-008`-adjacent capabilities were not folded in. Maintainability
— session logic lives in its own service file, not bolted onto
`auth.service.ts`, matching the file's own existing decomposition
boundary.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `ADR-014` (new), `PLAN-003` (new);
`servers/test/api`'s `session.model.ts`, `session.service.ts` (new),
`auth.service.ts`, `auth.middleware.ts`, `auth.contracts.ts`,
`auth.routes.ts`, `auth.routes.test.ts` (amended); `apps/test/web`'s
`settings/page.tsx`, `settings/change-password-form.tsx`,
`settings/session-list.tsx` (new), `auth-client.ts`,
`dashboard/page.tsx` (amended); this trace. `.project/backlog/BACKLOG.md`
next — `BACKLOG-004` row updated to `completed` (real server-side
revocation now exists; logout-all-devices and single-session revocation
are both implemented).

## Checkpoint: git

**Status**: completed (no Git action taken) — `change-management.md` →
"commit only when asked."

## Outcome

`completed`. Third real feature built through the strengthened
operating model; the one genuine architectural decision it required
(`ADR-014`) was correctly resolved as a necessary dependency of scope
the user had already selected, not re-asked as a separate question —
and correctly still recorded as a real ADR rather than an unrecorded
implementation detail.
