---
id: TRACE-005
type: trace
title: Authentication feature — first application (MERN + Next.js)
status: completed
created: 2026-08-31
related: [ADR-012, PLAN-002, SPEC-010, SPEC-011, SPEC-012, SPEC-013, TRACE-004]
---

# TRACE-005: Authentication Feature — First Application

Written progressively, per `SPEC-013` → "Progressive recording."

## Request

"go ahead" — resuming the Authentication feature (MERN + Next.js)
deferred during M21, now that M21 is approved. Per M21's own design
goal, this trace demonstrates the operating model deriving its own
process from the repository, not from the user re-stating it.

## Checkpoint: orient

**Status**: completed.

**Actions**: confirmed working tree clean, confirmed
`architecture.yaml` → `current_phase: M22`. `apps/`, `servers/`,
`packages/` all still `not-yet-created`.

## Checkpoint: classify

**Status**: completed.

**Classification** (`SPEC-011` → "Request classification"): application
implementation + technology adoption, dominant = application
implementation (the feature drives the technology choice).

## Checkpoint: understand

**Status**: completed.

**Actions**: checked for existing coverage — no SPEC/ADR/PLAN/backlog
item addresses this yet; genuinely new. Re-used this session's earlier
design work (already user-confirmed before the M21 detour): **JWT in
httpOnly cookies** (not response-body tokens), **core auth scope only**
(register/login/logout/current-user/route-protection; email
verification, password reset, and OAuth are out of scope and become
backlog items).

**Planning-required gate** (`development-lifecycle.md`, M21): trips —
technology adoption + security-sensitive + new architecture + multi-file

- external-integration-shaped (two deployables). A PLAN is required, not
  optional.

## Checkpoint: analyze

**Status**: completed.

**Technologies involved** (`technology-guidance.md`): Node.js, Express,
MongoDB, Mongoose, TypeScript, Next.js, React, JWT (`jsonwebtoken`),
`bcrypt`, `zod`. No technology skill exists for any of them
(`.agent/skills/` has only `validate-repository`) — per
`technology-guidance.md` step 3, `SPEC-008`'s technology-neutral
principles apply directly; ordinary work is not blocked by a missing
skill. No durable skill is proposed now — nothing here rises to
"ecosystem guidance," this is a project implementation choice
(`SPEC-012` → "Ecosystem vs. project").

**Contract placement** (`contracts.md`): the auth request/response shape
crosses a real boundary between two independent deployables
(`apps/web`, `servers/api`) that don't share source — owned by
`servers/api` (the boundary owner); `apps/web` defines its own local
types rather than a shared `packages/contracts` extraction, since reuse
across a second _independent package consumer_ isn't demonstrated, only
convenience is.

## Checkpoint: plan

**Status**: completed. See `ADR-012` (architecture/technology decisions)
and `PLAN-002` (implementation steps, acceptance criteria).

## Checkpoint: implement

**Status**: completed.

**Actions**: created `servers/api` (Express 5, Mongoose 9, `bcryptjs`,
`jsonwebtoken`, `zod`, `cookie-parser`, `cors`, `helmet`) —
`domains/auth/{user.model,auth.contracts,auth.service,auth.routes,
auth.middleware}.ts`, `app.ts`, `index.ts`, `config/env.ts`,
`db/connection.ts`. Created `apps/web` (Next.js 16 App Router, React 19)
— `/login`, `/register` (client forms), `/dashboard` (server component,
redirects unauthenticated), `src/lib/auth-client.ts` (browser fetch
wrappers), `src/lib/auth-server.ts` (server-side session check via
forwarded cookies), `next.config.ts` (`/api/**` rewrite proxy to
`servers/api`, `agentRules: false`). Root `typecheck`/`build` changed to
`pnpm -r --if-present run <script>` (`ADR-012`); `.gitignore` gained
`.next/`; `.prettierignore` created (Next.js's generated
`next-env.d.ts`); `eslint.config.js` gained a `.next/**` ignore and
Node/browser global blocks for `servers/**`/`apps/**`.

**Discoveries during implementation** (`SPEC-010` → "Discovery decision
model"):

- `bcrypt`'s native build vs. `bcryptjs` (pure JS) — **needed now**,
  resolved directly: swapped to `bcryptjs` to avoid native-compilation
  friction on this platform; an ordinary implementation choice, not
  escalated.
- pnpm 11's build-script approval (`bcrypt`/`esbuild`/
  `mongodb-memory-server` ignored by default) — **needed now**: added
  `allowBuilds` to `pnpm-workspace.yaml`, resolved directly.
- Express's `Request` augmentation and `tsc -b`'s portable-type
  requirement produced two real type errors — **needed now**: fixed
  directly (`declare global { namespace Express }` instead of augmenting
  an unresolvable transitive module; an explicit `Router` return type).
- `next dev` auto-generates a nested `AGENTS.md`/`CLAUDE.md` inside
  `apps/web` (Next.js 16's own agent-guidance feature) — **needed now**,
  not deferred: this directly conflicts with this repository's own
  deliberate root-level convention (`AGENTS.md`, `CLAUDE.md`), the exact
  kind of drift M11/M16 exist to prevent — disabled via
  `agentRules: false` and the generated files removed.
- `mongodb-memory-server` downloads a ~700MB `mongod` binary on first
  test run, exceeding Vitest's default 10s hook timeout — **needed
  now**: extended the specific `beforeAll` hook's timeout (cached after
  the first run, so this is a one-time cost, not a per-run tax).
- Deferred (already captured pre-implementation, confirmed still
  correct, no new items): `BACKLOG-001`–`BACKLOG-005`.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: `pnpm run validate` (lint, typecheck, test,
build, `validate:architecture`, `secrets:scan`) and `pnpm run
format:check` — both pass. `servers/api`'s `supertest` +
`mongodb-memory-server` suite (10 tests) covers every acceptance
criterion in `PLAN-002` at the API level. **Manual browser-equivalent
verification** (`validation.md`, M21 bullet): started both dev servers
for real and exercised the actual HTTP flow through the Next.js origin
(not directly against the API) — register (cookies set, `httpOnly`,
`SameSite=Lax`), `/dashboard` authenticated (200) vs. unauthenticated
(307 → `/login`), `/api/auth/me` authenticated vs. unauthenticated,
duplicate-email registration (409), wrong-password login (401), logout
(cookies cleared, subsequent `/me` → 401), refresh (issues a new access
token), and confirmed `/login`/`/register` render their forms. Test data
created during this manual pass was deleted from the local dev database
afterward; both dev server processes were stopped.

## Checkpoint: review

**Status**: completed.

**Self-review** (`development-lifecycle.md` → "Review dimensions"):
correctness — all `PLAN-002` acceptance criteria verified both by the
API test suite and the manual pass above. Architecture — respects
`apps/`/`servers/` boundaries and `ADR-002`'s
business-logic-in-the-owning-deployable rule; no `packages/` created
(no demonstrated cross-deployable reuse yet). Scope — only the core
slices `ADR-012`/`PLAN-002` named; email verification, password reset,
OAuth, refresh-token revocation, and deeper frontend test coverage are
in the backlog, not implemented. Quality — password never returned in
any response body (`toAuthUser` excludes `passwordHash`; the schema
field is `select: false`); generic error on bad login (no
email-enumeration signal). Regression — nothing pre-existing was
touched other than root tooling config (lint/typecheck/build wiring),
which the full validation gate covers. Maintainability — no
controller/service/repository layering beyond what `servers/api`
actually needed; `apps/web`'s two auth forms were kept separate rather
than forced into a shared abstraction for two small, slightly different
consumers.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `ADR-012` (new), `PLAN-002` (new), `BACKLOG-001`
through `BACKLOG-005` (new — the first real backlog items this
repository has had), this trace, `architecture.yaml`, `PROJECT-STATE.md`.
`apps/web` and `servers/api` created as real source for the first time.

## Checkpoint: git

**Status**: completed (no Git action taken).

No branch or commit was made — `change-management.md` → "commit only
when asked."

## Outcome

`completed`. The repository's first real application feature, and the
first trace to record an actual multi-technology implementation
(Express/Mongoose/JWT/bcryptjs/Next.js/React) rather than only
documentation/instruction changes. Five genuine discoveries surfaced
during implementation, all resolved to `needed now` and fixed directly
(none silently deferred, none manufactured); five pre-identified,
out-of-scope pieces of work were captured as real backlog items rather
than built or dropped.
