---
id: TRACE-007
type: trace
title: BACKLOG-006 — rate limiting / brute-force protection on auth endpoints
status: completed
created: 2026-09-01
related: [BACKLOG-006, ADR-012, PLAN-002, SPEC-010, SPEC-011, TRACE-005, TRACE-006]
---

# TRACE-007: BACKLOG-006 — Rate Limiting / Brute-Force Protection

Written progressively per `SPEC-013` → "Progressive recording."

## Request

"Go ahead with the next feature." Selecting which backlog item is
itself a product/priority decision (`SPEC-010` → "Ownership") — asked
the user rather than silently picking one; offered the three items with
no external vendor/provider dependency (`BACKLOG-004`, `006`, `007`).
User selected **`BACKLOG-006`**: rate limiting / brute-force protection
on `/api/auth/register` and `/api/auth/login`.

**Classification** (`SPEC-011`): `PROJECT` — `servers/test/api` only, no
foundation change.

## Checkpoint: orient / classify / understand / analyze / plan

**Status**: completed.

**Actions**: confirmed working tree state, confirmed `BACKLOG-006`'s row
in `.project/backlog/BACKLOG.md` (kind `risk`, no dependency). Classified
as a small, well-bounded technical/security addition to an existing
feature, not a new feature slice — `SPEC-010` → "Feature planning":
"a trivial feature needs almost none of these explicitly written out."
No separate `PLAN-*` artifact created; the plan below is stated inline,
satisfying `development-lifecycle.md`'s PLAN stage ("state it, don't
silently start editing") proportionally to the change's actual size.

**Planning-required gate** (`development-lifecycle.md`, M21): trips on
"security-sensitive" — satisfied by this inline plan, not skipped.

**Use vs. build vs. adopt** (`SPEC-008`, M23): no existing repository
capability does this; no ecosystem skill exists; **adopt**
`express-rate-limit` (the established, actively-maintained library for
this exact problem in Express — recreating token-bucket/sliding-window
logic by hand would be the rejected "build" branch with no justification
to skip "adopt"). Not consequential enough to escalate (`SPEC-012` →
"Escalation triggers": no infrastructure, vendor, or cost implication —
an in-process npm dependency, same category as `zod`/`helmet` at M22,
which needed no escalation either).

**Plan**:

- Add `express-rate-limit` to `servers/test/api`.
- Apply a strict per-IP limiter to `POST /api/auth/register` and
  `POST /api/auth/login` (the credential-stuffing/brute-force targets) —
  10 requests / 15 minutes, matching common industry defaults for this
  exact endpoint shape.
- Apply a looser limiter to `POST /api/auth/refresh` (still
  unauthenticated-input-bearing, lower abuse value) — 30 requests / 15
  minutes.
- `429` response uses the existing error-body shape
  (`{ error: { message, code: "RATE_LIMITED" } }`), consistent with
  every other auth error response (`ADR-012`).
- In-process memory store (the library's default) — no Redis/external
  store. A distributed rate-limit store is a separate, real
  infrastructure decision (`SPEC-012` escalation trigger) this single
  backlog item doesn't need; single-process is this deployable's actual
  current shape.
- Tests: exceeding the limit on `/register` and `/login` returns `429`;
  staying under it keeps working.
- **Acceptance criteria**: repeated rapid failed logins from one client
  are rejected with `429` after the threshold; legitimate traffic under
  the threshold is unaffected; the rate-limit response never leaks
  whether the underlying email/password was otherwise valid.

**Scope — explicitly not included**: rate limiting `/api/auth/logout`
or `/api/auth/me` (idempotent / already `requireAuth`-gated, low abuse
value); a distributed store; per-account (vs. per-IP) limiting — a real,
separate design question, not folded in silently.

## Checkpoint: implement

**Status**: completed.

**Actions**: added `express-rate-limit` to `servers/test/api`. Created
`auth.rate-limit.ts` with **factory functions**
(`createCredentialsRateLimit`/`createRefreshRateLimit`), not module-level
singletons — deliberate, see "Discoveries" below. Wired
`credentialsRateLimit` into `POST /register` and `POST /login`,
`refreshRateLimit` into `POST /refresh` (`auth.routes.ts`).

**Discoveries during implementation**:

1. **Needed now, fixed directly**: the existing integration test file
   (`auth.routes.test.ts`) shares one app instance across ~11
   register/login calls — more than the chosen production limit (10).
   A module-singleton limiter would have made an unrelated existing test
   start intermittently failing. Resolved by making the limiters
   factories and having the real router skip rate limiting when
   `NODE_ENV=test` (vitest's default) — the middleware's actual 429
   behavior is instead verified by a small, isolated test
   (`auth.rate-limit.test.ts`) using its own instance and its own tiny
   limit, not sharing state with the large integration suite.
2. **Real, deferred as backlog, not guessed**: `servers/test/api` only
   ever sees the Next.js rewrite proxy as the client
   (`ADR-012` → same-origin delivery), not the real browser IP, unless
   `trust proxy`/`X-Forwarded-For` handling is configured correctly for
   the actual deployment topology — which isn't decided yet (`infra/`
   doesn't exist). Blindly trusting a forwarded-for header without
   knowing the real proxy chain is itself a spoofing risk, so this was
   deliberately left unset rather than guessed at. Captured as
   `BACKLOG-009`, `discovered-from: TRACE-007`.

**Deviations from plan**: none against the plan above; the
factory-vs-singleton structure was an implementation detail decided
while writing tests, not a change to the feature's actual behavior or
scope.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: `pnpm --filter @nut-shyll/test-api run
typecheck` — passed. `pnpm run test` — 12/12 passed (10 existing + 2 new
isolated rate-limit tests), confirming the middleware change didn't
break the existing suite. Full `pnpm run validate` — passed. `pnpm run
format:check` — **failed** on the first run (`BACKLOG.md`,
`pnpm-lock.yaml`) — same routine pattern as every prior trace's recorded
failure; fixed with `prettier --write`, re-ran clean. **Manual
verification** (`validation.md`, M21 bullet, applied here even though
this isn't a UI change — a real security behavior deserves a real check,
not only the isolated unit test): started `servers/test/api`'s real dev
server, sent 12 real `POST /api/auth/login` requests — attempts 1–10
returned `401` (real, valid credential-rejection behavior, unaffected),
attempts 11–12 returned `429` with the exact expected error body. Server
stopped afterward.

## Checkpoint: review

**Status**: completed.

**Self-review**: Correctness — confirmed both by isolated test and a
real running server. Scope — exactly `BACKLOG-006`'s stated scope
(register/login/refresh), nothing else touched. Security — the fix
closes a real, currently-exploitable gap; the one thing deliberately
_not_ done (trusting a proxy header without knowing the real topology)
was the correct call, not an oversight — recorded as `BACKLOG-009`
rather than guessed. Quality — the factory refactor keeps the module
testable without weakening the real production behavior (still one
long-lived limiter per process in the real app). Regression — the full
existing test suite and full validation gate both re-confirmed green.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `servers/test/api/src/domains/auth/auth.rate-limit.ts`
(new), `auth.routes.ts` (amended), `test/domains/auth/auth.rate-limit.test.ts`
(new), `.project/backlog/BACKLOG.md` (`BACKLOG-006` → `completed`,
`BACKLOG-009` added), this trace. No SPEC/ADR/PLAN needed — an
implementation-scale change within already-decided architecture
(`ADR-012`), not a new decision.

## Checkpoint: git

**Status**: completed (no Git action taken) — `change-management.md` →
"commit only when asked."

## Outcome

`completed`. First feature built entirely through the M21/M23
strengthened operating model in response to a bare "go ahead" —
including the model correctly refusing to silently pick which backlog
item "the next feature" meant, and correctly declining to guess a
security-relevant proxy-trust setting it didn't have enough information
to decide safely.
