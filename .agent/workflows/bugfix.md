---
name: bugfix
type: workflow
version: 1
when_to_use: >
  Existing behavior is wrong relative to its own intent (a broken script,
  a contradicted document, a failing gate). Not for adding capability
  (feature) or changing structure without a behavior defect (refactor).
---

# Bugfix Workflow

A lifecycle specification, not an executable pipeline.

| Stage      | What it means for a bugfix                                                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Understand | Reproduce or otherwise confirm the defect. Identify root cause, not just the symptom.                                                                                                         |
| Plan       | Identify the smallest correct fix. A bugfix does not carry surrounding cleanup or refactor — file that separately if it matters.                                                              |
| Implement  | Apply the fix at the root cause. Don't add defensive handling for scenarios that can't occur.                                                                                                 |
| Validate   | Run the quality gate (`validation.md`). If the bug was reachable by an existing test, that test should now fail-then-pass; add a regression test when there's a real test suite to add it to. |
| Review     | Confirm the fix doesn't merely mask the symptom, and doesn't silently change unrelated behavior.                                                                                              |
| Record     | If the bug revealed a wrong architectural assumption (not just a coding error), record that as a decision (`change-management.md`).                                                           |

Exit criteria: defect no longer reproducible, quality gate green, no
unrelated behavior changed.
