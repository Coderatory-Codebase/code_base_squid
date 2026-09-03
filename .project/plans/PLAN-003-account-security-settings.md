---
id: PLAN-003
type: plan
title: Account security settings (change password + session management)
status: complete
created: 2026-09-01
related: [ADR-014, BACKLOG-004, TRACE-012]
---

# PLAN-003: Account Security Settings

Architecture: `ADR-014`. Proportional plan for a significant feature
(`SPEC-010` → "Feature planning").

## Scope

**Needed now**:

- Change password (current + new password, authenticated).
- List active sessions (creation time, last-used time, raw user-agent,
  which one is "this" request).
- Revoke one session / revoke all other sessions.
- Logout now revokes the session server-side, not only client cookies.
- Password change revokes every other session (secure default).

**Out of scope**: MFA/2FA (`BACKLOG-008`, separate, larger feature);
naming sessions from the user-agent string (no parser adopted — see
`ADR-014`); IP-based session display (`BACKLOG-009`'s proxy-IP gap is
unresolved, so no IP is shown to avoid displaying an inaccurate value).

## Repository layout

```text
servers/test/api/src/domains/auth/
  session.model.ts        # new — Session schema
  auth.service.ts          # sid issuance, session CRUD helpers, change-password
  auth.contracts.ts        # ChangePasswordRequest, SessionSummary
  auth.routes.ts           # PATCH /api/auth/password, session routes

apps/test/web/src/app/settings/
  page.tsx                 # server component, redirects unauthenticated
  change-password-form.tsx # client component
  session-list.tsx         # client component
```

## Acceptance criteria

- A user can change their password given the correct current password;
  an incorrect current password is rejected without revealing which
  part was wrong beyond "current password" being invalid.
- Changing the password revokes every other session — a second browser
  logged in as the same user is signed out on its next request.
- A user can see a list of their own active sessions, with which one is
  the current request's marked.
- A user can revoke one specific session (their own only — never
  another user's).
- A user can revoke "all other sessions" in one action.
- Logging out removes that session server-side — its refresh token no
  longer works even before natural expiry.
- No session data for any other user is ever exposed.

## Validation

`pnpm run validate` + `format:check`; `servers/test/api` test suite
extended for change-password, session listing, revocation, and the
password-change-revokes-others behavior; manual browser-equivalent
pass through both real dev servers (`validation.md`, M21 bullet).

## Status

`complete` — all acceptance criteria verified (test suite + manual
pass). See `TRACE-012`.
