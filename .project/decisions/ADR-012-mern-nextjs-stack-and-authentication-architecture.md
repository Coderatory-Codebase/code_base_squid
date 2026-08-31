---
id: ADR-012
type: adr
title: MERN + Next.js stack and authentication architecture
status: accepted
created: 2026-08-31
related: [PLAN-002, SPEC-010, SPEC-011, TRACE-005]
---

# ADR-012: MERN + Next.js Stack and Authentication Architecture

## Context

This repository's first real application feature: Authentication, using
MERN (MongoDB/Express/React/Node) with Next.js as the React layer, as
explicitly requested. This is the first technology adoption in the
repository (`.project/state/PROJECT-STATE.md` → "Technology profile" was
empty) and a security-sensitive feature, so the real architectural
alternatives are recorded here rather than left implicit in the diff.
User-confirmed inputs going in: JWT delivered via httpOnly cookies (not
in the response body), and core auth scope only (register, login,
logout, current-user, route protection — email verification, password
reset, and OAuth are deferred, see "Backlog").

## Decisions

1. **Two independent deployables**, not a Next.js-only fullstack app:
   `apps/web` (Next.js/React) and `servers/api` (Express/Node/MongoDB via
   Mongoose). Matches "MERN + Next.js" as stated — Next.js replaces plain
   React, Express/Mongo stay separate — keeps `architecture.yaml`'s
   `apps/`/`servers/` boundary distinction meaningful, and matches
   `ADR-002` ("business logic lives inside the owning deployable"): auth
   domain logic lives in `servers/api`, not split across a Next.js
   API-route layer too. Rejected: a Next.js-only app with API routes and
   no separate backend — would blur the E/N of "MERN" into the framework
   itself and contradict the already-adopted `apps/`/`servers/` split.
2. **Session strategy**: JWT access token (~15 min) + refresh token
   (~7 days), both `httpOnly`, `SameSite=Lax`, `Secure` in production —
   set and read only by `servers/api`. Rejected: tokens returned in the
   response body for frontend-managed storage (exposes tokens to XSS,
   requires manual header attachment) — already decided by the user.
3. **Same-origin cookie delivery via Next.js rewrites**: `apps/web`
   proxies `/api/*` to `servers/api` (`next.config` `rewrites()`) instead
   of the browser calling the API cross-origin. Avoids `SameSite=None` +
   HTTPS-only cookie requirements in local dev and avoids CORS for the
   browser-facing path entirely. `servers/api` still carries real CORS
   configuration (locked to the known web origin) for any non-browser or
   direct caller.
4. **Contract placement**: auth request/response shapes are owned by
   `servers/api` (`contracts.md` → "ownership before reuse"). `apps/web`
   defines its own local, independently maintained types for what it
   consumes rather than a shared `packages/contracts` package — the two
   deployables don't share source, and `packages/` extraction needs
   demonstrated reuse pain across independent _package_ consumers, not
   day-one convenience. Revisit only if drift between the two sides
   becomes a real, repeated problem.
5. **Password hashing**: `bcrypt` (industry-standard at this scale, no
   external service dependency).
6. **No server-side refresh-token revocation list in this version** —
   logout clears cookies client-side; a stolen refresh token remains
   valid until natural expiry. A real, intentional limitation, not a
   silently-accepted gap — tracked as a backlog item (see "Backlog").

## Consequences

- `apps/` and `servers/` boundaries (`architecture.yaml`) move from
  `not-yet-created` to `created`, populated for the first time.
- `.project/state/PROJECT-STATE.md` → "Technology profile" is populated
  for the first time: Node.js, TypeScript, Express, Mongoose, MongoDB,
  Next.js, React, JWT, bcrypt, zod.
- Root `typecheck`/`build` scripts change from a single root `tsc -b`
  (currently building nothing) to a per-workspace-package fan-out
  (`pnpm -r --if-present run <script>`), because Next.js's own tsconfig
  conventions (non-composite, `moduleResolution: bundler`) don't fit the
  same composite-project graph as `servers/api`'s Node/NodeNext
  composite project. `lint`/`format`/`test` already glob the whole repo
  and need no change. This is implementation detail inside the existing
  validate-gate contract (`SPEC-009` defines the gate at the script-name
  level, not internals) — not a second ADR.
- Deferred, tracked as real backlog items, not silently dropped: email
  verification, password reset, OAuth/social login, server-side
  refresh-token revocation (logout-all-devices), and frontend
  component/E2E test coverage beyond the API-level tests built now.

## Status

Accepted. Governs `apps/web`, `servers/api`, and the Authentication
feature's architecture.
