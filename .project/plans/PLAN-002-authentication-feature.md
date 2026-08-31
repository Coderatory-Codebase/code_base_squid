---
id: PLAN-002
type: plan
title: Authentication feature (MERN + Next.js)
status: complete
created: 2026-08-31
related: [ADR-012, SPEC-010, TRACE-005]
---

# PLAN-002: Authentication Feature

Architecture/technology decisions: `ADR-012`. This is the "how,"
proportional to the feature (`SPEC-010` → "Feature planning").

## Scope

**Needed now** (`SPEC-010` → "Feature slicing" — sliced by behavior):

- Registration (email + password, hashed, duplicate-email rejected)
- Login / session establishment (JWT cookies issued)
- Current-user / protected session (`GET /api/auth/me`)
- Logout (cookies cleared)
- Refresh (`POST /api/auth/refresh`, access-token renewal)
- Route protection middleware (`servers/api`) and a protected page
  (`apps/web`)

**Out of scope — captured as backlog, not built**: email verification,
password reset, OAuth/social login, server-side refresh-token
revocation, frontend component/E2E test coverage beyond API-level tests.
See `.project/backlog/`.

## Repository layout

```text
apps/web/                       Next.js (App Router), TypeScript
  package.json, tsconfig.json, next.config.ts (rewrites /api/** -> API)
  src/app/{login,register,dashboard}/page.tsx, layout.tsx
  src/lib/auth-client.ts, auth-server.ts

servers/api/                    Express + Node + Mongoose, TypeScript
  package.json, tsconfig.json
  src/index.ts, app.ts, config/env.ts, db/connection.ts
  src/domains/auth/{user.model,auth.contracts,auth.service,
                    auth.routes,auth.middleware}.ts
  test/domains/auth/auth.routes.test.ts (supertest + mongodb-memory-server)
```

## Acceptance criteria (observable behavior, `SPEC-010` → "Acceptance criteria")

- A user can register with a valid email and password.
- Duplicate email registration is rejected with a clear error.
- A user can log in with correct credentials and cannot with incorrect
  ones (generic error, no email-enumeration signal).
- An authenticated request to `/api/auth/me` returns the current user;
  an unauthenticated one is rejected.
- `/dashboard` redirects to `/login` when unauthenticated and renders
  when authenticated.
- Logout clears the session; a subsequent `/api/auth/me` is rejected.
- `/api/auth/refresh` issues a new access token given a valid refresh
  token.
- The password is never returned in any response or written to logs.

## Root tooling change

`typecheck`/`build` change from a single root `tsc -b` to
`pnpm -r --if-present run <script>` (see `ADR-012` → "Consequences").
`.gitignore` gains `.next/`.

## Validation

`pnpm run validate` + `pnpm run format:check`; `servers/api` test suite
(supertest + mongodb-memory-server) covers the acceptance criteria above
at the API level; manual browser pass (`validation.md`, M21 bullet):
register → login → `/dashboard` succeeds → logout → `/dashboard`
redirects.

## Status

`complete` — all acceptance criteria verified (API test suite +
manual/browser-equivalent pass). See `TRACE-005`.
