---
id: PLAN-016
type: plan
title: Architecture lifecycle phase
status: complete
created: 2026-09-05
related: [SPEC-020, ARCH-001, DECOMP-001, SPEC-018, DISC-001, TRACE-027]
---

# PLAN-016: Architecture Lifecycle Phase

## Objective

Implement Phase 5 - Architecture - as a bounded, agent-executed lifecycle
phase that consumes Discovery, Specification, Decomposition, and backlog
Features before Implementation Planning.

## Scope

- Inspect existing architecture/ADR/artifact conventions, Phase 1-4
  outputs, backlog Feature rows, state, roadmap, and targeted source
  evidence.
- Define the Architecture workflow and governing lifecycle spec.
- Add the smallest required `ARCH-*` artifact convention because Phase 5
  has a real required output.
- Execute Architecture against `DISC-001`, `SPEC-018`, `DECOMP-001`, and
  `BACKLOG-013` through `BACKLOG-016`.
- Map every decomposed Feature to architectural treatment.
- Record current state, target state, relevant boundaries, meaningful
  decisions, trade-offs, risks/open decisions, and downstream handoff.
- Add behavior tests for gating, traceability, Feature coverage,
  current-state grounding, decision evidence, boundary correctness,
  non-one-to-one mapping, no implementation leakage, reuse behavior, open
  decisions, and downstream handoff.
- Update package scripts, state, architecture metadata, roadmap, and index
  documentation.

## Out of Scope

- Implementation Planning, Implementation, Verification, Review, Delivery,
  or Operate.
- Application source changes.
- Engineering task/job creation.
- API/database/UI implementation plans.
- Runtime agent infrastructure, roles, jobs, new skills, graph engines,
  duplicate ADR/backlog/state/contract/traceability systems, or an
  architecture engine/registry/manager/CLI.

## Outcome

Completed in `TRACE-027`.
