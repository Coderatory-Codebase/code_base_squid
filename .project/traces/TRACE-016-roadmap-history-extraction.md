---
id: TRACE-016
type: trace
title: Roadmap history extraction
status: completed
created: 2026-09-05
related: [BACKLOG-010, PLAN-006, ADR-015, SPEC-014]
---

# TRACE-016: Roadmap History Extraction

## Request

The user approved the next M26 follow-up: move detailed milestone history
out of `architecture.yaml`.

## Classification

`FOUNDATION`.

This changes project architecture memory and operating-layer orientation;
no seed-app source is in scope.

## Checkpoints

- Selected `BACKLOG-010`.
- Created `PLAN-006` before editing architecture files.
- Created `.project/roadmap/` as the first real roadmap-history location.
- Moved the detailed `architecture.yaml` roadmap block into
  `.project/roadmap/MILESTONES.yaml`.
- Replaced the large `architecture.yaml` roadmap block with current
  phase, active work, current milestone, and history-file pointer.
- Marked `BACKLOG-010` and `PLAN-006` complete.

## Validation

- `node tooling/scripts/validate-architecture-boundaries.mjs` passed.
- `git -c safe.directory=C:/workspace/_goaled/nutshyll diff --check`
  passed.
- Full JS validation remains blocked by dependency installation/network
  constraints already recorded in `TRACE-015`.
