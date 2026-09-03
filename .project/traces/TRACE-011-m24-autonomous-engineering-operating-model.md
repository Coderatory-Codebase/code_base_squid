---
id: TRACE-011
type: trace
title: M24 — autonomous engineering operating model (system-level review)
status: completed
created: 2026-09-01
related:
  [SPEC-008, SPEC-010, SPEC-011, SPEC-012, SPEC-013, TRACE-006, TRACE-008, TRACE-009, TRACE-010]
---

# TRACE-011: M24 — Autonomous Engineering Operating Model

Written progressively per `SPEC-013` → "Progressive recording."

## Request

Inspect the entire operating model as a system (not file-by-file) using
M21–M23, the Authentication/Rate-Limiting/Profile work, and its audit as
evidence of actual behavior — not assuming correctness because
validation was green. Determine genuine gaps preventing an agent from
reliably going request → classification → guidance → plan → phases →
tasks → implementation → discovery/backlog → validation → review →
conformance review → record, autonomously where existing rules suffice,
escalating only where a decision is genuinely consequential. Explicit
constraints: no manufactured gaps, no new SPEC/ADR unless truly
warranted, no new skills unless justified, no application code, no
runtime/engine of any kind, no fake backlog items, no commit.

**Classification** (`SPEC-011`): `FOUNDATION` — this milestone
inspects and (where warranted) amends the operating model itself, not
project code.

## Checkpoint: orient

**Status**: completed.

**Actions**: confirmed working tree state (`TRACE-010`'s remediation
still uncommitted, as left). This trace created now, first.

## Checkpoint: understand the system / check existing coverage

**Status**: completed.

**Actions**: read the full operating model fresh, as a system rather
than file-by-file, using this session's own M21–M23 work plus
`TRACE-005`–`TRACE-010` as behavioral evidence, not just documentation:
`AGENTS.md`, `agent-operating-contract.md` + `SPEC-011` (bootstrap
sequence, request classification, foundation/project boundary check,
human-in-the-loop index), `development-lifecycle.md` + `SPEC-004`
(stages, proportionality, planning gate, review dimensions),
`development-loop.md` + `SPEC-006` (iteration model, verification,
evidence hierarchy), `backlog-and-feature-development.md` + `SPEC-010`
(feature slicing, phase determination, discovery model, persistence),
`engineering-standards.md` + `SPEC-008` (principles, use-vs-build-vs-
adopt, technology skill model, review questions), `technology-guidance.md`

- `SPEC-012` (skill governance, implementation-area skills, ecosystem-
  vs-project), `traceability.md` + `SPEC-013` (checkpoint structure,
  progressive recording, classification field), `git-governance.md` +
  `SPEC-009`, `boundaries.md`, `capability-model.md`, `skills/README.md`,
  `ARTIFACT-TYPES.md`, `architecture.yaml`, `PROJECT-STATE.md`,
  `.project/backlog/BACKLOG.md`, every `ADR-*`/`SPEC-*` currently active.

**Finding — the target flow the kickoff describes is already mapped,
almost line for line, onto existing sections**: request classification
(`SPEC-011`), project/foundation boundary check (`SPEC-011`/`ADR-013`),
guidance precedence (`SPEC-008`), technology/skill resolution
(`SPEC-012`), use-vs-build-vs-adopt (`SPEC-008`, M23), engineering
lenses (`SPEC-010` "Analysis lenses", `SPEC-008` "Engineering review
questions"), feature slicing/phase determination/task breakdown
(`SPEC-010`), dependency handling (`SPEC-010`), human-in-the-loop
(`SPEC-011` consolidated table), planning gate (`development-
lifecycle.md`, M21), continuous discovery/backlog reconciliation
(`SPEC-010`, M20/M23), validation (`validation.md`), Git governance
(`SPEC-009`), traceability (`SPEC-013`). This is strong evidence against
manufacturing a parallel structure — the system mostly already exists
and, per the evidence below, mostly already works.

**Evidence the system actually works**: `TRACE-007` correctly refused to
silently pick a backlog item and asked; `TRACE-008` correctly escalated
the one genuinely ambiguous scope question (what "profile" means) and
proceeded autonomously on everything else; `TRACE-010` resolved every
audit finding via already-existing rules with zero escalation needed,
including one case where the _correct_ answer was to decline a
proposed fix (the form-component extraction) rather than mechanically
applying it. This is the system behaving as designed, repeatedly, not
by luck.

**Evidence of genuine gaps** (see "analyze" below): `TRACE-009` itself
is the strongest evidence — it caught four real issues (missing
`runValidators`, duplicated error handling, inconsistent rate-limit
coverage, a missing `aria-live` region) that `pnpm run validate` could
not and did not catch, and that `TRACE-008`'s own REVIEW checkpoint
did not catch either. `TRACE-009` was itself an ad-hoc invention — a
kind of checkpoint the operating model doesn't currently name — which
is exactly the sign of a real, demonstrated gap rather than an
invented one.

## Checkpoint: analyze — genuine gaps

**Status**: completed.

Four real, evidence-grounded gaps found — deliberately not padded to
look thorough; several plausible-sounding items from the kickoff's own
audit checklist resolved to "already covered, connect only" and are
recorded as such, not silently dropped:

**G1 — No named "conformance review" concept.** `development-
lifecycle.md`'s REVIEW stage checks a change against its own stated
intent (self-review). `TRACE-009` did something categorically
different: it re-inspected a _prior, already-completed and validated_
unit of work from a cold-start posture, verifying the trace's own
claims against the actual files rather than trusting the narrative —
and found real defects self-review had missed. Nothing in `SPEC-013`
or `development-lifecycle.md` currently distinguishes "the agent
recorded a process" from "the agent's record is independently
verified" as two different things. This is exactly what the kickoff
asks for and exactly what real evidence (not hypothesis) shows is
missing.

**G2 — Security and accessibility are not named REVIEW dimensions.**
`development-lifecycle.md` → "Review dimensions" lists Correctness,
Architecture, Scope, Quality, Regression, Maintainability, Documentation
— no Security, no Accessibility, despite both being core `SPEC-008`
principles. This plausibly contributed to the `runValidators`/
rate-limit-consistency/`aria-live` gaps surviving ordinary review
(`TRACE-008`) until an explicit audit occurred.

**G3 — The skill-creation "repeated use" criterion doesn't state the
cross-project bar explicitly.** `SPEC-012` → "Skill creation criteria"
says a technology "will likely see repeated use, not a one-off" — but
doesn't say repetition _within one project_ is necessary, not
sufficient. `TRACE-009`/`TRACE-010` had to independently derive "these
patterns are real and repeated, but only within one project, so no
skill is warranted yet" — a real ambiguity resolved by judgment that a
future agent might resolve differently without this being explicit.

**G4 — Foundation-change authorization is demonstrated by precedent,
not stated as a rule.** Every foundation change in this session (M12–
M24) was made only because the human explicitly commissioned that exact
milestone — confirmed clean every time via `git status` scoped to
foundation paths before project work. `SPEC-011` → "Foundation vs.
project classification" (M23) defines the three-way split but doesn't
say _what authorizes_ a `FOUNDATION`/`BOTH` change in the first place.
Consistent, correct behavior across 6+ milestones is strong evidence
this rule is real — it has just never been written down.

**Explicitly not a gap** (checked, not manufactured): technology/skill
scenario handling (existing skill / no skill / new tech / library /
conflicting/outdated guidance / project-practice-must-not-become-policy)
— all already correctly specified in `SPEC-012`, demonstrated correctly
in practice (no skill created across 3 real features despite repeated
technology use). Discovery capture — worked correctly every time
demonstrated (`BACKLOG-006`–`009`, the "rejected" avatar/bio outcome).
Feature/phase/task derivation — `SPEC-010`'s M23 "Phase determination"
already makes this explicit and it was used correctly in `TRACE-008`/
`010`. Human-in-the-loop escalation — worked correctly every time
demonstrated, no missed escalation found. Git/change-management — no
gap found, nothing in this session's evidence suggests otherwise.

**No new SPEC, no new ADR**: all four gaps are connective/clarifying
amendments to already-active SPECs (`SPEC-013`, `development-
lifecycle.md`/`SPEC-004`, `SPEC-012`, `SPEC-011`) — same category as
M16/M19/M20/M21/M23. None is a decision between real alternatives; no
new skill is justified (re-confirms `TRACE-009`/`010`'s conclusion — G3
makes the _reasoning_ explicit, it doesn't change the _conclusion_
about this project's own technologies). No foundation-owned change was
made without this being an explicitly commissioned milestone (this one).

## Checkpoint: plan

**Status**: completed.

**Plan**: amend, not replace — `development-lifecycle.md` (Security/
Accessibility review dimensions + "Conformance review" pointer),
`SPEC-013` (full "Conformance review" section + checkpoint-field
context) + `traceability.md` (pointer), `SPEC-012` (cross-project
clarification) + header blockquote, `SPEC-011` (foundation-change-
authorization subsection) + header blockquote. No new SPEC, no new ADR,
no new skill, no application code, no new artifact type. After
amendments: run the full validation gate (docs-only, but the gate still
applies), perform the 20-scenario cold-start verification, update
`architecture.yaml`/`PROJECT-STATE.md`, record.

## Checkpoint: implement

**Status**: completed — see the four amendments above (`development-
lifecycle.md`, `SPEC-013`+`traceability.md`, `SPEC-012`, `SPEC-011`),
each applied directly as planned. No deviation.

**Discoveries during this milestone's own execution**: none beyond the
four gaps already identified during analysis — this checkpoint applied
the plan, it didn't surface new findings.

## Checkpoint: cold-start verification (20 scenarios)

**Status**: completed.

Walked each scenario the kickoff named against the amended model, from
`AGENTS.md` alone, without implementing application code. "Reaches"
means: resolves to an existing/amended section without inventing a
mechanism.

1. **New application feature** ("add X to the `test` app") → classify
   `PROJECT`, planning gate likely trips → phase determination →
   feature slicing → implement → validate → review (incl. Security/
   Accessibility, M24) → discovery reconciliation → trace. Reaches.
2. **Bug fix** → classify `PROJECT`/bugfix → planning gate: usually
   doesn't trip (single-approach, no open question) → `development-
loop.md`'s debugging specialization (REPRODUCE→OBSERVE→ISOLATE→...)
   → fix → validate → review. Reaches.
3. **Refactor** → `development-loop.md` → "Refactoring"
   (OBSERVE→BASELINE→SMALL CHANGE→VERIFY NO REGRESSION); re-classify if
   behavior actually changes. Reaches.
4. **Exploration-only request** → `SPEC-011` → "Exploration and
   analysis requests": discover/inspect/report, no implementation
   authorized. Reaches.
5. **New technology introduction** → `SPEC-012` escalation trigger
   (technology adoption) → `SPEC-008` → "Use vs. build vs. adopt" →
   consequential → human approval before adopting. Reaches.
6. **Library/package adoption** → `SPEC-012` → "Scope of technology"
   explicitly includes libraries → same missing-guidance flow as any
   technology; routine (non-architectural) adoption stays autonomous,
   consequential adoption escalates. Reaches.
7. **Missing technology skill** → `technology-guidance.md` step 3:
   `SPEC-008` principles apply, proceed without blocking; skill
   creation assessed separately, not a blocker. Reaches.
8. **Missing implementation-area skill** → `SPEC-012` → "Implementation-
   area skills" (M23): same missing-guidance flow, generalized. Reaches.
9. **Repeated implementation pattern that may justify durable
   guidance** → `SPEC-012` → "Skill creation criteria" **with the M24
   cross-project clarification**: repeated _within_ one project is not
   sufficient on its own; requires demonstrated/intended reuse across
   ≥2 independent projects. Correctly resolves to "stays project-local"
   for anything only this repository's one project has done so far —
   this is the scenario `TRACE-009`/`010` actually lived through.
   Reaches, and now explicit rather than re-derived.
10. **Consequential architecture decision** → `SPEC-011` →
    "Human-in-the-loop" table (architectural disagreement / genuine
    conflict rows) → human decision, options/trade-offs presented, not
    decided unilaterally. Reaches.
11. **Security-sensitive change** → planning gate trips
    (`development-lifecycle.md` names "security-sensitive behavior"
    explicitly) → `SPEC-008` → "Security principles" during design →
    **Security is now a named REVIEW dimension (M24)**, not only an
    implicit principle. Reaches, and the M24 gap this scenario would
    have exposed is now closed.
12. **Discovery during implementation** → `SPEC-010` → "Discovery
    decision model" (five outcomes), captured at the moment it
    surfaces, not saved for the end. Reaches.
13. **Future feature discovered during implementation** → same model →
    "future work" outcome → `.project/backlog/BACKLOG.md` row. Reaches.
14. **Project rule that must not become foundation policy** → `SPEC-012`
    → "Ecosystem vs. project" (generalized by `SPEC-011`'s foundation/
    project classification, M23) — an implementation choice never
    silently becomes durable guidance. Reaches.
15. **Genuine foundation improvement** → **`SPEC-011`'s new "What
    authorizes a FOUNDATION/BOTH change" (M24)**: surfaced as a
    discovery, escalated to the human for explicit commissioning — not
    fixed mid-feature. This is the scenario G4 exists for; previously
    reachable only by precedent, now by an explicit rule.
16. **Human decision required** → `SPEC-011` → "Human-in-the-loop"
    table, full trigger list; agent states decision/why/options/
    trade-offs/recommendation, waits — never manufactures approval.
    Reaches.
17. **Feature requiring multiple phases** → `SPEC-010` → "Phase
    determination" (M23): selects from the candidate-phase list based
    on risk/complexity/boundaries/security/etc. — demonstrated for real
    in `TRACE-008` (architecture+backend+frontend+security+testing all
    genuinely applied). Reaches.
18. **Feature where some phases are unnecessary** → same section,
    explicit: "skipping a phase is a decision, not an oversight — state
    briefly why." Reaches.
19. **Existing backlog item selected for implementation** →
    `.project/backlog/BACKLOG.md` (single table) → `SPEC-010` →
    "Ownership": selection is a human/product decision unless
    delegated — demonstrated for real in `TRACE-007` (asked which item,
    didn't pick silently). Reaches.
20. **Request spanning multiple categories** → `SPEC-011` → "Request
    classification": identify every applicable category, apply the
    dominant one as primary, others as secondary constraints — matches
    this very milestone (`FOUNDATION` primary, evidence drawn from
    `PROJECT` work as secondary context). Reaches.

**Observation**: all 20 scenarios resolve without inventing a
mechanism. Three (9, 11, 15) specifically exercise the four gaps this
milestone closed — confirming the amendments target real, demonstrated
weak points rather than being speculative additions. No further gap
found.

## Checkpoint: validate

**Status**: completed.

**Validation performed**: `pnpm run validate` (lint, typecheck, test,
build, `validate:architecture`, `secrets:scan`) — passed on the first
run (docs-only change; no source touched). `pnpm run format:check` —
**failed** on the first run (this trace file itself, not yet
Prettier-formatted) — same routine pattern as every prior trace;
`prettier --write`, re-ran clean.

## Checkpoint: review

**Status**: completed.

**Self-review**: every amendment traces to a specific gap backed by
specific evidence (a `TRACE-*` reference), not a generic best-practice
addition. No new SPEC, no new ADR, no new skill, no application code,
no runtime/engine — confirmed against the kickoff's own constraints.
Foundation/project separation preserved throughout (this milestone is
`FOUNDATION`-classified and touches only `.agent/`/`.project/specs/`).

**Conformance check on this milestone's own claim** (using the M24
mechanism this milestone itself introduces, applied reflexively): does
the evidence actually support "four real gaps, nothing manufactured"?
Re-inspected `development-lifecycle.md`'s pre-amendment "Review
dimensions" list directly (confirmed no Security/Accessibility bullet
existed), `SPEC-012`'s pre-amendment "Skill creation criteria" directly
(confirmed no cross-project statement existed), and `SPEC-011`'s
pre-amendment "Foundation vs. project classification" directly
(confirmed no authorization subsection existed) — all three read
fresh, not assumed from memory, before editing. Claim holds.

## Checkpoint: record

**Status**: completed.

**Artifacts updated**: `.agent/instructions/development-lifecycle.md`,
`.project/specs/SPEC-013-agent-execution-traceability.md`,
`.agent/instructions/traceability.md`,
`.project/specs/SPEC-012-technology-ecosystem-and-guidance-governance.md`,
`.project/specs/SPEC-011-agent-repository-operating-contract.md`
(all amended); this trace. `architecture.yaml`/`PROJECT-STATE.md` next.
No new backlog item — no genuine, independent, out-of-scope discovery
occurred; this milestone's own findings were the deliverable, not a
byproduct of it.

## Checkpoint: git

**Status**: completed (no Git action taken) — `change-management.md` →
"commit only when asked."

## Outcome

`completed`. Confirms the operating model mostly already works as
designed (strong behavioral evidence from `TRACE-005`–`TRACE-010`);
closes four real, evidence-grounded gaps without manufacturing scope to
fill a milestone. No new SPEC, no new ADR, no new skill, no backlog
item, no application code — the smallest change that actually closes
what the evidence showed was missing.
