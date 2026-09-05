---
id: PLAN-015
type: plan
title: Decomposition feature-driven rework
status: complete
created: 2026-09-05
related: [SPEC-019, SPEC-010, DECOMP-001, BACKLOG-012, TRACE-026]
---

# PLAN-015: Decomposition Feature-Driven Rework

## Objective

Correct Phase 4 so Decomposition genuinely transforms a ready
Specification into feature-driven product units and represents those units
through the existing backlog model.

## Scope

- Inspect the current Phase 4 implementation, the M15/M26 backlog model,
  graph semantics, Specification readiness behavior, `DISC-001`,
  `SPEC-018`, `DECOMP-001`, state, roadmap, plans, traces, and lifecycle
  tests.
- Amend the Decomposition workflow and `SPEC-019` so Features are the
  primary delivery-oriented units.
- Complete the explicit backlog hierarchy migration in the existing
  singleton backlog table by adding `Level` and `Parent` columns.
- Rework `DECOMP-001` in place so it maps `SPEC-018` to backlog-managed
  epic/feature rows.
- Add/update tests proving readiness gates, requirement coverage, feature
  presence, backlog integration, hierarchy/state separation, traceability,
  no orphan units, no architecture leakage, no engineering task
  decomposition, and the feature-level stopping rule.
- Update state, roadmap, and trace records proportionally.

## Out of Scope

- Architecture / Phase 5.
- Implementation Planning, Implementation, Verification, Review, Delivery,
  or Operate.
- Application source changes.
- API contracts, database schemas, UI component designs, technical task
  breakdowns, engines, CLIs, role systems, new skills, or a second backlog.

## Outcome

Completed in `TRACE-026`.
