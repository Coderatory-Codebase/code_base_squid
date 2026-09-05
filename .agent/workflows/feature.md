---
name: feature
type: workflow
version: 2
when_to_use: >
  Adding new, previously-nonexistent capability (a product feature, a new
  API endpoint, a new app route, a new package export, a new deployable,
  or a foundation capability). Not for fixing broken behavior (bugfix) or
  restructuring existing behavior (refactor).
---

# Feature Workflow

Follows the common stages in
[`development-lifecycle.md`](../instructions/development-lifecycle.md)
unchanged. This file covers only what's specific to a feature.

## What's different

- **Route first**: classify the feature as `FOUNDATION`, `SEED_APP`, or
  `CROSS_CUTTING` before reading implementation files deeply.
- **UNDERSTAND** additionally means confirming which boundary owns the
  new capability (`boundaries.md`) and that it is in scope for the
  current active work.
- **Project/product brain**: for `SEED_APP` or project work, load
  `.project/projects/<project>/PROJECT.md` before planning source
  changes.
- **Analyze before selecting tasks**: if the feature is not already
  clearly selected and scoped, run `app-analysis.md` first and update the
  backlog/spec/ADR/plan as needed before implementation.
- **Seed-app vertical slices**: for MERN/Next.js seed-app features, load
  `../skills/mern-nextjs-vertical-slice/SKILL.md` and plan the feature
  across UI, API, domain, data, validation, tests, and manual UI
  verification where relevant.
- **Artifacts scale with size**: a small feature needs no dedicated
  artifact beyond the change itself; a significant one typically follows
  `SPEC → PLAN → TASK → implementation → validation → REVIEW` (see
  `development-lifecycle.md` → "Proportionality"). Don't create a SPEC or
  PLAN for a feature small enough that the change is self-explanatory,
  but do create them before implementation when the feature spans
  multiple boundaries or changes durable behavior.
- **No speculative extension points** for capabilities not yet requested
  — build what was asked for (`implementation.md`).

## Exit criteria

Work-complete as defined in `development-lifecycle.md` — not merely
"code compiles." A feature specifically also requires: no boundary
violations, and any architectural decision made along the way recorded
(`change-management.md`).
