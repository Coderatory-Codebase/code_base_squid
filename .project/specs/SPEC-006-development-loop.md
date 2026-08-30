---
id: SPEC-006
type: spec
title: Development loop — required properties
status: active
created: 2026-08-30
related: [SPEC-004, SPEC-005, ADR-008]
---

# SPEC-006: Development Loop

Operational guidance: `.agent/instructions/development-loop.md`. This
spec is the durable "what must be true" statement; that file is how an
agent applies it.

## What must be true

- **The loop operates inside the M06 lifecycle, not beside or instead of
  it.** `OBSERVE → UNDERSTAND → HYPOTHESIZE → PLAN → CHANGE → VERIFY →
EVALUATE` is the reasoning model used during IMPLEMENT and the failure
  loop already named in `SPEC-004`; it is not a second, competing
  lifecycle.
- **Observation precedes conclusion.** Evidence (source, tests, config,
  output, project artifacts) is inspected before a change is made, not
  after.
- **Fact, assumption, hypothesis, and decision are distinguishable** in
  an agent's reasoning for any non-trivial change, without requiring a
  dedicated artifact for that distinction.
- **A hypothesis, once stated, is checked against an explicit
  expectation** — proportional to the problem; trivial mechanical changes
  don't require the formality.
- **Verification is evidence, and is distinguished from repository
  validation.** Focused verification (does this solve the actual
  problem) happens before or alongside repository validation (does the
  change preserve repository quality, via the existing
  `validate-repository` skill) — repository validation is never treated
  as the only form of verification.
- **A failure produces diagnosis, not repetition.** Changing something
  again after a failed verification requires an updated hypothesis based
  on the failure's evidence — not an unexamined retry.
- **Stopping is evidence-based, not a fixed retry count.** Iteration
  continues only while it produces new evidence; genuine stop conditions
  (contradictory requirements, missing information, scope boundary,
  inaccessible infrastructure, no new evidence from further attempts) are
  surfaced rather than pushed through.
- **Uncertainty that materially affects the implementation is surfaced,
  not silently resolved by assumption.** Low-risk uncertainty may be
  resolved with a bounded, statable assumption.
- **Debugging, feature implementation, and refactoring are specializations
  of one loop**, not separate frameworks — each keeps its own
  workflow-level identity (`../../.agent/workflows/`) while sharing this
  reasoning model for the IMPLEMENT-level iteration inside it.
- **The loop is documentation/protocol only.** No loop engine, retry
  system, state-machine implementation, or telemetry is introduced to
  support it.
- **Most loop iterations produce no artifact.** Only information with
  durable value beyond the current session is promoted to `.project/`;
  `.project/` does not become an iteration log.

## Relationship to earlier decisions

Nests inside `SPEC-004`'s lifecycle (specifically its IMPLEMENT stage and
failure-handling loop). Does not change `ADR-001`–`ADR-008`,
`SPEC-001`/`SPEC-003`/`SPEC-005`, or the packages/contract/skill models
they establish — CHANGE explicitly defers to `ADR-008`/`SPEC-003` for
when something is extracted to `packages/`, and VERIFY explicitly reuses
the existing `validate-repository` skill rather than introducing another
validation mechanism.

## Status

`active` — governs how an agent reasons and iterates during
implementation and debugging from M08 onward.
