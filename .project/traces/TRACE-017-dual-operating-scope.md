---
id: TRACE-017
type: trace
title: Dual operating scope clarification
status: completed
created: 2026-09-05
related: [ADR-016, PLAN-007, SPEC-014, SPEC-010]
---

# TRACE-017: Dual Operating Scope Clarification

## Request

The user clarified that the operating model must work for both the
monorepo foundation and the projects/products built inside it. Agents
must follow directions and maintain backlog/spec/state differently by
scope, while still using one repo-native operating system.

## Classification

`FOUNDATION`.

This changes how agents classify, load, and maintain project/product
work versus repository/foundation work.

## Checkpoints

- Created `ADR-016` to record the dual operating-scope decision.
- Created `PLAN-007` before editing operating docs.
- Created `.project/projects/test/PROJECT.md` as the seed project's
  product/project brain.
- Updated `AGENTS.md`, `architecture.yaml`, `README.md`, `.agent/`,
  `.project/`, `SPEC-010`, and `SPEC-014` so foundation/project scope is
  part of agent orientation and backlog maintenance.
- Migrated `.project/backlog/BACKLOG.md` rows to include `Scope` and
  `Owner`.
- Updated `.project/state/PROJECT-STATE.md` and
  `.project/roadmap/MILESTONES.yaml` so the live state points at
  `ADR-016`, `PLAN-007`, and this trace.

## Validation

Architecture-boundary validation and whitespace checks passed on
2026-09-05. Full `pnpm` validation was not rerun here because dependencies
are absent in the workspace and the prior install attempt hit registry
access restrictions.
