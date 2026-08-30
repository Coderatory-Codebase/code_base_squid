---
name: refactor
type: workflow
version: 1
when_to_use: >
  Restructuring existing code/config without changing observable behavior
  (renaming, extracting, reorganizing, simplifying). Not for adding
  capability (feature) or fixing a defect (bugfix) — a change that does
  either of those is not "just" a refactor.
---

# Refactor Workflow

A lifecycle specification, not an executable pipeline.

| Stage      | What it means for a refactor                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Understand | What's structurally wrong or unclear right now, and why it's worth fixing (not refactoring for its own sake).                                     |
| Plan       | Define the target shape and confirm observable behavior is unchanged. Check the refactor doesn't cross a boundary (`boundaries.md`) it shouldn't. |
| Implement  | Change structure only. If a genuine behavior change becomes necessary mid-refactor, stop and re-classify the work as feature/bugfix.              |
| Validate   | Run the quality gate (`validation.md`). Behavior must match pre-refactor state; a refactor that changes gate results has scope-crept.             |
| Review     | Confirm nothing outside the intended scope moved, and no new abstraction was introduced beyond what the identified problem needed.                |
| Record     | Record the "why" if the refactor reflects a boundary/architecture correction, not just tidying (`change-management.md`).                          |

Exit criteria: quality gate green with unchanged results, no behavior
change, scope matches what Understand identified.
