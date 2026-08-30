---
name: review
type: workflow
version: 1
when_to_use: >
  Evaluating a change (own or another's) for correctness, boundary
  compliance, and consistency before it's considered done — as a
  standalone pass, or as the Review stage inside feature/bugfix/refactor.
---

# Review Workflow

A lifecycle specification, not an executable pipeline.

| Stage      | What it means for a review                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Understand | What is the change trying to do, and under which workflow (feature/bugfix/refactor) was it made?                              |
| Plan       | Identify what to check: correctness, boundary compliance (`boundaries.md`), consistency across root docs, gate status.        |
| Implement  | N/A for a pure review — reviewing doesn't itself modify the change. If a fix is warranted, that's a new bugfix/refactor pass. |
| Validate   | Run the quality gate (`validation.md`) against the change if not already confirmed green.                                     |
| Review     | Distinguish confirmed defects from stylistic preference. Don't flag speculative "future-proofing" gaps as defects.            |
| Record     | Report findings clearly. If the review surfaces an undocumented architectural decision, flag it (`change-management.md`).     |

Exit criteria: findings are either resolved (via a follow-up
feature/bugfix/refactor pass) or explicitly accepted — never silently
dropped.
