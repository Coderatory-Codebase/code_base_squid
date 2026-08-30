---
name: refactor
type: workflow
version: 2
when_to_use: >
  Restructuring existing code/config without changing observable behavior
  (renaming, extracting, reorganizing, simplifying). Not for adding
  capability (feature) or fixing a defect (bugfix) — a change that does
  either of those is not "just" a refactor.
---

# Refactor Workflow

Follows the common stages in
[`development-lifecycle.md`](../instructions/development-lifecycle.md)
unchanged. This file covers only what's specific to a refactor.

## What's different

- **UNDERSTAND** means identifying what's structurally wrong or unclear
  right now, and why it's worth fixing — not refactoring for its own
  sake.
- **PLAN** defines the target shape and confirms observable behavior is
  unchanged; check the refactor doesn't cross a boundary it shouldn't
  (`boundaries.md`).
- **IMPLEMENT** changes structure only. If a genuine behavior change
  becomes necessary mid-refactor, stop — re-classify the remaining work
  as feature/bugfix rather than smuggling it into "refactor."
- **A refactor that changes architecture** (not just structure within an
  existing boundary) needs an ADR, same as any architectural decision
  (`change-management.md`) — most refactors don't rise to this.

## Exit criteria

Work-complete as defined in `development-lifecycle.md`, with an
unchanged-behavior constraint specific to refactors: quality-gate results
match pre-refactor state, and scope matches what UNDERSTAND identified —
nothing outside it moved, no new abstraction introduced beyond what the
identified problem needed.
