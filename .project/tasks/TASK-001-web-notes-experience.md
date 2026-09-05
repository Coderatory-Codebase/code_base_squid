---
id: TASK-001
type: task
title: Verify and preserve web notes experience
status: todo
created: 2026-09-05
related: [ENG-001, ENG-001-W01, SD-001, BACKLOG-014, SPEC-018, ARCH-001]
---

# TASK-001: Verify and Preserve Web Notes Experience

## Work Package

`ENG-001-W01` - Web entry and notes experience.

## Feature

`BACKLOG-014` - Manage owned personal notes.

## Objective

Verify and preserve the authenticated notes page and browser notes
experience described by `SD-001`.

## Scope

- Confirm the notes page remains gated by the current-user check.
- Confirm the notes experience supports create, list/view, edit, delete,
  pending mutation state, empty state, and error state.
- Correct only drift from `SD-001` found inside the existing web notes
  surface.

Out of scope: workspace reachability for `BACKLOG-016`, ownership model
redesign for `BACKLOG-015`, and application source changes outside this
task's implementation pass.

## Source Design

`SD-001` Feature Behavior, Interaction Flows, System Responsibilities,
Validation / Error Behavior, and Observability / Testability.

## Relevant Repository Boundary

- `apps/test/web/src/app/notes/page.tsx`
- `apps/test/web/src/app/notes/note-list.tsx`

## Dependencies

None.

## Expected Outcome

An authenticated owner can use the notes surface to create, see, edit, and
delete owned notes while visible state remains understandable during
loading, pending mutations, empty lists, and failures.

## Verification

Confirm unauthenticated redirect behavior, authenticated rendering,
create/list/edit/delete UI paths, pending state, empty state, and error
display through the verification method selected by the implementation
pass.

## Acceptance Criteria

- Behavior remains traceable to `SD-001` and `ENG-001-W01`.
- No sibling Feature behavior is implemented.
- No new app, shared package, runtime, or UI framework boundary is added.
- Completion evidence is recorded by the implementation pass.

## Status

`todo` - ready for an implementation agent.
