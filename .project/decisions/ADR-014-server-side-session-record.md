---
id: ADR-014
type: adr
title: Server-side session record for refresh tokens
status: accepted
created: 2026-09-01
related: [ADR-012, PLAN-003, BACKLOG-004, TRACE-012]
---

# ADR-014: Server-Side Session Record for Refresh Tokens

## Context

`ADR-012` (M22) accepted fully stateless JWT refresh tokens as a real,
intentional v1 limitation: no way to list active sessions or revoke one
without waiting for natural expiry (tracked as `BACKLOG-004`). The user
has now explicitly requested account security settings including
"active sessions" and "logout of other devices" — neither is possible
without _some_ server-side record of what sessions exist, since a pure
JWT carries no server-side state to list or revoke.

## Decision

Add a `Session` collection (MongoDB, via Mongoose — already-adopted
technology, no new dependency). Each issued refresh token carries a
`sid` (session id) claim referencing one `Session` document. Both the
access and refresh JWT gain the same `sid` claim (issued together, one
session), so an authenticated request can identify "which session is
this" without an extra token-verification call.

```text
Session {
  _id            (= sid, used directly as the JWT claim)
  userId
  userAgent      (raw request header, for display only — no parsing library)
  createdAt
  lastUsedAt     (updated on each successful refresh)
}
```

- **Login/register** — creates a new `Session`, embeds its `_id` as
  `sid` in both tokens.
- **Refresh** — verifies the refresh JWT, then requires the
  corresponding `Session` to still exist (deleted = revoked, rejected
  with `401` even if the JWT itself is still cryptographically valid —
  this is the actual revocation mechanism); updates `lastUsedAt`;
  re-issues both tokens with the same `sid` (no rotation of the session
  identity itself, only the tokens).
- **Logout** — deletes the caller's own `Session`, not only clearing
  cookies (closes a real gap: today's logout only clears client-side
  cookies, the refresh token remains valid server-side until it
  expires).
- **List sessions** (`GET /api/auth/sessions`) — the caller's own
  `Session` documents, marking which one is the current request's.
- **Revoke one / revoke others** — delete the targeted `Session`
  document(s); a deleted session's refresh token stops working on its
  next use (checked against the `Session` collection, not just
  signature/expiry).
- **Password change forces revocation of every other session** —
  secure default (`SPEC-008` → "Security principles"), not a separate
  decision: keep only the session that made the change.

## Rationale

- **Real alternatives considered**: (a) stay fully stateless, accept no
  revocation (the `ADR-012` status quo) — rejected, it's exactly what
  the user asked to change; (b) a server-side session record keyed by a
  `sid` claim (chosen) — the standard, minimal pattern for adding
  revocation to JWT-based auth without abandoning JWTs entirely; (c)
  switch to fully server-side opaque session tokens (no JWT at all) —
  rejected as a much larger change than this feature needs, would touch
  every existing auth code path for no benefit `ADR-012`'s original
  reasoning didn't already weigh.
- **No new vendor/infrastructure** — MongoDB is already this project's
  database; this is one more collection, not a new dependency
  (`SPEC-012` escalation triggers around infrastructure/vendor/cost
  don't apply here).
- **Storing a session id, not the raw/hashed token** — the `Session`
  document doesn't need to store the token itself to do its job (the
  JWT signature already proves possession); it only needs to know
  whether the _session_ is still valid. Smaller stored surface, nothing
  sensitive persisted beyond what already exists (`userId`,
  `userAgent`, timestamps).
- **No user-agent parsing library** — "Chrome on Windows"-style device
  naming is a real but separate nicety; storing and displaying the raw
  header string satisfies "which session is this" without adding a
  dependency for cosmetic value (`SPEC-008` → "Use vs. build vs.
  adopt" — nothing here clears the adopt bar).

## Consequences

- `servers/test/api`'s JWT payloads gain a `sid` claim (both access and
  refresh); `requireAuth` now also sets `req.sessionId`.
- Every login/register/refresh now does one additional database
  write/read against `Session` — proportional; no performance concern
  at this project's scale.
- `BACKLOG-004` (server-side refresh-token revocation) is substantially
  addressed by this feature, not left as a permanent limitation.
- `BACKLOG-009` (client-IP detection behind the Next.js proxy) is
  unaffected — `userAgent` is read directly from the request header,
  not from an IP that needs proxy-trust configuration.
- No production users exist, so no data migration is needed for
  existing sessions; any refresh token issued before this change lacks
  a `sid` and is treated as unauthenticated on its next use (rejected,
  not silently accepted) — acceptable for a project with no real users
  yet.

## Status

Accepted. Governs `servers/test/api`'s session/refresh-token model from
this feature forward.
