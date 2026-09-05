---
id: PLAN-007
type: plan
title: Dual operating scope clarification
status: complete
created: 2026-09-05
related: [ADR-016, SPEC-014, SPEC-010]
---

# PLAN-007: Dual Operating Scope Clarification

## Objective

Make it explicit that the operating model works for both the repository
foundation and the projects/products built inside it.

## Scope

- Record the dual operating-scope decision.
- Add project/product memory for the existing `test` seed project.
- Update architecture and agent entry rules to require scope/owner
  classification.
- Update backlog conventions so items distinguish foundation work from
  project/product work.
- Update the app-analysis workflow and MERN/Next.js skill to load the
  project brain before implementation.

## Out of Scope

- Building a project-management application or agent runtime.
- Splitting the backlog into multiple backlogs.
- Implementing validators; that remains `BACKLOG-011`.
- Fully migrating level/parent relationships; that remains `BACKLOG-012`.

## Acceptance Criteria

- Agents can tell whether a request targets the repo foundation, a
  project/product, or both.
- Backlog items have an explicit scope and owner.
- The seed project has a project-memory entry point.
- App/product work is governed by foundation instructions plus
  project-specific memory.

## Outcome

Completed in `TRACE-017`.
