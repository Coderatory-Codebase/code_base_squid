---
name: feature
type: workflow
version: 1
when_to_use: >
  Adding new, previously-nonexistent capability (a new package export, a
  new endpoint, a new deployable). Not for fixing broken behavior
  (bugfix) or restructuring existing behavior (refactor).
---

# Feature Workflow

A lifecycle specification, not an executable pipeline. It defines expected
stages and their exit criteria; an agent (or human) works through them
directly.

| Stage      | What it means for a feature                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Understand | What capability is being added, and why. Which boundary owns it (`boundaries.md`). Confirm it's in scope for the current milestone.                |
| Plan       | Where the new code/config lives, what it depends on (respecting `dependency_direction`), what interface it exposes. State the plan before writing. |
| Implement  | Build the minimum that satisfies the plan. No speculative extension points for capabilities not yet requested (`implementation.md`).               |
| Validate   | Run the quality gate (`validation.md`). New capability should ship with tests once there's real code to test.                                      |
| Review     | Re-check the change against `architecture.yaml` boundaries and against this workflow's own Plan stage — did the implementation drift from it?      |
| Record     | Note any architectural decision made along the way (`change-management.md`). Update milestone/roadmap state if this feature completes one.         |

Exit criteria: quality gate green, no boundary violations, no undocumented
architectural decisions.
