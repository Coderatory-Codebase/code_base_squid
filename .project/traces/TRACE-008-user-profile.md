---
id: TRACE-008
type: trace
title: User profile feature (display name)
status: completed
created: 2026-09-01
related: [ADR-012, PLAN-002, SPEC-010, SPEC-011, TRACE-005, TRACE-007]
---

# TRACE-008: User Profile Feature

Written progressively per `SPEC-013` → "Progressive recording."

## Request

"Build the user profile feature." The `User` model currently has only
`email`+`passwordHash` — no profile fields exist, so "profile" doesn't
resolve from repository state alone. Material ambiguity
(`SPEC-011` → "Human-in-the-loop" — "Material ambiguity in
requirements/scope"): asked rather than guessing a scope. User selected:
add an editable `displayName` field; profile page shows email
(read-only) + display name (editable); an API endpoint to update it.

**Classification** (`SPEC-011`): `PROJECT` — `apps/test/web` +
`servers/test/api`, no foundation change.

## Checkpoint: classify / understand / analyze / plan

**Status**: completed.

**Planning-required gate** (`development-lifecycle.md`, M21): trips —
multi-file, spans backend + frontend + a schema change.

**Phase determination** (`SPEC-010`, M23): architecture (none — no new
trust boundary, extends the existing owned `User` model), backend
(schema + endpoint), frontend (profile page), testing. Skipped: security
review beyond what `requireAuth` already provides (no new auth
surface — same protection model as `/me`), UX/UI beyond a functional
form (no design-system boundary exists to consider).

**Use vs. build vs. adopt** (`SPEC-008`, M23): nothing to adopt — this is
ordinary CRUD-shaped application logic on an already-owned model, not a
capability an external library would meaningfully replace.

**Scope — needed now**: `displayName` field on `User` (optional,
trimmed, max 60 chars); `PATCH /api/auth/me` (protected, updates
`displayName`); `apps/test/web` `/profile` page (view + edit), reachable
from `/dashboard`.

**Scope — explicitly not included**: avatar/bio (user declined the
richer-profile option), email editing (a materially bigger question —
verification implications, out of scope here and not requested).

**Contract placement** (`contracts.md`/`ADR-012`): the updated `AuthUser`
shape (with `displayName`) is still owned by `servers/test/api`;
`apps/test/web` updates its own local type to match, same pattern as
M22 — not a new decision.

## Checkpoint: implement

**Status**: completed.

**Actions — backend**: `user.model.ts` gained `displayName` (optional,
trimmed, max 60). `auth.contracts.ts` gained `updateProfileRequestSchema`
and `AuthUser.displayName: string | null`. `auth.service.ts` gained
`updateDisplayName`; `toAuthUser` now includes it. `auth.routes.ts`
gained `PATCH /api/auth/me` (`requireAuth`-protected, same pattern as
every other auth route).

**Actions — frontend**: `auth-client.ts`'s local `AuthUser` type
(`ADR-012` → "Contract placement" — not shared, kept in sync
independently) gained `displayName`; added `updateProfile()`. New
`/profile` page (server component, redirects unauthenticated — same
pattern as `/dashboard`) + `profile-form.tsx` (client component, same
shape as the existing login/register forms). `/dashboard` now shows
`displayName ?? email` and links to `/profile`.

**Discoveries during implementation**: the test run surfaced a real
Mongoose 9 deprecation warning (`findByIdAndUpdate`'s `{ new: true }` →
`{ returnDocument: "after" }`) — **needed now**, fixed directly
(`SPEC-008` → "Current/authoritative guidance": prefer current
guidance over stale remembered API shape). Not a new discovery about
scope, a correctness fix caught by actually running the tests.

**Deviations from plan**: none.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: `pnpm --filter @nut-shyll/test-api run
typecheck`, `pnpm --filter @nut-shyll/test-web run typecheck` — both
passed. `pnpm run test` — 16/16 passed (12 existing + 4 new: unauth
`PATCH` rejected, successful update reflected in both the `PATCH`
response and a subsequent `GET /me`, empty display name rejected, and a
`displayName: null` check on fresh registration). Full `pnpm run
validate` — passed on the first run (lint, typecheck, test, build,
`validate:architecture`, `secrets:scan`). **Manual verification**
(`validation.md`, M21 bullet — this is a real UI change): started both
real dev servers, exercised the actual flow through the Next.js origin —
register (`displayName: null`), `/profile` redirects when
unauthenticated (`307` → `/login`), renders when authenticated, `PATCH`
updates the name, `GET /me` reflects it, `/dashboard` renders the
updated display name and links to `/profile`. Test data cleaned up from
the local dev database; both dev servers stopped afterward.

## Checkpoint: review

**Status**: completed.

**Self-review**: Correctness — every acceptance point verified by both
the test suite and a real running instance. Architecture — no new
domain/layer; the field and endpoint live inside the existing,
already-owning `auth` domain (`ADR-002`), proportional to one field
(`SPEC-008` → "Proportional architecture" — a separate `profile` domain
for one field would have been ceremonial). Scope — exactly what was
asked (display name, editable) and confirmed (not the richer avatar/bio
option); email editing was correctly left out, not silently added.
Security — `PATCH /me` reuses the same `requireAuth` protection as every
other authenticated route; no new trust boundary introduced. Quality —
a real deprecation warning was fixed on sight rather than ignored.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `servers/test/api`'s `user.model.ts`,
`auth.contracts.ts`, `auth.service.ts`, `auth.routes.ts`,
`auth.routes.test.ts` (amended); `apps/test/web`'s `auth-client.ts`,
`dashboard/page.tsx` (amended), `profile/page.tsx`,
`profile/profile-form.tsx` (new); this trace. No SPEC/ADR/PLAN/BACKLOG
change needed — an ordinary feature addition within already-decided
architecture, not a discovery or a new decision.

## Checkpoint: git

**Status**: completed (no Git action taken) — `change-management.md` →
"commit only when asked."

## Outcome

`completed`. Second feature built through the strengthened operating
model from a short request; the model correctly asked for the one
genuinely ambiguous thing (what "profile" means here) rather than
guessing a scope for the User model to grow into.
