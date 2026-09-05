---
id: TASK-004
type: task
title: Verify and preserve notes domain persistence ownership
status: todo
created: 2026-09-05
related: [ENG-001, ENG-001-W04, ENG-001-W05, SD-001, BACKLOG-014, BACKLOG-015, SPEC-018, ARCH-001]
---

# TASK-004: Verify and Preserve Notes Domain Persistence Ownership

## Work Package

`ENG-001-W04` - Domain/service ownership.

`ENG-001-W05` - Notes persistence.

## Feature

`BACKLOG-014` - Manage owned personal notes.

## Objective

Verify and preserve owner-scoped notes domain behavior and durable note
persistence.

## Scope

- Confirm create associates notes with the authenticated current user.
- Confirm list/read/update/delete operations are scoped by note id plus
  current user id where applicable.
- Confirm persistence keeps owner id, title, body, `createdAt`, and
  `updatedAt`.
- Confirm title/body limits and persistence validators remain active.

Out of scope: a new authorization service, sharing model, admin access,
new store, migration, or ownership Feature implementation for
`BACKLOG-015`.

## Source Design

`SD-001` Authorization / Ownership, Data Flow, Interaction Flows, and
Validation / Error Behavior.

## Relevant Repository Boundary

- `servers/test/api/src/domains/notes/notes.service.ts`
- `servers/test/api/src/domains/notes/notes.model.ts`
- existing auth/session middleware as current-user identity source

## Dependencies

None.

## Expected Outcome

Notes remain durable, owner-associated records, and cross-user read,
update, or delete attempts cannot disclose or mutate another user's note.

## Verification

Backend route/service coverage proves owner-only list, owned read/update/
delete, same not-found behavior for missing/not-owned notes, title/body
limits, empty body behavior, timestamped summaries, and persistence
validator enforcement.

## Acceptance Criteria

- Behavior remains traceable to `SD-001`, `ENG-001-W04`, and
  `ENG-001-W05`.
- `BACKLOG-015` is used only as a constraining ownership invariant.
- No new store, package, service, or authorization boundary is introduced.
- Completion evidence is recorded by the implementation pass.

## Status

`todo` - ready for an implementation agent.
