---
id: development-loop
type: instruction
applies_to: reasoning-and-iterating-while-implementing-or-debugging
---

# Development Loop

The reasoning/iteration model used **inside** a stage of
[`development-lifecycle.md`](development-lifecycle.md) — mainly IMPLEMENT
and the VALIDATE failure loop. It does not replace that lifecycle; it
zooms into one part of it. Durable "must be true" version:
`.project/specs/SPEC-006-development-loop.md`.

## Relationship to the M06 lifecycle

```text
WORKFLOW LIFECYCLE (development-lifecycle.md)
  ├── UNDERSTAND
  ├── PLAN
  ├── IMPLEMENT
  │     └── DEVELOPMENT LOOP (this file)
  │           Observe → Understand → Hypothesize → Plan → Change → Verify → Evaluate
  ├── VALIDATE
  ├── REVIEW
  ├── RECORD
  └── COMPLETE
```

Two different levels, not two competing lifecycles: the lifecycle is the
progression of a whole piece of work (once per change); the loop is how
an agent iterates while doing the IMPLEMENT part of it, and it's what the
lifecycle's own "Failure handling"
(`IMPLEMENT → VALIDATE → FAIL → UNDERSTAND FAILURE → FIX → VALIDATE`)
expands into in full.

## The loop

```text
OBSERVE → UNDERSTAND → HYPOTHESIZE → PLAN → CHANGE → VERIFY → EVALUATE
                                                          │
                              ┌───────────────────────────┴──────────────┐
                              ▼                                          ▼
                        insufficient/failed                        sufficient
                              │                                          │
                              ▼                                          ▼
                          DIAGNOSE → (new) HYPOTHESIZE → CHANGE      REVIEW → RECORD
```

- **OBSERVE** — read the relevant source, structure, tests, config,
  output, or project artifacts before forming conclusions. Don't edit the
  first file that looks relevant without having looked at the evidence.
- **UNDERSTAND** — establish intended vs. current behavior, constraints,
  affected boundaries, dependencies, acceptance criteria. Distinguish
  **fact** (known from evidence), **assumption** (believed, unverified),
  **hypothesis** (an explanation being tested), and **decision** (the
  chosen direction) — informally, in reasoning; no artifact is required
  for making this distinction on a given task.
- **HYPOTHESIZE** — for anything non-mechanical (especially debugging),
  state: what was observed, what's believed to cause it, what's expected
  if that's changed, and how that will be checked. Skip this formality
  for trivial changes — it should be proportional to the problem, the
  same principle `development-lifecycle.md` applies to artifacts.
- **PLAN** — the smallest useful change: what changes, where, why, how
  it'll be verified, what stays untouched. Don't plan a theoretical
  redesign when a small local change solves the actual problem.
- **CHANGE** — make it. Smallest coherent diff; preserve existing
  behavior unless intentionally changing it; no speculative abstraction,
  no unrelated refactoring, no broad rewrite without evidence it's
  needed; reuse existing capability before creating new capability (see
  "Change and packages" below).
- **VERIFY** — evidence the change produced the expected result (see
  "Verification" below).
- **EVALUATE** — did the observed problem actually change, did the
  expected behavior occur, did verification test the relevant thing, did
  anything unexpected happen, is the hypothesis supported. Outcome is
  SUCCESS (continue to REVIEW/RECORD in the lifecycle), PARTIAL (update
  understanding, iterate), FAILURE (diagnose, don't just retry), or
  UNKNOWN (gather more evidence before doing anything else).

## Change and packages

This loop's CHANGE step follows the M05 model unchanged:

```text
need local capability                                  → keep local
need reusable capability with demonstrated reuse         → consider packages/
```

Don't extract something because it "might be useful later" — `ADR-008`/
`SPEC-003` already settled this; the loop doesn't reopen it.

## Verification

Distinguish:

- **Focused verification** — did this change solve the immediate
  problem? The smallest check that meaningfully proves it: one test, a
  manual check, a single command's output.
- **Repository validation** — did the change preserve repository
  quality? The [`validate-repository`](../skills/validate-repository/SKILL.md)
  skill (`pnpm run validate` + `format:check`).

Run focused verification first; run repository validation before calling
the lifecycle's VALIDATE stage satisfied. `pnpm run validate` is not the
only form of verification — it's the repository-wide one, run in addition
to, not instead of, checking the actual problem was solved.

## Failure → diagnosis, not random patching

```text
VERIFY → FAIL → DIAGNOSE → UPDATE HYPOTHESIS → PLAN → CHANGE → VERIFY
```

A failed hypothesis is useful evidence, not a setback to route around.
Avoid `change → fail → change → fail → change → fail` with no diagnosis
between attempts. Instead: inspect the evidence the failure produced,
determine _why_ verification failed, update the hypothesis, then make one
intentional next change. This is the same rule
`development-lifecycle.md` states at the lifecycle level
("don't ignore/suppress/weaken a gate, don't patch a symptom repeatedly
— reassess"); this section is that rule's mechanics.

## Stop conditions

Stop (successfully) when: expected behavior is verified, relevant
validation passes, remaining uncertainty is acceptable for the change's
actual risk, scope is satisfied, no unresolved blocker remains.

Stop and ask before continuing when: requirements are contradictory,
required information is unavailable, a destructive action needs approval,
architecture has genuinely conflicting constraints, repeated iterations
aren't producing new evidence (see below), the change would exceed
authorized scope (`development-lifecycle.md` → "Scope control"), or
required external infrastructure is inaccessible.

**No arbitrary retry count.** The stopping rule is evidence-based, not
numeric: if an iteration isn't producing new evidence, stop changing
things and reassess — the objective is converging toward verified
correctness, not retrying until something happens to go green.

## Evidence hierarchy

Prefer, in this order: observed behavior → tests → tool output → source
inspection → documented project decisions (ADR/SPEC) → reasonable
inference → assumption. Know which level a given belief sits at; don't
treat an assumption as if it were observed behavior.

## Uncertainty

It's acceptable to say "unknown," "uncertain," "insufficient evidence," or
"needs clarification" — don't fill a gap with an unstated assumption.

- **Materially affects the implementation** → stop, surface the
  uncertainty, gather evidence or ask.
- **Low-risk** → make a bounded assumption, record it if it has durable
  value (see "What becomes durable" below), and continue.

## Debugging (a specialization, not a separate framework)

```text
REPRODUCE → OBSERVE → ISOLATE → HYPOTHESIZE → CHANGE → VERIFY → REGRESSION CHECK
```

Same loop, with REPRODUCE first (confirm the defect concretely) and a
REGRESSION CHECK at the end (did fixing this break anything else) —
matches `../workflows/bugfix.md`'s UNDERSTAND step, expanded.

## Feature work

```text
UNDERSTAND REQUIREMENT → IDENTIFY EXISTING CAPABILITIES → PLAN SMALLEST CHANGE
  → IMPLEMENT → FOCUSED VERIFY → BROADER VALIDATE → REVIEW
```

This is the loop applied inside `../workflows/feature.md`'s IMPLEMENT
step — it does not replace that workflow or introduce a second one.

## Refactoring

```text
OBSERVE CURRENT BEHAVIOR → ESTABLISH SAFETY BASELINE → SMALL CHANGE
  → VERIFY NO BEHAVIOR REGRESSION → REPEAT
```

If a "small change" turns out to alter behavior, that's no longer a
refactor — re-classify per `../workflows/refactor.md`.

## Relationship to skills

The loop may invoke a skill (VERIFY's repository validation uses
`validate-repository`), but the loop's own stages are not skills.
`observe-skill`, `hypothesis-skill`, `iteration-skill` are not created —
these are reasoning stages, not reusable invokable capabilities
(`capability-model.md`).

## What becomes durable

The loop itself produces no artifact by default — most iterations record
nothing. Promote to `.project/` only when something has lasting value,
independent of how many loop iterations it took to find it:

```text
working reasoning
  ├── temporary (a debugging hypothesis, a rejected approach) → stays ephemeral
  └── durable (changes a durable understanding of the architecture,
      a plan, a bounded work item, a review outcome)          → SPEC/ADR/PLAN/TASK/REVIEW
```

`.project/` is durable project memory, not an iteration log — see
`ARTIFACT-TYPES.md` → "Durable vs. ephemeral memory."
