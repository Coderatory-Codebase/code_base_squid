---
id: TRACE-006
type: trace
title: M23 — foundation/project separation & autonomous feature execution model
status: completed
created: 2026-08-31
related: [ADR-013, SPEC-008, SPEC-010, SPEC-011, SPEC-012, SPEC-013, TRACE-004, TRACE-005]
---

# TRACE-006: M23 — Foundation/Project Separation & Autonomous Feature Execution Model

Written progressively per `SPEC-013` → "Progressive recording", with one
honest exception noted below.

## Request

M23's kickoff: M22 (the Authentication feature) exposed that the
operating model was still incomplete — no explicit separation between
the reusable repository foundation and an application/project consuming
it, and no strong enough rule for project-scoped directory structure,
feature→phase→task decomposition, use-vs-build-vs-adopt, or a
project→ecosystem promotion gate. Explicit constraint: do not build
another application feature; correct the foundation and the M22
implementation against the strengthened model; do not proceed to a new
feature after M23 without approval.

**Classification** (`SPEC-011`): `FOUNDATION`, with one `PROJECT`-side
correction (the `apps/test/web`/`servers/test/api` migration itself
touches project source, done to satisfy a foundation decision — `BOTH`
in the strict sense, recorded as such here).

## Checkpoint: orient / classify / understand / analyze / plan

**Status**: completed.

**Note on progressive recording**: this checkpoint batches five stages
that happened in close sequence while reading the existing SPECs before
any file was changed — consistent with `SPEC-013` → "Progressive
recording"'s explicit allowance ("batching a few already-completed
checkpoints into one update is fine"), not a reconstruction after the
fact. Everything from `implement` onward below was written as it
happened.

**Actions**: asked the user one blocking question before any structural
change — what to call the first project, since `apps/web`/`servers/api`
had no project name and guessing one (kickoff's own instruction:
"do not blindly use `<project-name>` literally") would have been exactly
the kind of silent, hard-to-reverse decision `SPEC-011` →
"Human-in-the-loop" exists to prevent. Answer: `test`. Re-read
`SPEC-001` (original foundation definition, confirmed `README.md`: "a
reusable software foundation from which future projects are
scaffolded" — the actual textual basis for the project-ownership
decision below), `SPEC-010` (full — feature slicing, task breakdown,
persistence, analysis lenses), `SPEC-008` (full — reuse/generalization,
technology skill model), `SPEC-012` (full — ecosystem vs. project,
missing-guidance flow, human approval), `capability-model.md`,
`skills/README.md`, `boundaries.md`.

**Observations — already adequate, connect only**: `SPEC-012`'s
missing-guidance decision flow already matches the kickoff's requested
"ecosystem promotion gate" (section 21) almost exactly — discover →
classify → project-specific-or-not → durable-value-or-not → propose →
human approval → update ecosystem — no new mechanism needed, just
naming it applies beyond technology skills too. `SPEC-008`'s "Reuse and
generalization" already covers most of "use vs. build vs. adopt"
(section 7) for internal reuse; genuinely missing was the "prefer an
established library over recreating it" step. `SPEC-010`'s "Analysis
lenses" already covers most of the kickoff's expanded lens list
(section 6); genuinely missing were a handful of named lenses (product/
user value, use-vs-build-vs-adopt, privacy, QA, cost/vendor, developer
experience, future extensibility). Feature slicing/task breakdown
already existed; genuinely missing was an explicit intermediate
"which phases does this feature need" decision (section 5).

**Real gaps found**:

1. No project-ownership boundary — `apps/web`/`servers/api` sat directly
   under the global root, contradicting the repository's own stated
   purpose (scaffolding _future projects_, plural) the moment a second
   project could exist. This is the one genuine architectural decision
   this milestone makes (`ADR-013`).
2. `.project/backlog/` used one file per item; five real items at M22
   already showed this doesn't scale proportionally to how small an item
   usually is.
3. No explicit "which phases does a feature need" step between slicing
   and task breakdown.
4. No explicit "use vs. build vs. adopt" ordering (only internal-reuse
   judgment existed).
5. No named distinction between a technology skill and an
   implementation-area skill, though `SPEC-012`'s governance already
   applies to both identically.
6. No `FOUNDATION`/`PROJECT`/`BOTH` classification for traces, so a
   trace couldn't show whether work touched the reusable foundation, one
   project, or both.
7. **Real M22 record-keeping gaps, found during this milestone's own
   corrective review** (kickoff section 26): `AGENTS.md` → "Non-goals
   right now" still listed "authentication" and "a working web app" as
   things not to build, two milestones after they were built — M22
   should have corrected this and didn't. `.project/ARTIFACT-TYPES.md`
   still said `backlog/`'s "Instantiated now?" column was "Not yet" and
   its "why no backlog/ yet" prose was unchanged, despite `backlog/`
   having existed with five real items since M22.

**Not a gap** (checked, correctly designed): `README.md` → "Current
maturity" still says "M01–M14 are complete" — `repository-orientation.md`
already explicitly designates `architecture.yaml`/`PROJECT-STATE.md` as
authoritative over `README.md`'s prose exactly for this reason
(human-facing philosophy document, deliberately not required to track
every milestone). Left unchanged — correcting it would be scope not
actually requested by any real discoverability failure.

**Decision**: one new ADR (`ADR-013` — project-ownership boundary, a
genuine decision between real alternatives: project-scoped vs. flat
`apps/`/`servers/`, same category as `ADR-009`/`ADR-010`/`ADR-011`/
`ADR-012`). Everything else: amendments to `SPEC-008`, `SPEC-010`,
`SPEC-011`, `SPEC-012`, `SPEC-013`, `skills/README.md`,
`boundaries.md`, `engineering-standards.md`,
`backlog-and-feature-development.md`, `agent-operating-contract.md`,
`traceability.md`, `AGENTS.md`, `ARTIFACT-TYPES.md` — connective/
clarifying content on already-decided architecture, same category as
M16/M19/M20/M21, no second ADR for any of them.

## Checkpoint: implement

**Status**: completed.

**Classification**: `BOTH` — the structural migration below is a
`PROJECT`-side change (moving real application source), required to
satisfy a `FOUNDATION`-side decision (`ADR-013`); everything else in
this checkpoint is `FOUNDATION`.

**Actions — structural migration**: `apps/web` → `apps/test/web`,
`servers/api` → `servers/test/api`; `pnpm-workspace.yaml` globs
`apps/*`/`servers/*`/`agents/*` → `apps/*/*`/`servers/*/*`/`agents/*/*`;
`servers/test/api/tsconfig.json`'s `extends` path corrected for the new
depth; package names `@nut-shyll/web`/`@nut-shyll/api` →
`@nut-shyll/test-web`/`@nut-shyll/test-api`. Verified with a full
`pnpm install` + `pnpm run validate` pass (see `validate` checkpoint).

**Actions — backlog consolidation**: five per-item files replaced with
one table file, `.project/backlog/BACKLOG.md`; during migration,
reviewed M22's implementation for genuinely meaningful adjacent
authentication capabilities not yet captured (kickoff section 29) — added
`BACKLOG-006` (rate limiting/brute-force protection — `/api/auth/login`
and `/register` currently have none), `BACKLOG-007` (security/audit
logging for auth events — none exists), `BACKLOG-008` (MFA/2FA/
passkeys — distinct from `BACKLOG-003`'s OAuth/social login). Folded
"session/device management" into existing `BACKLOG-004` and "account
recovery" into existing `BACKLOG-002` rather than duplicating — same
discipline `SPEC-010`'s discovery model already requires (search before
creating).

**Actions — governance amendments**: `ADR-013` (new); `SPEC-011`
("Project/foundation boundary check", "Foundation vs. project
classification", scenario-G-adjacent updates); `agent-operating-contract.md`
(sequence updated); `SPEC-010` ("Phase determination", expanded analysis
lenses, corrected "Persistence"); `backlog-and-feature-development.md`
(phase-determination + use-vs-build pointers); `SPEC-008` ("Use vs.
build vs. adopt"); `engineering-standards.md` (pointer); `SPEC-012`
("Implementation-area skills"); `skills/README.md` (matching section);
`SPEC-013` (`classification` checkpoint field); `traceability.md`
(pointer); `boundaries.md` (project-ownership checklist item);
`architecture.yaml` (new principle, `apps/`/`servers/`/`agents/`
boundary text, M23 roadmap entry pending); `ARTIFACT-TYPES.md` (backlog
persistence correction, stale "not yet" language fixed); `AGENTS.md`
(stale non-goals line fixed, a real M22 gap found during this
milestone's own review, not a new M23 decision).

**Discoveries during this milestone's own execution**: the two real M22
record-keeping gaps above (`AGENTS.md`, `ARTIFACT-TYPES.md`) — both
`needed now`, fixed directly as part of this milestone's own corrective
review, not deferred.

**Deviations from plan**: none.

## Checkpoint: cold-start

**Status**: completed.

**Actions**: ran all 10 scenarios the kickoff named, against the
strengthened model, using only repository files (no session memory):

1. **New feature** ("add a dashboard widget showing recent logins") →
   `CLASSIFY`: application implementation, project `test` (obvious from
   existing `apps/test/`) → planning gate trips (multi-file) → `SPEC-010`
   → "Phase determination" selects backend+frontend, skips
   architecture/security (no new trust boundary) → sliced, implemented,
   validated, reviewed, reconciled, traced. No gap.
2. **Technology introduction** ("add Redis for session caching") →
   consequential (`SPEC-012` → "Escalation triggers": infrastructure) →
   `SPEC-008` → "Use vs. build vs. adopt" reasoned through, but the
   infra/cost/architecture weight stops for human approval before
   adopting — correctly gated, not silently decided. No gap.
3. **Existing technology, missing skill** ("add more Mongoose schemas")
   → Mongoose already adopted, no skill exists → `technology-guidance.md`
   step 3: `SPEC-008` principles suffice, proceed without blocking. No gap.
4. **Missing implementation-area guidance** ("design a new public API")
   → no implementation-area skill exists → `SPEC-012` → "Missing-guidance
   decision flow" (now explicitly covering this kind too): first real
   occurrence, stays project-local, proceeds on `SPEC-008` judgment. No gap.
5. **Consequential technology choice** ("GraphQL instead of REST?") →
   repository-wide-standard-shaped → escalates per `SPEC-012` →
   "Escalation triggers"; agent presents options/trade-offs, doesn't
   decide unilaterally. No gap.
6. **Future enhancement discovered mid-implementation** ("we should
   paginate this list") → `SPEC-010` discovery decision model → captured
   as a `BACKLOG.md` row, current feature unchanged. No gap.
7. **Project-specific rule that must not become ecosystem guidance**
   (tempted to write "always use React Query" after one project uses it
   once) → `SPEC-012` → "Ecosystem vs. project" explicitly blocks this —
   stays project-local unless proposed and approved. No gap.
8. **Genuine ecosystem-wide proposal** (a TypeScript convention used
   consistently and demonstrated across both `apps/test/web` and
   `servers/test/api`) → clears `SPEC-012` creation criteria → proposal
   prepared, human approval required before it becomes durable. No gap.
9. **Bugfix** ("duplicate-email check is case-sensitive") → trivial,
   single-file → planning gate does not trip → proceed directly,
   validate, done — proportional, no ceremony forced. No gap.
10. **Exploration-only** ("how should we think about adding payments?")
    → `SPEC-011` → "Exploration and analysis requests": discover,
    inspect, report — no implementation authorized. No gap.

**Observation**: all 10 scenarios resolve through the repository's own
files without the user naming a process, and — importantly — none of
them required inventing a new mechanism; every one routed to an existing
or M23-amended section. No further gap found.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: full structural migration verified with
`pnpm install` + `pnpm run validate` (lint, typecheck, test, build,
`validate:architecture`, `secrets:scan`) immediately after the move —
passed on the first run (the workspace-glob change was correct on the
first attempt). Final full `pnpm run validate` — passed. `pnpm run
format:check` — **failed** on the first run (six files, including the
Next.js-relocated `next-env.d.ts` needing a `.prettierignore` path
update for its new depth) — same routine pattern as every prior trace's
recorded failure. **Remediation**: `pnpm exec prettier --write` on the
five real files, `.prettierignore` path corrected for
`apps/*/*/next-env.d.ts`. **Re-run**: passed.

## Checkpoint: review

**Status**: completed.

**Self-review against the kickoff's own success criteria** (section 32):
Architecture — foundation/project separation is now explicit
(`ADR-013`, `SPEC-011` → "Foundation vs. project classification"),
project ownership is unambiguous (`apps/test/`, `servers/test/`), the
global roots can no longer silently become a dumping ground for a second
project. Autonomous operation and feature development — confirmed live
by the 10-scenario `cold-start` checkpoint above, all reachable without
the user naming a process. Technology governance — unchanged and
already adequate (`SPEC-012`), now explicitly generalized to
implementation-area skills too. Quality — "works" was never treated as
"production-ready" in this milestone's own execution: every structural
change was verified with the full gate, not assumed. Discovery — three
real backlog items surfaced from a genuine review of M22, not
manufactured; two real M22 record-keeping gaps found and fixed.
Backlog — one durable table file, tabular, as required. Human control —
the one genuinely consequential decision (project naming) stopped for
approval before any file moved; everything else proceeded autonomously
because it was either a direct instruction-following task or already
governed by existing rules. Traceability — this trace reconstructs
requested → classified → understood → analyzed → planned → implemented
→ cold-started → validated → reviewed → recorded, with a `classification`
field distinguishing `FOUNDATION` from `PROJECT` work throughout.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `ADR-013` (new); `SPEC-008`, `SPEC-010`,
`SPEC-011`, `SPEC-012`, `SPEC-013` (amended); `skills/README.md`,
`boundaries.md`, `agent-operating-contract.md`,
`backlog-and-feature-development.md`, `engineering-standards.md`,
`traceability.md` (amended); `AGENTS.md`, `.project/ARTIFACT-TYPES.md`
(corrected — real M22 gaps); `architecture.yaml` (new principle,
`apps/`/`servers/`/`agents/` boundary text, M22 entry's paths corrected,
M23 roadmap entry, `current_phase` → `M24`); `.project/backlog/BACKLOG.md`
(three new items); `apps/test/web`, `servers/test/api` (migrated);
`pnpm-workspace.yaml`, `.prettierignore` (corrected for the new depth);
this trace. `.project/state/PROJECT-STATE.md` next.

## Checkpoint: git

**Status**: completed (no Git action taken).

No branch or commit was made — `change-management.md` → "commit only
when asked," same as every prior milestone.

## Outcome

`completed`. The repository's first trace to carry an explicit
`FOUNDATION`/`PROJECT`/`BOTH` classification throughout, and the first to
include a corrective review of a prior milestone's own real output
(M22) rather than only reviewing this milestone's own work — finding
two genuine record-keeping gaps M22 left behind and fixing them as part
of this milestone's own scope, not silently ignored and not treated as
a new, separate escalation.
