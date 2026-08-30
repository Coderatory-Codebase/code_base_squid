---
name: review
type: workflow
version: 2
when_to_use: >
  Evaluating a change (own or another's) for correctness, boundary
  compliance, and consistency before it's considered done — as a
  standalone pass, or as the REVIEW stage inside feature/bugfix/refactor.
---

# Review Workflow

The REVIEW stage's dimensions are defined once, in
[`development-lifecycle.md`](../instructions/development-lifecycle.md) →
"Review dimensions" (correctness, architecture, scope, quality,
regression, maintainability, documentation) — this file doesn't restate
them. It covers only what's specific to running review as its own
standalone pass.

## What's different

- **UNDERSTAND** here means identifying what the change is trying to do
  and under which workflow (feature/bugfix/refactor) it was made — a
  standalone review has no PLAN/IMPLEMENT stage of its own; it inspects
  someone else's.
- **VALIDATE** means confirming the quality gate is actually green for
  the change under review, not assuming it — run
  `validate-repository` if not already confirmed.
- Distinguish confirmed defects from stylistic preference. Don't flag
  speculative "future-proofing" gaps as defects (`implementation.md`).

## Exit criteria

Findings are either resolved (via a follow-up bugfix/refactor pass) or
explicitly accepted — never silently dropped. If review surfaces an
undocumented architectural decision, flag it (`change-management.md`).
