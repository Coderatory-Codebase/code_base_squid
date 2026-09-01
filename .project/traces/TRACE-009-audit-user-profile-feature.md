---
id: TRACE-009
type: trace
title: Audit — user profile feature against the operating model & engineering standards
status: completed
created: 2026-09-01
related: [TRACE-008, ADR-012, PLAN-002, SPEC-008, SPEC-010, SPEC-011, SPEC-012, SPEC-013]
---

# TRACE-009: Audit — User Profile Feature

Written progressively per `SPEC-013` → "Progressive recording." This is
an **audit trace** — read-only by explicit instruction (no remediation
until approved), so every checkpoint below records findings, not
changes.

## Request

Audit `TRACE-008`'s user profile feature against the entire operating
model and production/enterprise engineering standards, from a genuine
cold-start re-entry — not assuming correctness because validation was
green. Classify every finding into one of seven categories (Correct /
Project-level correction / Foundation gap / Missing skill-guidance /
Human decision required / Backlog candidate / Out of scope). No fixes,
no backlog items created speculatively — only what meets the existing
meaningful-discovery bar. Report, then wait for approval.

**Classification** (`SPEC-011`): `PROJECT` audit with a `FOUNDATION`
question built in (whether anything leaked out of PROJECT) — recorded
as `BOTH` in the sense that the audit itself inspects both layers,
though it changes neither yet.

## Checkpoint: orient

**Status**: completed.

**Actions**: confirmed working tree state (all of `TRACE-007`/`008`'s
changes still uncommitted, as left). Re-read, fresh, not from memory:
`servers/test/api/src/domains/auth/{user.model,auth.contracts,
auth.service,auth.routes,auth.middleware,auth.rate-limit}.ts`,
`apps/test/web/src/app/{dashboard/page,dashboard/logout-button,
profile/page,profile/profile-form,login/page,register/page}.tsx`,
`apps/test/web/src/lib/{auth-client,auth-server}.ts`. Re-read
`SPEC-008` (proportional architecture, reuse/generalization, use vs.
build vs. adopt, security/observability/testing principles),
`SPEC-010` (phase determination, analysis lenses, discovery model),
`SPEC-011` (request classification, foundation/project boundary,
human-in-the-loop), `SPEC-012` (skill creation criteria, missing-
guidance flow, implementation-area skills), `SPEC-013` (checkpoint
structure, classification field), `git status`/`git diff` scoped to
`AGENTS.md`/`.agent/`/`.project/specs`/`architecture.yaml` for the
`TRACE-008` timeframe specifically to check for foundation leakage.

## Checkpoint: classify / audit-analyze

**Status**: completed.

**Actions**: re-read every implementation file fresh (not from
conversation memory) — `user.model.ts`, `auth.contracts.ts`,
`auth.service.ts`, `auth.routes.ts`, `auth.middleware.ts`,
`auth.rate-limit.ts`, `app.ts`, `dashboard/page.tsx`,
`profile/page.tsx`, `profile/profile-form.tsx`, `login/page.tsx`,
`auth-client.ts`, `auth-server.ts`. Ran `git status --short` scoped to
`AGENTS.md`/`CLAUDE.md`/`architecture.yaml`/`.agent/`/`.project/specs/`/
`.project/ARTIFACT-TYPES.md` — empty, confirming no foundation file was
touched by `TRACE-007`/`TRACE-008`.

**Findings** (classified per the 7 categories the request specified):

1. **Request classification & scope** — `Correct`. `PROJECT`, no
   foundation touch; the one genuine ambiguity (what "profile" means
   with no existing fields) was escalated, not guessed.
2. **Phase determination rigor** — `Correct`, with a documentation
   caveat: `TRACE-008`'s plan checkpoint wrote "security review beyond
   what `requireAuth` provides: skipped," but a real security property
   (the update endpoint accepting only `displayName`, no mass-
   assignment surface) was true only because `zod`'s default
   unknown-key-stripping happened to provide it — this wasn't
   explicitly reasoned about at plan time, only correct by construction.
   Outcome is safe; the trace's own rigor was thinner than it should
   have been.
3. **Operating-layer instructions followed** — `Correct`. Feature
   slicing, use-vs-build-vs-adopt, contract placement, human-in-the-loop
   escalation all applied as designed.
4. **Foundation/project leakage** — `Correct`. Confirmed via the `git
status` check above — nothing leaked.
5. **Technology/implementation-area skill sufficiency** — `Correct`, no
   gap. Recurring patterns now exist (error-response mapping, protected-
   page redirect, form-component shape) across 3 real instances each —
   but all within **one** project. `SPEC-012` requires durable,
   cross-project value before a skill is warranted; generalizing from
   one project's repeated pattern would be exactly the "implementation
   choice silently becomes ecosystem policy" anti-pattern it exists to
   prevent. Not proposing one is the correct call _today_ — worth
   revisiting only if a second project ever reuses these same patterns.
6. **Missing durable skill/guidance to propose** — none clears the bar
   (see above). A lightweight, **project-local** convention note (not a
   skill) documenting the repeated route-handling/redirect/form shape
   could have real value — `Project-level correction`, optional, low
   priority.
7. **Technology choices confirmed vs. assumed** — `Correct`. No new
   technology was introduced by this feature; nothing needed confirming.
8. **Production/enterprise architecture appropriateness** — mostly
   `Correct`; proportional restraint (no controller/service/repository
   layering for one field) was the right call, not under-engineering.
   One real, justified extraction candidate found (next point).
9. **API decomposition** — the `ZodError` → `400` mapping is now
   duplicated verbatim across `register`, `login`, and `PATCH /me`
   (three real call sites); the "clear cookies, respond 401" pattern is
   duplicated across `GET /me`, `PATCH /me`, and `refresh`. This has
   crossed `SPEC-008`'s "≥2 real, independent" extraction bar —
   `Project-level correction`, small (two shared helpers, not a new
   layer).
10. **Controllers/services/repositories/models separation** — `Correct`
    as currently sized; adding that structure now would be the
    "ceremonial layers" anti-pattern `SPEC-008` warns against for a
    six-route file this size.
11. **Frontend decomposition** — page/component and server/client
    boundaries are correctly used (`profile/page.tsx` server,
    `profile-form.tsx` client, same shape as `dashboard`/
    `logout-button`). One real, repo-wide issue: every internal link
    (`dashboard`↔`profile`, `login`↔`register`) uses a plain `<a href>`
    instead of Next.js's `<Link>`, forcing a full page reload instead of
    client-side navigation — present since M22, propagated (not
    introduced) by this feature — `Project-level correction`, small,
    touches 5 existing files.
12. **Reuse of existing components** — login, register, and the new
    profile form share a near-identical label/input/error/submit shape.
    Two instances at M22 stayed under the reuse bar (`SPEC-008` →
    "Reuse and generalization": stable commonality across ≥2 real
    consumers); a third real instance now plausibly clears it —
    `Project-level correction` candidate, not urgent, genuinely
    borderline (the forms' _fields_ still differ meaningfully — this is
    closer to "worth reconsidering" than "clearly wrong").
13. **Unnecessary duplication** — the `<a href>` pattern, the two
    route-handler patterns above. No duplicated business logic, no
    duplicated data-fetching.
14. **Use vs. adopt vs. build** — `Correct`. No new dependency needed;
    none wrongly avoided.
15. **Tailwind/shadcn/React Query/testing-library guidance** — `Out of
scope` / not applicable. None of these are adopted in this project
    (plain CSS, native `fetch`, no data-fetching library) — there is
    nothing to guide because nothing was adopted; this is not a gap.
16. **Security** — mass assignment is prevented (by `zod`'s default
    key-stripping, confirmed by reading the schema), but the persistence
    layer doesn't independently enforce it: `updateDisplayName` calls
    `findByIdAndUpdate` **without `runValidators: true`** — Mongoose
    does not run schema validators (`maxlength`, future `required`/
    `match` rules) on update operations by default. Today this is
    harmless (the route's `zod` schema already enforces the same
    `max(60)`), but it means the model's own constraints are decorative
    on this code path — a real defense-in-depth gap, not hypothetical:
    any future direct call to `updateDisplayName` (or a future field
    added the same way) bypasses the schema entirely. `Project-level
correction`, small (`{ runValidators: true }`).
17. **Authorization** — `Correct`. `PATCH /me` reuses `requireAuth`
    identically to every other protected route.
18. **Validation** — `Correct`. `zod`, trimmed, bounded, unknown keys
    stripped.
19. **Error handling** — behaviorally `Correct`; structurally duplicated
    (see #9).
20. **Logging/observability** — no audit trail for profile changes.
    Already generally tracked by `BACKLOG-007` (auth audit/security
    logging), but that item's stated scope names only login/logout/
    failed-attempts — doesn't mention profile changes explicitly. Not a
    new backlog item; a scope note worth adding to the existing row when
    `BACKLOG-007` is picked up.
21. **Performance** — `Correct` / not a concern at this scale.
22. **Accessibility** — the "Saved." confirmation in `profile-form.tsx`
    renders as a plain `<p>`, not announced to a screen reader (no
    `role="status"`/`aria-live`). Real, minor — `Project-level
correction`.
23. **QA / test coverage** — API-level tests are solid (16 tests,
    including the new empty-display-name and unauthenticated cases). No
    test pins the `runValidators` behavior (would have caught #16
    directly). No frontend/component/E2E test for the profile form —
    already `BACKLOG-005`'s stated scope ("auth flows" generally), not
    a new gap specific to this feature.
24. **Test strategy sufficiency** — reasonable and proportional for
    current scope; known frontend/E2E gap is already tracked, not
    newly discovered here.
25. **Additional capabilities surfaced** — avatar/bio were explicitly
    **declined** by the user at scoping time (a `rejected` discovery
    outcome, correctly not backlogged, per `SPEC-010` → "Discovery
    decision model"). Nothing else meaningful surfaced beyond what's
    listed above.
26. **Technical debt silently accepted** — none beyond what's listed
    above (all now surfaced, not silent).
27. **Decisions that should have required human approval** — none
    found. Every choice made (verb, field limits, no new rate limiter
    on `PATCH /me`, no controller/service layering) was routine
    implementation autonomy within already-approved architecture
    (`SPEC-012` → "Routine implementation autonomy is unaffected").
28. **Traceability accuracy** — `TRACE-008` accurately reflects what was
    built and validated; its one weakness is the thin security-phase
    reasoning noted in #2, now corrected by this audit's own record.
29. **Repository docs/state accuracy** — `PROJECT-STATE.md` and
    `BACKLOG.md` both correctly reflect current reality; no drift found.

## Checkpoint: review

**Status**: completed.

**Self-review of this audit**: every finding above traces to a specific
file/line/behavior actually inspected this session, not a generic
checklist pass — consistent with the request's "do not assume
correctness because validation is green." No finding was invented to
appear thorough (the Tailwind/React Query/shadcn question, for example,
resolved to "not applicable" rather than being stretched into a
manufactured gap). No backlog item was created — per the explicit
instruction, only genuinely meaningful, actionable discoveries are
reported as candidates below, for the human to decide.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: this trace only. No code, SPEC, ADR, or backlog
file was modified — audit only, remediation withheld pending explicit
approval, per the request's own constraint.

## Outcome

`completed` (as an audit — no remediation performed). Findings reported
to the user below this trace; awaiting explicit approval before any
fix is applied.
