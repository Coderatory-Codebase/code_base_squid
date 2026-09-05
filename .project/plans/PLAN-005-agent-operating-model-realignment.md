---
id: PLAN-005
type: plan
title: Agent operating model realignment
status: complete
created: 2026-09-05
related: [SPEC-014, ADR-015]
---

# PLAN-005: Agent Operating Model Realignment

## Objective

Make the repo behave as an agent-executable operating foundation for
feature-driven MERN/Next.js monorepo development, not only as a record of
past work.

## Scope for this first slice

- Add the realignment SPEC before changing the model.
- Record the `architecture.yaml` role decision as an ADR.
- Add a request routing gate to the agent entry chain.
- Add a dual-track app analysis workflow.
- Strengthen feature workflow so non-trivial app features require
  discovery, scope, and plan before implementation.
- Create the first approved stack skill for MERN/Next.js vertical slices.
- Start reshaping `architecture.yaml` toward current architecture.
- Fix the misplaced M26 report artifact.
- Capture heavier remaining enforcement/migration work in backlog.

## Out of scope for this first slice

- Moving all milestone history out of `architecture.yaml`.
- Implementing validators for artifacts/backlog/import boundaries.
- Migrating the backlog table to level/parent columns.
- Refactoring application source.

## Acceptance criteria

- A fresh agent can classify a request as foundation, seed-app, or
  cross-cutting before touching code.
- Non-trivial seed-app features point to app-analysis and vertical-slice
  guidance before implementation.
- The first MERN/Next.js stack skill exists and is discoverable.
- `architecture.yaml` has explicit current-architecture and operating
  model sections before roadmap history.
- Remaining structural work is recorded as backlog, not lost.

## Validation

- `node tooling/scripts/validate-architecture-boundaries.mjs` passed.
- `git -c safe.directory=C:/workspace/_goaled/nutshyll diff --check`
  passed.
- Full `pnpm run validate` / `format:check` could not complete because
  dependency installation is blocked by sandboxed registry access.
- `secrets:scan` is still blocked by Git safe-directory ownership in this
  workspace.

## Outcome

Complete for this first slice. M26 remains active through the follow-up
backlog items; `BACKLOG-010` is now complete, with `BACKLOG-011` and
`BACKLOG-012` still captured.
