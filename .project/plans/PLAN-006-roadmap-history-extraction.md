---
id: PLAN-006
type: plan
title: Roadmap history extraction
status: complete
created: 2026-09-05
related: [BACKLOG-010, SPEC-014, ADR-015]
---

# PLAN-006: Roadmap History Extraction

## Objective

Move detailed milestone history out of `architecture.yaml` so that file
can function as current architecture first, while preserving the full
milestone record in a dedicated project-memory artifact.

## Scope

- Create `.project/roadmap/MILESTONES.yaml`.
- Move the detailed `roadmap.milestones` content from `architecture.yaml`
  into that file.
- Keep `architecture.yaml` as the live architecture source with current
  phase, active work, and a pointer to the roadmap-history file.
- Update repository/project documentation and state references.
- Mark `BACKLOG-010` complete when validated.

## Out of scope

- Adding validators for artifact or architecture drift.
- Migrating backlog levels/parents.
- Editing application code.

## Acceptance Criteria

- `architecture.yaml` is no longer dominated by the full milestone list.
- The complete milestone history remains available under `.project/roadmap/`.
- Current phase and active M26 follow-up work remain discoverable from
  `architecture.yaml`.
- Project state/backlog/trace record the move.

## Validation

- `node tooling/scripts/validate-architecture-boundaries.mjs` passed.
- `git -c safe.directory=C:/workspace/_goaled/nutshyll diff --check`
  passed.
- Full JS validation remains blocked by dependency installation/network
  constraints already recorded in `TRACE-015`.

## Outcome

Complete. Detailed milestone history now lives in
`.project/roadmap/MILESTONES.yaml`; `architecture.yaml` keeps live
architecture and active phase.
