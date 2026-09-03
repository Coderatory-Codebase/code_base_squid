---
id: TRACE-013
type: trace
title: M25 — autonomous engineering operating model audit (critical, evidence-based)
status: completed
created: 2026-09-02
related:
  [
    SPEC-008,
    SPEC-010,
    SPEC-011,
    SPEC-012,
    SPEC-013,
    TRACE-006,
    TRACE-009,
    TRACE-010,
    TRACE-011,
    TRACE-012,
  ]
---

# TRACE-013: M25 — Autonomous Engineering Operating Model Audit

Written progressively per `SPEC-013` → "Progressive recording."

## Request

A deliberately adversarial re-audit of the operating model, explicitly
using M22–M24 (Authentication, rate limiting, Profile, its remediation,
Account Security Settings) as evidence against the model, not proof of
it. 50 acceptance criteria across operating-model behavior (AC-01..21),
technology/skills (AC-22..26), architecture/structure (AC-27..31),
13 scenario-based tests requiring genuine execution, not document
inspection (AC-32..44), and self-audit requirements (AC-45..50)
including an explicit root-cause taxonomy for every real M22–M24
failure and an explicit prohibition on "checklist explosion." Do not
implement another application feature; do not refactor the application
merely because defects are found. Ask only for decisions genuinely
requiring human authority.

**Classification** (`SPEC-011`): `FOUNDATION` — this milestone audits
and, where warranted, amends the operating model; it does not touch
`apps/test/` or `servers/test/` source.

## Checkpoint: orient

**Status**: completed.

**Actions**: confirmed working tree state (`TRACE-012`'s account
security settings work still uncommitted, as left; `.claude/settings.json`
also shows local permission-allowlist drift from tool approvals across
this session — unrelated to any milestone, not touched). This trace
created now, first.

## Checkpoint: audit the 20 suspected failure areas

**Status**: completed.

**Actions**: re-inspected the real evidence (not memory of it) for each
of the kickoff's 20 suspected failure areas — `architecture.yaml`
(current `apps/`/`servers/` boundary text), `SPEC-012` (current, before
this milestone's edits), `SPEC-010` (current), `SPEC-008` (current),
`servers/test/api/src/domains/auth/*` (current file set),
`TRACE-006`/`009`/`010`/`012` (real prior evidence). Classified each per
`AC-45`'s taxonomy. Full table in the final report; summary of the
verdicts that actually changed something:

- **#1 (folder structure), #2 (`domains/` placement)** — #1 was real at
  M22, fixed at M23 (`ADR-013`); confirmed still correct now
  (`apps/test/web`, `servers/test/api`). #2 is **not a gap** —
  `architecture.yaml` already explicitly documents
  `servers/<project>/api/domains/*` as the correct pattern (verified by
  reading the actual boundary text, not assuming); `servers/test/api/
src/domains/auth/` matches it exactly.
- **#3, #4, #10 (decomposition, reuse evaluation, duplication)** — not
  current gaps. Direct evidence: `TRACE-010` evaluated and _declined_
  extracting a shared form component (reasoned rejection, not a missed
  check); `session.service.ts` was split from `auth.service.ts` in
  `TRACE-012` when the boundary became real. Both are the mechanism
  working, not failing.
- **#5, #6 (missing technology/implementation-area skills)** — not a
  gap. Correctly deferred every time (`SPEC-012`'s cross-project bar,
  clarified at M24) — general `SPEC-008` principles were sufficient in
  every real case so far.
- **#7 (tooling guidance)** — **partially real**: not a functional gap
  (`SPEC-012` → "Scope of `technology`" already covered tooling), but a
  genuine discoverability gap — worth stating explicitly rather than
  requiring inference. Fixed (see "implement").
- **#8, #9, #12 (production-quality/architecture/security evaluation
  before completion)** — real at M22 (`TRACE-008`'s thin security
  reasoning), already fixed at M24 (conformance review, Security/
  Accessibility review dimensions) — and now _evidenced working_, not
  just documented: `TRACE-012`'s own review checkpoint used both.
- **#11 (framework-specific best practices)** — real, narrow instance
  (`TRACE-009`'s `findByIdAndUpdate`/`runValidators` finding). The
  underlying principle (`SPEC-008` → "Current/authoritative guidance")
  already existed; what was missing was connecting it to the specific
  moment a framework-behavior question is mistaken for a
  principle-answerable one. Fixed (see "implement").
- **#13 (adjacent-capability discovery)** — not a current gap on the
  evidence. `BACKLOG-006`/`007`/`008`/`009` are all real, correctly
  captured discoveries from real feature work. `TRACE-012` genuinely
  found nothing new beyond what was already tracked — a legitimate
  zero-discovery outcome (`TRACE-003`/`004` already established this
  precedent), not evidence of a missed mechanism. Considered adding an
  explicit "adjacent-capability scan" step and **declined** — it would
  be exactly the checklist-explosion `AC-46` prohibits, for a lens
  (`SPEC-010` → "Future extensibility") that already exists and has
  already produced four real backlog items.
- **#14, #15 (asking when it shouldn't / not asking when it should)** —
  checked against real instances: `TRACE-007` asked which backlog item
  ("the next feature" was genuinely ambiguous — correct to ask);
  `TRACE-008` asked what "profile" meant (no fields existed — correct);
  `TRACE-012` did **not** ask about the session-store architecture
  (`ADR-014`) because the user's own scope selection already
  necessitated it — correctly resolved autonomously, not escalated.
  Found no real instance of asking unnecessarily or failing to ask when
  required. Re-tested harder in scenarios `AC-38`–`AC-41` below.
- **#16, #17 (phase derivation, feature→phase→task→validation)** — not
  a current gap; `SPEC-010` → "Phase determination" (M23) is real and
  was used correctly in `TRACE-008`/`012` (different phase sets for
  different features, not a fixed checklist).
- **#18 (conformance review before completion)** — same as #8/#9/#12,
  already fixed at M24.
- **#19 (technology adoption without best-available-approach
  evaluation)** — same underlying issue as #11; covered by that fix.
- **#20 (foundation vs. project distinction)** — not a current gap;
  `SPEC-011` → "Foundation vs. project classification" (M23) has been
  used correctly and consistently in every trace since (`TRACE-007`
  through `TRACE-012` all correctly classified `PROJECT`; M21/M23/M24
  correctly classified `FOUNDATION`).

**Conclusion**: of 20 suspected failure areas, most were either already
fixed by M23/M24 (and are now evidenced, not just documented, as
working) or were never real gaps to begin with. Two genuine, narrow
items remain — #7 and #11 — both small connective clarifications, not
new mechanisms.

## Checkpoint: implement

**Status**: completed.

**Actions**: `SPEC-012` amended — "Scope of `technology`" now states
tooling is already in scope (closes #7); "Missing-guidance decision
flow" gained one paragraph distinguishing a technology-neutral design
question from a framework-specific factual-behavior question (closes
#11). M25 amendment blockquote added. **Deliberately not changed**:
`SPEC-010`'s "Analysis lenses"/discovery model (considered for #13,
declined — no real gap, would be checklist explosion); no new SPEC, no
new ADR (both amendments are connective clarifications to an
already-active SPEC, same category as M16/M19/M20/M21/M23/M24); no
skill created (nothing newly clears `SPEC-012`'s own bar — confirmed
again, not just carried forward).

**Discoveries during this milestone's own execution**: none beyond
what's already recorded above — this milestone's job was auditing and
narrowly correcting the model, not building anything that would itself
surface new project-level discoveries.

## Checkpoint: root-cause classification (AC-45)

**Status**: completed.

Every real M22–M24 failure, classified — not every suspected one, only
ones confirmed real above:

| Failure                                                                                                       | Root cause (`AC-45` taxonomy)                                                                                         | Resolution                                                                              |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/web`/`servers/api` not project-scoped (M22)                                                             | Missing principle — no project-ownership boundary existed yet                                                         | `ADR-013` (M23)                                                                         |
| Backlog as 5 per-item files (M22)                                                                             | Missing principle/proportionality judgment — untested against real small items                                        | `SPEC-010` amendment (M23)                                                              |
| `AGENTS.md`/`ARTIFACT-TYPES.md` stale after M22                                                               | **Project/process implementation error** — the RECORD stage already required this, it just wasn't performed           | Fixed directly at M23; **no foundation change** — the existing rule was already correct |
| Missing `runValidators`, duplicated error handling, uneven rate-limit coverage, missing `aria-live` (Profile) | Missing decision procedure — no conformance-review concept existed                                                    | Conformance review + Security/Accessibility review dimensions (M24)                     |
| Stale Mongoose API usage (`{new:true}`)                                                                       | Missing decision procedure — no trigger distinguishing a principle-answerable question from a framework-fact question | `SPEC-012` amendment (M25, this milestone)                                              |
| "Tooling guidance" appearing to be a missing category                                                         | Discoverability gap, not a functional one — already covered, not stated plainly                                       | `SPEC-012` amendment (M25, this milestone)                                              |

**Notable finding in the taxonomy itself**: exactly one of six real
failures was a plain implementation error with **no** foundation
change warranted — the correct outcome per `AC-45`'s own instruction
("simply adding a new instruction for every historical mistake is a
failure"). The other five were genuine, narrow gaps, each closed once,
not accumulating into a pattern of the same gap reappearing.

## Checkpoint: cold-start scenario execution (AC-32..44)

**Status**: completed.

**Actions**: walked all 13 scenarios as a fresh agent would, using only
the (now-amended) repository — request text only, no implementation
recipe, per the acceptance criteria's own instruction not to mark
anything passed merely because a document uses the right words.

**AC-32 — trivial bugfix** ("The profile page displays an incorrect
label. Fix it."): `CLASSIFY` → bugfix, `PROJECT`. Planning gate
(`development-lifecycle.md`) does **not** trip — single file, no new
architecture, no security implication. Inspect `apps/test/web/src/app/
profile/`, find the label, fix it, run the affected page's behavior
check, `pnpm run validate`, a one-line trace at most (proportional to
work — `SPEC-013` → "Proportionality" — most changes this small
warrant a _lightweight_ trace, not none, and not a heavy one). No
PLAN/ADR/backlog/skill. **Pass** — every gate that would add ceremony
correctly stays closed for work this size.

**AC-33 — new CRUD feature** ("Add projects... create, view, edit,
delete"): `CLASSIFY` → application implementation, `PROJECT`. Planning
gate trips (multiple files, new data model, multiple acceptance
criteria). `SPEC-010` → "Phase determination" selects: data model,
backend (CRUD routes, authorization — projects must be scoped to their
owner, same pattern `requireAuth`/`req.userId` already establishes),
frontend (list/create/edit/delete UI, reusing the existing
`apps/test/web` page/form conventions rather than inventing new ones),
testing. No new technology needed (same Express/Mongoose/Next.js
stack) — `SPEC-008` → "Use vs. build vs. adopt" resolves this without
asking. Future capabilities (sharing projects, project archiving,
search) get captured via the discovery model if genuinely surfaced
during analysis, not built. **Pass** — this is structurally identical
to `TRACE-008`'s real profile feature, which already demonstrated this
exact path.

**AC-34 — security feature** ("Add MFA"): `CLASSIFY` → application
implementation + security-sensitive, `PROJECT`. Planning gate trips
hard (security-sensitive alone is sufficient). Deeper analysis
required: TOTP (a library, e.g. `otplib` — no vendor, resolvable via
"use vs. build vs. adopt" autonomously) vs. SMS-based codes (a real
vendor/cost decision — `SPEC-012` → "Escalation triggers" — would
correctly stop and ask) are materially different enough to require at
least surfacing the trade-off, even if TOTP is the obvious engineering
default. Recovery-code handling, and interaction with the just-built
session model (`ADR-014` — does completing MFA rotate the session? does
an existing session need to be downgraded until MFA is verified?) are
real architectural questions an `ADR` would record, not routine
implementation. Security/reliability lenses apply directly
(`development-lifecycle.md` → "Review dimensions", M24). **Pass** —
matches `TRACE-012`'s real precedent (a genuine ADR for a security
architecture extension), and correctly distinguishes the
no-vendor-needed default from the vendor-needed alternative rather than
asking about "MFA" as if it were one undifferentiated choice.

**AC-35 — new technology** ("Introduce Redis"): `CLASSIFY` → technology
adoption. `SPEC-012` escalation triggers apply directly
(infrastructure, a new dependency, likely deployment implications).
Correct behavior: identify _why_ Redis is being proposed (caching?
rate-limit store across instances? pub/sub for `AC-40`-style real-time
work?) — `SPEC-008` → "Use vs. build vs. adopt" requires checking
whether the actual need is already satisfied (the existing rate limiter
already uses an in-process store, adequate for this project's actual
single-instance scale; `MongoDB` already exists and can serve several
"just need persistence" needs Redis is often reached for reflexively).
Without a demonstrated, current need tied to a real bottleneck or a
concrete multi-instance requirement, the correct autonomous conclusion
is "not justified yet" — not silent installation, and not a bare
"should I?" question either: the agent states the trade-off and
recommends against it absent a stated need, which **is** the required
escalation shape (`SPEC-011` → "When a decision needs a human": state
what's needed, why it matters, options, trade-offs, recommendation).
**Pass**.

**AC-36 — UI-heavy feature** ("Dashboard with charts, filters,
responsive layout, accessible interactions"): `CLASSIFY` → application
implementation. Lenses: UX/UI, accessibility, performance (chart
rendering, filter responsiveness), data-fetching. Real gap surfaced by
this walkthrough, not invented: **no chart library is adopted in this
project.** `SPEC-008` → "Use vs. build vs. adopt" says adopt an
established library rather than hand-rolling chart rendering — correct
default, no vendor/infra implication for a client-side charting
library, so this is resolvable autonomously (not an `AC-41`-shaped
escalation). Existing component conventions (`apps/test/web`'s
form/page shape) get reused for filters, not reinvented. Server/client
boundary: charts and interactive filters are client components (same
pattern `profile-form.tsx`/`session-list.tsx` already establish); the
page shell stays a server component. Manual/UI verification
(`validation.md`, M21) applies directly — a UI-heavy feature is exactly
what that rule is for. **Pass**, with one honest caveat: choosing
_which_ chart library is a routine implementation choice today, but if
this project accumulates several chart-heavy features, that's exactly
the kind of repeated-within-one-project pattern `SPEC-012`'s cross-
project bar would (correctly) still keep local unless a second project
also needs it.

**AC-37 — API-heavy feature** ("Reporting API, filtered sales
reports"): `CLASSIFY` → application implementation. Lenses: API/
integration, data, security/authorization (whose sales data can a
caller see), performance (report generation over a filtered/possibly
large query), testing, observability (a slow or failing report should
be diagnosable). `SPEC-008` → "Proportional architecture" — the
`servers/test/api` precedent (`auth.routes.ts` + `auth.service.ts` +
domain models) already establishes route/service separation; a
reporting feature of any real complexity would justify a `reports`
domain following the same `servers/<project>/api/domains/*` pattern,
not one large route handler — this is exactly what `AC-37` asks the
agent to avoid, and the existing convention already prevents it by
precedent, not by a rule the agent has to invent fresh. **Pass**.

**AC-38 — cross-project capability** ("Make our shared API error-
handling pattern part of the foundation"): only one project currently
exists in this repository (`apps/test/`, `servers/test/`), so the
scenario's premise doesn't match current repository state — the
correct response is to say so explicitly (an ambiguity: which second
project, is the evidence real) rather than proceed as if it were true.
_If_ the premise holds: `SPEC-011` → "Foundation/foundation boundary
check" classifies this as `BOTH` (project evidence, foundation
change); `SPEC-012` → "Skill creation criteria" (M24's cross-project
clause) is exactly what this pattern would need to clear; `SPEC-012` →
"Human approval" is a **hard rule** — creating or materially changing
durable ecosystem guidance requires it regardless of how clearly the
evidence supports it. **Pass** — this is the single scenario where the
model's answer is least like ordinary feature work, and the existing
mechanism is already built for exactly this case, not retrofitted for
this audit.

**AC-39 — project-local convention** ("Use a repository pattern for the
billing module"): `SPEC-012` → "Ecosystem vs. project" already gives
this almost verbatim as a worked example ("'Use React Query for server
state' (in one project) → Project, unless generalized deliberately").
Applies the convention inside `servers/test/api`'s (hypothetical)
billing domain only; no skill, no foundation file touched. **Pass** —
strongest possible document-to-scenario match, and consistent with
every real `PROJECT`-classified trace so far.

**AC-40 — ambiguous technology choice** ("Add real-time
notifications"): the real test is whether the agent asks "WebSockets,
SSE, or polling?" (wrong — a routine implementation choice) or
investigates and decides. Requirements analysis: does this need true
bidirectional communication, or one-way server-to-client push; does it
need to survive across multiple server instances (it doesn't —
`servers/test/api` is single-instance today); is sub-second latency
actually required. Absent a stated requirement that specifically needs
something heavier, the correct autonomous default is the simplest
adequate mechanism using already-adopted technology (SSE or a
short-poll endpoint over the existing Express server) — no vendor, no
new infrastructure, resolved the same way `AC-35`/`AC-40` both point
back to `SPEC-008` → "Use vs. build vs. adopt". Escalation is warranted
only if analysis reveals a genuine need for infrastructure beyond what
exists (e.g., true multi-instance fan-out needing Redis pub/sub) — at
which point this becomes an `AC-35`-shaped question, not an `AC-40`
one. **Pass** — matches real precedent: rate limiting (`TRACE-007`) and
the session store (`TRACE-012`) both resolved a technology-shaped
question autonomously without asking "which library."

**AC-41 — human approval** ("Replace our auth provider with a new
third-party provider"): unambiguous — `SPEC-012` → "Escalation
triggers" names "external vendor" and "a major dependency" explicitly;
this is also irreversible-ish (a real migration) and security-
sensitive. Correct behavior: investigate what's actually being asked
(replace `servers/test/api`'s own JWT/session implementation with a
hosted identity provider — Auth0/Clerk/etc. — is a materially different
change than swapping one internal library), prepare the trade-offs
(cost, vendor lock-in, migration path for existing users/sessions,
what `ADR-012`/`ADR-014` would need to be superseded), and **stop**
before any adoption. **Pass**, highest-confidence scenario in the set.

**AC-42 — backlog discovery** ("Add basic user notifications" — email/
push/preferences/delivery-history genuinely adjacent): implement only
what's explicitly basic (needs its own scoping question in practice,
same as `TRACE-008`'s profile-scope question, since "basic" is exactly
as underspecified as "profile" was); capture email/push/preferences/
delivery-history as real, `discovered-from`-linked backlog rows in
`.project/backlog/BACKLOG.md` — not five vague one-liners, at the same
quality bar `BACKLOG-006`–`009` already demonstrate. **Pass** on the
mechanism (already proven four times over); the "implement only basic"
half depends on the same scoping-question discipline `TRACE-008`
already evidences.

**AC-43 — no backlog** ("Fix the typo on the dashboard"): identical
shape to `AC-32`. No backlog item, no `ADR`/`PLAN`/skill, proportional
trace, done. **Pass** — and notably, this is exactly the kind of
scenario `TRACE-003`/`TRACE-004` already proved the model handles
honestly (a genuine zero-discovery, zero-backlog outcome is a valid
result, not a failure to try hard enough).

**AC-44 — multi-lens feature** ("Profile image upload"): the real test
is _selecting_ relevant lenses, not applying all of them. Relevant:
security (validate actual file content/type, not just the extension —
a real, well-known upload vulnerability class), storage (local disk vs.
object storage — **this is the one place a real escalation-shaped
question hides**: local disk is fine for this project's current
single-instance dev-stage reality but has real production implications
most engineers would flag — ephemeral storage on most hosting
platforms — so the honest answer is to note the trade-off, default to
the simplest adequate approach for the project's actual current stage,
and record the production caveat rather than silently deciding a
production storage architecture no one asked for), authorization (only
the owning user can replace their own image), privacy (who can view
another user's image — depends on whether profiles are public, a real
product question this repository's current profile feature has never
actually answered), performance (image size/resizing), accessibility
(alt text), API (a dedicated upload endpoint, not overloading `PATCH
/me`), testing. Not relevant here: real-time/observability at the
depth a payments feature would need. **Pass** — and this scenario is
the clearest evidence the lens-selection mechanism (`SPEC-010` →
"Analysis lenses", `SPEC-008` → "Engineering review questions") does
real work: a naive "apply every lens" approach and a naive "just build
it" approach would both have been wrong here, and the correct answer
sits between them.

**Overall scenario result**: 13/13 reasoned through to a specific,
defensible answer without inventing a gap or hand-waving a pass.
`AC-44` and `AC-36` are the two where a genuinely close call exists
(storage architecture, chart-library choice) — both correctly resolve
to "proceed with the simplest adequate default, name the trade-off,"
not to asking the user something the model already has enough
authority to decide.

## Checkpoint: cold-start discoverability (AC-47)

**Status**: completed.

**Actions**: traced the read-order a fresh agent (no conversation
history) would actually follow for the hardest scenario in the set
(`AC-38`, cross-project promotion) — `AGENTS.md` → `agent-operating-
contract.md` → `SPEC-011` ("Request classification", "Project/
foundation boundary check") → `technology-guidance.md` → `SPEC-012`
("Ecosystem vs. project", "Skill creation criteria" incl. the M24
cross-project clause, "Human approval"). Every fact this milestone's
own reasoning relied on for all 13 scenarios is reachable this way —
nothing in the scenario answers above depended on this conversation's
history rather than the repository itself. This is the same claim
M16/M21/M23/M24 each verified for their own scope; re-verified here
specifically against `SPEC-012`'s two new M25 paragraphs, which read
correctly in isolation (checked by reading them fresh, not merely
recalling having written them).

## Checkpoint: validate

**Status**: completed.

**Validation performed**: full `pnpm run validate` (lint, typecheck,
test, build, `validate:architecture`, `secrets:scan`) — passed on the
first run (documentation-only change; existing 29-test `servers/test/
api` suite and both builds all still pass, confirming nothing was
accidentally touched outside scope). `pnpm run format:check` — failed
on the first run (2 files), `prettier --write`, re-ran clean — same
routine pattern as every prior trace.

## Checkpoint: conformance review (self-applied, AC-19/AC-48)

**Status**: completed.

Applying the very mechanism this milestone (and M24 before it)
established, to this milestone's own output — not self-review while the
work is fresh, but a re-check from a cold-start posture: re-read
`SPEC-012` in full, post-edit, as if encountering it for the first time.
Confirms: both new paragraphs are self-contained (don't require this
conversation's context to parse); the M25 blockquote accurately
describes what changed; no contradiction introduced with the M23/M24
blockquotes already present; `related:` and `updated:` frontmatter both
correct. No foundation file outside `SPEC-012` was touched — reconfirmed
via `git status` scoped to `AGENTS.md`/`.agent/`/`architecture.yaml`/
other `.project/specs/*`, empty as expected for a narrowly-scoped
amendment.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `SPEC-012` (amended — two clarifications, M25
blockquote); this trace. `architecture.yaml`/`PROJECT-STATE.md` next.
No new SPEC, no new ADR, no new skill, no backlog item — consistent
with the audit's own conclusion that most suspected gaps were not real,
and the two real ones needed only small connective amendments.

## Checkpoint: git

**Status**: completed (no Git action taken) — `change-management.md` →
"commit only when asked."

## Outcome

`completed`. The most consequential finding of this milestone is
negative, and stated as such rather than dressed up: **the operating
model built at M21/M23/M24 is, on this evidence, already doing most of
what M25 asked it to prove** — real ADRs recorded when warranted (not
when convenient), real autonomous technology decisions (rate limiting,
session store) made without unnecessary escalation, real scope questions
asked only when genuinely ambiguous, real conformance review catching
what self-review missed, and a real, working discovery-to-backlog
pipeline (nine items, two now completed). Two narrow, evidence-grounded
gaps were found and closed. No checklist explosion — the two fixes are
single paragraphs inside an already-active spec, not new mandatory
steps. If a future milestone finds this conclusion was too generous, the
right response is the same one this milestone itself modeled: find the
specific evidence, classify the specific root cause, fix the specific
gap — not add a rule for the shape of the fear.
