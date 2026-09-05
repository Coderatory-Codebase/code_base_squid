---
id: TASK-002
type: task
title: Verify and preserve notes client integration
status: todo
created: 2026-09-05
related: [ENG-001, ENG-001-W02, TASK-001, TASK-003, SD-001, BACKLOG-014, SPEC-018, ARCH-001]
---

# TASK-002: Verify and Preserve Notes Client Integration

## Work Package

`ENG-001-W02` - Web/API client integration.

## Feature

`BACKLOG-014` - Manage owned personal notes.

## Objective

Verify and preserve same-origin notes API client behavior and local
app-owned note types.

## Scope

- Confirm `GET`, `POST`, `PATCH`, and `DELETE` client calls target
  `/api/notes` through the existing same-origin path.
- Confirm requests include credentials where required by the session
  model.
- Confirm API error messages are surfaced to the notes experience.
- Confirm the web app keeps local consumed types rather than importing
  server source or creating a shared package.

Out of scope: new shared contracts, new packages, new API endpoints, and
frontend behavior unrelated to `BACKLOG-014`.

## Source Design

`SD-001` Data Flow, System Responsibilities, Architecture Consistency
Check, and Validation / Error Behavior.

## Relevant Repository Boundary

- `apps/test/web/src/lib/notes-client.ts`
- `apps/test/web/next.config.ts`

## Dependencies

- `TASK-001`
- `TASK-003`

## Expected Outcome

The notes UI consumes the existing API boundary through the approved
same-origin integration and keeps contract ownership local to the web app.

## Verification

Confirm client methods send credentialed requests, handle API error
responses, keep the expected note summary shape, and avoid server-source
imports.

## Acceptance Criteria

- Behavior remains traceable to `SD-001` and `ENG-001-W02`.
- No shared contract/package boundary is introduced.
- Client behavior remains compatible with `TASK-003` API behavior.
- Completion evidence is recorded by the implementation pass.

## Status

`todo` - ready after dependencies are available.
