---
name: feature
type: workflow
version: 2
when_to_use: >
  Adding new, previously-nonexistent capability (a new package export, a
  new endpoint, a new deployable). Not for fixing broken behavior
  (bugfix) or restructuring existing behavior (refactor).
---

# Feature Workflow

Follows the common stages in
[`development-lifecycle.md`](../instructions/development-lifecycle.md)
unchanged. This file covers only what's specific to a feature.

## What's different

- **UNDERSTAND** additionally means confirming which boundary owns the
  new capability (`boundaries.md`) and that it's in scope for the current
  milestone.
- **Artifacts scale with size**: a small feature needs no dedicated
  artifact beyond the change itself; a significant one typically follows
  `SPEC → PLAN → TASK → implementation → validation → REVIEW` (see
  `development-lifecycle.md` → "Proportionality"). Don't create a SPEC or
  PLAN for a feature small enough that the change is self-explanatory.
- **No speculative extension points** for capabilities not yet requested
  — build what was asked for (`implementation.md`).

## Exit criteria

Work-complete as defined in `development-lifecycle.md` — not merely
"code compiles." A feature specifically also requires: no boundary
violations, and any architectural decision made along the way recorded
(`change-management.md`).
