---
name: bugfix
type: workflow
version: 2
when_to_use: >
  Existing behavior is wrong relative to its own intent (a broken script,
  a contradicted document, a failing gate). Not for adding capability
  (feature) or changing structure without a behavior defect (refactor).
---

# Bugfix Workflow

Follows the common stages in
[`development-lifecycle.md`](../instructions/development-lifecycle.md)
unchanged. This file covers only what's specific to a bugfix.

## What's different

- **UNDERSTAND** means reproducing or otherwise confirming the defect and
  identifying its root cause, not just its symptom.
- **PLAN** identifies the smallest correct fix. A bugfix does not carry
  surrounding cleanup or refactor — that's a separate change if it
  matters (scope control in `development-lifecycle.md`).
- **Typical chain**: `request → implementation → tests → REVIEW` (see
  `development-lifecycle.md` → "Proportionality") — a SPEC/PLAN is rarely
  warranted for a bugfix unless it turns out to reveal an architectural
  problem, in which case stop and reassess rather than patch the symptom.
- **IMPLEMENT** applies the fix at the root cause; don't add defensive
  handling for scenarios that can't occur.

## Exit criteria

Work-complete as defined in `development-lifecycle.md`. A bugfix
specifically also requires: the defect no longer reproducible, and no
unrelated behavior changed.
