---
id: TRACE-014
type: trace
title: Personal notes feature
status: completed
created: 2026-09-03
related: [ADR-012, ADR-013, PLAN-004, SPEC-008, SPEC-010, SPEC-011, TRACE-005, TRACE-012]
---

# TRACE-014: Personal Notes Feature

Written progressively per `SPEC-013` → "Progressive recording."

## Request

"Add the ability for users to create, view, edit, and delete personal
notes within their account, in the `test` project (`apps/test/web` +
`servers/test/api`)." Given directly as an implementation request (not
an exploration request), naming the project and both deployables
explicitly.

**Classification** (`SPEC-011`): `PROJECT` — `apps/test/web` +
`servers/test/api`. No foundation change anticipated at request time
(confirmed at REVIEW below).

**M25 "no next application feature without explicit instruction"
check** (`PROJECT-STATE.md` → "Currently active"): this request is
itself the required explicit instruction — it names the project and
both deployables directly, the same way the account-security-settings
and profile requests did. Proceeding is consistent with that
constraint, not a violation of it.

## Checkpoint: classify / guidance / understand / analyze

**Status**: completed.

**Repository orientation performed**: `AGENTS.md`, `architecture.yaml`
(`roadmap.current_phase: M26`, no M26 milestone entry — "next milestone
defined only once a concrete need identifies one"),
`agent-operating-contract.md`, `backlog-and-feature-development.md`,
`PROJECT-STATE.md`, `.project/backlog/BACKLOG.md`,
`.project/ARTIFACT-TYPES.md`, `engineering-standards.md`,
`technology-guidance.md`, `traceability.md`, `development-lifecycle.md`,
`validation.md`, and the existing `auth`/`session` domain source in
`servers/test/api/src/domains/auth/*` plus the existing frontend
conventions in `apps/test/web/src/app/{dashboard,profile,settings}` and
`apps/test/web/src/lib/auth-client.ts` (full detail gathered via a
research pass; not restated here).

**Does it already exist?** No note-taking capability exists anywhere in
the repository; `.project/backlog/BACKLOG.md`'s nine items (`BACKLOG-001`
through `BACKLOG-009`) contain nothing related to notes.

**Planning-required gate** (`development-lifecycle.md`): trips — new
Mongoose schema, multiple files across two deployables, multiple
acceptance criteria (create/view/edit/delete + ownership isolation).
Not security-sensitive in the credential sense, not a new architecture,
no external integration, no new dependency.

**Use vs. build vs. adopt** (`SPEC-008`, M23): nothing to adopt — a
"note" is a plain owned document, same shape as the existing `Session`
record. No new npm dependency needed (Mongoose/Express/Zod/Next.js
already in the technology profile). Build new, following the existing
`auth`/`session` domain pattern exactly (own `notes` domain directory,
not bolted onto `auth`).

**Technology guidance** (`technology-guidance.md`/`SPEC-012`): no new
technology involved — routine implementation inside the already-adopted
stack. No skill creation/change question arises.

**Architecture**: no new architectural decision. This is a straight
analogy to the existing `Session` collection (`userId`-scoped Mongoose
document, `requireAuth`-protected routes, ownership-checked lookups
returning `404` rather than `403` for another user's resource — the
same pattern `session.service.ts`/`auth.routes.ts` already establish
and `auth.routes.test.ts` already tests for). No ADR needed.

**Phase determination** (`SPEC-010`): backend (model, contracts,
service, routes), frontend (notes page + list/create/edit/delete UI),
testing (route-level + ownership isolation + persistence-layer
validation), no separate "architecture" phase (nothing new to design),
no security phase beyond the standard authorization-boundary review
folded into REVIEW.

**Engineering lenses selected** (`SPEC-008`): correctness, architecture
(fit with existing domain-per-directory model), maintainability/reuse
(follow existing contract/service/route conventions, reuse
`requireAuth`/`sendError`), security (per-user data isolation — the
central risk in any "personal X" feature: never let one user read/edit/
delete another's notes), accessibility (form/list UI, matching the
`aria-live`/`role="alert"` convention already established), testing/QA
(route tests + ownership isolation + manual browser pass), data
(schema field limits, input validation). Explicitly **not** selected:
performance (no scale concern for a personal-notes CRUD list),
observability (no logging/metrics infra exists or is warranted for this
size of feature — consistent with every prior feature), API/integration
beyond the existing same-origin proxy (no external system involved).

**Adjacent-capability scan** (per `SPEC-010`'s discovery model — not a
mandated checklist, applied because a "notes" feature plausibly has
adjacent asks): considered during implementation, resolved below under
"Discoveries."

## Checkpoint: plan

**Status**: completed. See `PLAN-004`.

## Checkpoint: implement

**Status**: completed.

**Worktree sync note**: this session runs in an isolated Git worktree
(`.claude/worktrees/agent-ac5262e4129958bcb`) that had branched from an
older commit and was missing the M23 project-boundary correction and
all of M24/M25's uncommitted working-tree changes (session store,
account security settings, ADR-014, TRACE-011/012, etc.) that the
shared checkout already had. Before implementing, `git merge main`
brought in the 3 missing committed milestones, and the remaining
uncommitted shared-checkout changes were copied file-by-file into the
worktree so its `git status --short` matched the shared checkout
exactly (plus this feature's own new files) before any notes code was
written — otherwise the notes feature would have been built against a
stale, pre-session-store version of `auth`.

**Actions — backend**: new `servers/test/api/src/domains/notes/`
domain, mirroring `auth`/`session`'s exact shape: `notes.model.ts`
(`Note` schema — `userId` ObjectId ref+index+required, `title`
required/trim/1-200 chars, `body` optional/trim/max 20000 chars,
`{ timestamps: true }`); `notes.contracts.ts` (zod
`createNoteRequestSchema`/`updateNoteRequestSchema` — the update schema
`.refine()`s that at least one field is present — plus a plain
`NoteSummary` response interface, same zod-for-input/interface-for-
output split `auth.contracts.ts` already uses); `notes.service.ts`
(`createNote`/`listNotes`/`getOwnedNote`/`updateOwnedNote`/
`deleteOwnedNote`, every read/write scoped by `{ _id, userId }` —
same ownership-filter idiom as `getOwnedSession`; `updateOwnedNote`
uses `runValidators: true`, matching the `TRACE-009`/`010` defense-in-
depth precedent); `notes.routes.ts` (`GET/POST /`, `GET/PATCH/DELETE
/:id`, `requireAuth` applied router-wide via `.use()`, the same
`sendError`/`404`-not-`403` ownership pattern as `auth.routes.ts`'s
session routes). Mounted in `app.ts`: `app.use("/api/notes",
notesRouter)`.

**Actions — frontend**: new `/notes` page (server component, same
`getCurrentUser()`/`redirect("/login")` gate as `/dashboard`/`/profile`/
`/settings`) + `note-list.tsx` (client component combining
`session-list.tsx`'s fetch-on-mount/per-item-pending-id list pattern
with `change-password-form.tsx`'s controlled-form/`role="alert"`
pattern, plus inline per-note edit toggling). New
`lib/notes-client.ts` (same local-duplicate-types +
`readErrorMessage`/fetch-wrapper idiom as `auth-client.ts` — ADR-012's
contract-placement boundary: the two deployables don't share source).
Dashboard gained a `/notes` link. `globals.css` gained `textarea`
styling (didn't exist before — no prior form needed one), a wider
`main.notes-page` container (the existing 24rem form-width convention
doesn't fit a growing note list), and `.note-list` layout rules —
additive only, no existing rule changed.

**Discoveries during implementation/review** (`SPEC-010` → "Discovery
decision model" — each resolved to one of five outcomes, none left
hanging):

1. **Needed now, fixed directly**: the new mutating routes
   (`POST`/`PATCH`/`DELETE /api/notes*`) initially had no rate
   limiting. `auth.rate-limit.ts`'s own comment states its
   `createProfileRateLimit` factory exists so "every mutating auth
   route gets a limit for a consistent posture, not just the
   unauthenticated ones," and `TRACE-010` already extended that same
   limiter to `PATCH /me` when profile mutation was added post-hoc —
   an established convention, not a new decision. Reused the existing
   factory (`import { createProfileRateLimit } from
"../auth/auth.rate-limit.js"`) rather than defining a parallel one.
2. **A TypeScript-only deviation from the intended pattern, fixed
   directly**: the first draft of the `:id` routes used
   `req.params.id ?? ""`, but `auth.routes.ts`'s own `DELETE
/sessions/:id` uses `typeof req.params.id === "string" ? ... : ""`
   — adding the rate-limit middleware as an extra handler argument
   changed Express 5's inferred `req.params` type enough that `?? ""`
   no longer typechecked. Corrected to match the existing idiom exactly
   (not merely to satisfy the compiler) across all three `:id` routes.
3. **Already tracked, referenced not duplicated**: the new frontend
   components (`note-list.tsx`) have zero automated test coverage —
   `BACKLOG-005` already covers exactly this gap for the auth flows;
   its Notes column was updated to note the notes feature shares it,
   no new item created.
4. **Considered, explicitly rejected (adjacent-capability scan)**:
   search/filter, tagging, sharing, rich text/Markdown, archive/trash,
   export, and pagination are all plausible "notes app" features. None
   has a concrete signal of need in this request, and M20's/M25's own
   precedent (`TRACE-003` recorded zero manufactured discoveries;
   `TRACE-013` explicitly declined a plausible-sounding "adjacent-
   capability scan" step as checklist explosion) is not to backlog
   speculative capabilities absent real signal. Recorded here and in
   `PLAN-004` → "Out of scope" as a reasoned decision, not silently
   dropped and not backlogged.

**Deviations from plan**: none — `PLAN-004`'s scope, layout, and
acceptance criteria were all implemented as written; the rate-limiting
and params-typing items above are REVIEW-stage refinements within that
same plan, not scope changes.

## Checkpoint: validate

**Status**: completed.

**Automated validation**: `pnpm --filter @nut-shyll/test-api run
typecheck` and `pnpm --filter @nut-shyll/test-web run typecheck` both
clean. `pnpm run test` — 49/49 passed (29 existing + 20 new:
`notes.routes.test.ts` covering create success/no-body/empty-title-
rejected/overlength-title-rejected, list-isolated-per-user/empty,
get-own/get-other-404, update-both-fields/update-one-field/reject-
empty-update/update-other-404, delete-own/delete-other-404-and-data-
intact, and the persistence-layer `runValidators` defense-in-depth
test bypassing the route's zod schema). Full `pnpm run validate`
(lint, typecheck, test, build — including a real `next build` that
lists `/notes` as a registered route, `validate:architecture`,
`secrets:scan`) — clean on the first full run after the params-typing
fix (see discovery 2 above; the typecheck step legitimately failed
once, was fixed, then the full pipeline was re-run clean, not silently
retried). `pnpm run format:check` — failed once on the initial new
test file (unformatted), `prettier --write`, re-ran clean — same
routine pattern every prior trace in this repository has recorded
honestly rather than smoothing over.

**Manual verification** (`validation.md`, M21 bullet — a real UI change
and a new set of authenticated CRUD endpoints): started both real dev
servers (`servers/test/api` on port 4100 against a live local MongoDB,
`apps/test/web` on port 3100) and exercised the feature with real HTTP
requests through them (this environment has no interactive browser
available — see the honest limitation noted in the M26 report's item
10). Verified: registered two real users; user A created two notes
(one with a body, one without) via `POST /api/notes`; `GET /api/notes`
listed both for A, newest first, and an empty list for B (cross-user
isolation); `PATCH` updated A's note; B's `GET`/`DELETE` against A's
note both returned `404` and the note was confirmed intact afterward
(the delete did not silently succeed); A's real delete returned `204`
and removed it from A's own list; an unauthenticated `GET /api/notes`
returned `401`; a whitespace-only title was rejected with `400`;
through the real Next.js dev server, an unauthenticated `GET /notes`
returned a real `307` redirect to `/login`, and after a real login
through the actual same-origin `/api/**` rewrite proxy, `GET /notes`
returned `200` and `GET /api/notes` (proxied) returned the correct
data. Test data (2 users, notes, a dedicated `nut-shyll-manual-verify-
notes` database) was dropped afterward and both dev servers were
stopped — confirmed no process still listening on ports 4100/3100.

## Checkpoint: review

**Status**: completed.

**Self-review** (`development-lifecycle.md` → "Review dimensions"):
Correctness — every `PLAN-004` acceptance criterion verified by both
the test suite and the real manual pass above. Architecture — no new
architectural decision; the domain is a structural analogy to the
existing `Session` collection, correctly kept as its own
`domains/notes/` directory rather than bolted onto `auth` (same
decomposition boundary `session.service.ts` already established as
distinct from `auth.service.ts`). Maintainability/reuse — reused
`requireAuth`, the `sendError`/`{error:{message,code}}` shape, the
`runValidators: true` defense-in-depth idiom, and (after the discovery
above) the existing `createProfileRateLimit` factory, rather than
re-deriving any of them; the one new local helper
(`notesMutationRateLimit`) stays inside the notes domain because it's
still the only consumer of that specific configuration, consistent
with the repo's stated reuse-extraction bar. Security — every note
operation is filtered by `{ _id, userId }` at the query level (never
"fetch then check in application code," the same pattern that made
`auth.routes.test.ts`'s cross-user tests pass for sessions); cross-user
access returns `404`, never leaking existence of another user's data;
mutating routes are rate-limited consistent with the rest of the
authenticated surface; input is validated both at the route (zod) and
persistence (Mongoose `runValidators`) layers. Accessibility — the new
form/list reuse the established `role="alert"` error convention;
`<label>` wraps every input/textarea (matches existing forms); no new
custom interactive control that would need additional ARIA beyond
plain `<button>`/`<input>`/`<textarea>`. Scope — exactly what
`PLAN-004` specified (create/view/edit/delete, owned); no adjacent
capability was folded in (see discovery 4). Regression — the full
existing 29-test auth/session suite still passes unchanged; `app.ts`'s
only change is one new `app.use` line, additive.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `PLAN-004` (new), this trace (new);
`servers/test/api`'s `src/domains/notes/{notes.model,notes.contracts,
notes.service,notes.routes}.ts` (new), `src/app.ts` (amended — one
import + one `app.use` line), `test/domains/notes/notes.routes.test.ts`
(new, 20 tests); `apps/test/web`'s `src/app/notes/{page,note-list}.tsx`
(new), `src/lib/notes-client.ts` (new), `src/app/dashboard/page.tsx`
(amended — one new link), `src/app/globals.css` (amended — additive
`textarea`/`.notes-page`/`.note-list` rules). `.project/backlog/
BACKLOG.md` (amended — `BACKLOG-005`'s Notes column extended, no new
row) and `.project/state/PROJECT-STATE.md` (amended — "Currently
active" section) next, per "Checkpoint: git" below. No ADR — no
architectural decision was made (see "Checkpoint: classify" above).

## Checkpoint: git

**Status**: completed (no Git action taken) — `change-management.md`
→ "commit only when asked." The working tree (this isolated worktree)
is left with these real, uncommitted changes.

## Outcome

`completed`. The fourth real application feature built through this
operating model, and the first built inside an isolated Git worktree
that required an explicit, deliberate sync step (merge + targeted file
copy) before it matched the shared checkout's actual state — recorded
above as a genuine, evidence-worthy environmental discovery in its own
right (see the M26 report's audit of item 12/"verify you're following
your own derived architecture" and the honest-limitations section for
why this isn't glossed over). The one genuine implementation-time
discovery requiring a fix (missing rate limiting on the new mutating
routes) was resolved by directly applying an already-established
repository convention, not by inventing a new one or escalating a
routine implementation choice.
