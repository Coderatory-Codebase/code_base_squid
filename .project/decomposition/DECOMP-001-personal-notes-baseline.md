---
id: DECOMP-001
type: decomposition
title: Personal notes baseline feature decomposition
status: complete
created: 2026-09-05
updated: 2026-09-05
related:
  [
    SPEC-018,
    DISC-001,
    REQ-001,
    SPEC-019,
    TRACE-025,
    TRACE-026,
    PROJECT-test,
    BACKLOG-013,
    BACKLOG-014,
    BACKLOG-015,
    BACKLOG-016,
  ]
---

# DECOMP-001: Personal Notes Baseline Feature Decomposition

## Source Specification

- Specification artifact: `SPEC-018`.
- Specification status: `active`.
- Specification readiness: `ready-for-decomposition`.
- Governing phase spec: `SPEC-019`.

## Source Discovery

- Discovery artifact: `DISC-001`.
- Discovery status after clarification rework: `complete`.
- Discovery evidence establishes that the seed `test` project already has
  an authenticated-owner personal notes baseline.
- Discovery also establishes the boundary: preserve/improve the existing
  notes capability; do not create a duplicate notes system or select
  unrelated enhancements.

## Rework History

### Initial Phase 4 Outcome

The first Phase 4 implementation produced a valid `DECOMP-*` artifact but
stopped at one outcome plus generic capabilities. It proved requirement
coverage and downstream boundary discipline, but it did not prove
feature-driven product decomposition or represent the resulting product
units in the existing backlog.

### Correction Applied

This rework keeps the same `DECOMP-001` identity because the work item is
unchanged. It revises the current decomposition so:

- Features are the primary delivery-oriented product units.
- The hierarchy is represented in `.project/backlog/BACKLOG.md` using the
  existing `BACKLOG-*` mechanism.
- `Level` / `Parent` backlog hierarchy stays separate from backlog
  workflow `Status`.
- Architecture remains the next phase and has not been performed.

## Outcome

Preserve and improve the existing authenticated-owner personal notes
baseline in the `test` seed application without creating a duplicate notes
system or selecting unrelated enhancements.

## Decomposition Readiness

`ready-for-architecture`.

The active Specification requirements are clear enough to decompose into
feature-driven product units for Architecture. Decomposition does not
create Architecture, Implementation Planning, Implementation, or
engineering tasks.

## Product Hierarchy

```text
DECOMP-001-U001 Personal Notes Baseline Outcome
  -> DECOMP-001-U002 / BACKLOG-013 Epic: Personal Notes Management
       -> DECOMP-001-U003 / BACKLOG-014 Feature: Manage Owned Personal Notes
       -> DECOMP-001-U004 / BACKLOG-015 Feature: Protect Personal Note Ownership
       -> DECOMP-001-U005 / BACKLOG-016 Feature: Reach Personal Notes from the Authenticated Workspace
  -> DECOMP-001-U006 Constraint: Existing Notes System Boundary
  -> DECOMP-001-U007 Artifact Traceability Requirement
```

This hierarchy uses one epic because the clarified baseline has one
coherent product area. It stops at Features because the Features are
bounded, understandable, traceable, and sized for Architecture. It does
not descend into technical tasks.

## Features

### DECOMP-001-U003 / BACKLOG-014 - Manage Owned Personal Notes

Type: feature.

Parent product unit: `DECOMP-001-U002` / `BACKLOG-013`.

Product purpose/value: authenticated users can maintain their own personal
notes as a durable part of the seed application.

Source requirements: `SPEC-018-R001`, `SPEC-018-R004`.

Discovery evidence: `DISC-001` identifies existing personal-note
management, persistence, authenticated use, and backend behavior tests as
the selected baseline.

Boundaries:

- In scope: create, view, edit, delete, and revisit owner-scoped personal
  notes as baseline product behavior.
- Out of scope: search, tags, sharing, export, pagination, rich text,
  attachments, reminders, collaboration, migration, documentation, a
  replacement notes model, or a duplicate notes system.

Dependencies: depends on `DECOMP-001-U004` / `BACKLOG-015` because note
management is not meaningful as personal notes without owner isolation.

Feature classification: real Feature, not merely a capability, constraint,
requirement, backlog row, or engineering task.

Architecture readiness: ready for Architecture.

### DECOMP-001-U004 / BACKLOG-015 - Protect Personal Note Ownership

Type: feature.

Parent product unit: `DECOMP-001-U002` / `BACKLOG-013`.

Product purpose/value: personal notes remain private to their authenticated
owner, preserving user trust and the meaning of "personal" in this
product area.

Source requirements: `SPEC-018-R002`; also governed by the duplicate-system
constraint in `SPEC-018-R006`.

Discovery evidence: `DISC-001` identifies authenticated-owner behavior and
cross-user isolation as part of the selected baseline.

Boundaries:

- In scope: a user must not receive, edit, or delete another user's note.
- Out of scope: shared notes, admin notes, anonymous notes, collaboration,
  or a new access model.

Dependencies: none.

Feature classification: real Feature because it is an independently
understandable product/security value slice, not an implementation task.

Architecture readiness: ready for Architecture.

### DECOMP-001-U005 / BACKLOG-016 - Reach Personal Notes from the Authenticated Workspace

Type: feature.

Parent product unit: `DECOMP-001-U002` / `BACKLOG-013`.

Product purpose/value: authenticated users can discover and reach personal
notes from their primary workspace instead of the notes baseline existing
as hidden or disconnected functionality.

Source requirements: `SPEC-018-R003`; quality-baseline constraint from
`SPEC-018-R005`.

Discovery evidence: `DISC-001` identifies dashboard-level discoverability
and the existing route-level quality baseline as part of the selected
current state.

Boundaries:

- In scope: personal notes remain reachable from the authenticated
  workspace experience.
- Out of scope: visual redesign, navigation redesign, interface
  implementation detail, frontend automated testing expansion, end-to-end
  testing expansion, accessibility expansion, or unrelated dashboard
  features.

Dependencies: related to `DECOMP-001-U003` / `BACKLOG-014`, but not
structurally dependent on it; discoverability and management are separate
product concerns within the same epic.

Feature classification: real Feature because it is a user-visible product
access slice, not a technical task.

Architecture readiness: ready for Architecture.

## Supporting Units

### DECOMP-001-U001 - Personal Notes Baseline Outcome

Type: outcome.

Purpose: hold the complete clarified scope from `SPEC-018` as the product
outcome being decomposed.

Backlog representation: no separate backlog row; the backlog-managed
product scope starts at epic `BACKLOG-013`.

Requirement treatment: full-scope context for `SPEC-018-R001` through
`SPEC-018-R007`.

### DECOMP-001-U002 / BACKLOG-013 - Personal Notes Management

Type: epic.

Purpose: group the clarified personal-notes baseline into a single product
area for feature-driven delivery and Architecture handoff.

Backlog representation: `BACKLOG-013`, `Level: epic`, `Parent: none`,
`Status: ready`.

Requirement treatment: product ancestry for feature rows `BACKLOG-014`,
`BACKLOG-015`, and `BACKLOG-016`.

### DECOMP-001-U006 - Existing Notes System Boundary

Type: constraint.

Purpose: prevent downstream work from treating `REQ-001` as authorization
to create a second notes capability, replacement model, migration, or
redesign.

Backlog representation: no separate backlog row because it is a governing
constraint across the feature rows, not a product feature by itself.

Requirement treatment: `SPEC-018-R006`.

### DECOMP-001-U007 - Artifact Traceability Requirement

Type: traceability.

Purpose: preserve why the work moved from initially blocked intent to a
ready baseline decomposition.

Backlog representation: no separate backlog row because traceability is
satisfied by the artifact chain, not by product scope.

Requirement treatment: `SPEC-018-R007`.

## Backlog Representation

The decomposition result is represented through the existing backlog
mechanism, not a parallel hierarchy.

| Backlog ID  | Level   | Parent      | Status  | Kind    | Scope / Owner  | Decomposition Unit | Treatment       |
| ----------- | ------- | ----------- | ------- | ------- | -------------- | ------------------ | --------------- |
| BACKLOG-013 | epic    | none        | `ready` | feature | PROJECT / test | DECOMP-001-U002    | Product area    |
| BACKLOG-014 | feature | BACKLOG-013 | `ready` | feature | PROJECT / test | DECOMP-001-U003    | Product Feature |
| BACKLOG-015 | feature | BACKLOG-013 | `ready` | feature | PROJECT / test | DECOMP-001-U004    | Product Feature |
| BACKLOG-016 | feature | BACKLOG-013 | `ready` | feature | PROJECT / test | DECOMP-001-U005    | Product Feature |

`BACKLOG-012` is completed by this rework because the backlog table now
has explicit `Level` and `Parent` columns.

## State / Hierarchy Separation

Backlog hierarchy:

```text
BACKLOG-013
  -> BACKLOG-014
  -> BACKLOG-015
  -> BACKLOG-016
```

Backlog workflow state:

```text
BACKLOG-014 Status: ready
BACKLOG-015 Status: ready
BACKLOG-016 Status: ready
```

`ready` is not a hierarchy node. It is the workflow state of each backlog
row.

## Requirement Coverage

| Specification Requirement | Coverage                                      | Decomposition Treatment                                           |
| ------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `SPEC-018-R001`           | `BACKLOG-014` / `DECOMP-001-U003`             | Direct product Feature: manage owned personal notes.              |
| `SPEC-018-R002`           | `BACKLOG-015` / `DECOMP-001-U004`             | Direct product/security Feature: protect ownership.               |
| `SPEC-018-R003`           | `BACKLOG-016` / `DECOMP-001-U005`             | Direct product Feature: reach notes from authenticated workspace. |
| `SPEC-018-R004`           | `BACKLOG-014` / `DECOMP-001-U003`             | Data behavior included in the manage-owned-notes Feature.         |
| `SPEC-018-R005`           | Constraint on `BACKLOG-014` and `BACKLOG-016` | Quality baseline constraint, not a separate product Feature.      |
| `SPEC-018-R006`           | `DECOMP-001-U006`; constrains all Features    | Cross-cutting boundary against duplicate notes scope.             |
| `SPEC-018-R007`           | `DECOMP-001-U007`; artifact chain             | Traceability requirement, not a product Feature.                  |

No active requirement is orphaned. No inactive candidate requirement
creates product scope.

## Relationships

| Relationship                                                        | Type         | Meaning                                                                            |
| ------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `BACKLOG-013 -> BACKLOG-014`                                        | parent/child | Manage owned notes belongs to the personal-notes epic.                             |
| `BACKLOG-013 -> BACKLOG-015`                                        | parent/child | Ownership protection belongs to the personal-notes epic.                           |
| `BACKLOG-013 -> BACKLOG-016`                                        | parent/child | Workspace reachability belongs to the personal-notes epic.                         |
| `BACKLOG-014 -> BACKLOG-015`                                        | depends-on   | Owned-note management depends on ownership protection.                             |
| `BACKLOG-016 -> BACKLOG-014`                                        | related-to   | Reachability is related to management but is not a technical dependency.           |
| `DECOMP-001 -> SPEC-018`                                            | derived-from | The decomposition is derived from the ready Specification.                         |
| `BACKLOG-013..016 -> DECOMP-001`                                    | derived-from | Product backlog rows were created/refined by this Decomposition evidence artifact. |
| `REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-013..016` | traceability | The real lifecycle chain can be followed from request to product units.            |

These relationships are semantic descriptions using existing graph
language. No graph engine, graph database, registry, or automated
dependency analyzer is created.

## Architecture Handoff

Architecture receives this product scope map:

- Epic: personal notes management (`BACKLOG-013`).
- Feature: manage owned personal notes (`BACKLOG-014`).
- Feature: protect personal note ownership (`BACKLOG-015`).
- Feature: reach personal notes from the authenticated workspace
  (`BACKLOG-016`).
- Cross-cutting constraints: preserve current quality baseline, preserve
  clarification traceability, and do not create a duplicate notes system.

Architecture should next reason about how the existing system realizes
these product Features using `DISC-001`, `SPEC-018`, `DECOMP-001`, and
the backlog rows. This artifact does not make those architecture
decisions.

## Non-Goals

- Do not add search, tags, sharing, export, pagination, rich text,
  attachments, reminders, collaboration, migration, or documentation
  scope.
- Do not create a duplicate notes system.
- Do not create engineering tasks.
- Do not choose architecture, APIs, schemas, components, libraries, test
  files, or implementation steps.
- Do not modify application source code.

## Traceability

```text
Human request
  -> REQ-001
  -> DISC-001
  -> SPEC-018
  -> DECOMP-001
  -> BACKLOG-013 / BACKLOG-014 / BACKLOG-015 / BACKLOG-016
```

Requirement-to-product-unit mapping:

```text
SPEC-018-R001 -> BACKLOG-014 / DECOMP-001-U003
SPEC-018-R002 -> BACKLOG-015 / DECOMP-001-U004
SPEC-018-R003 -> BACKLOG-016 / DECOMP-001-U005
SPEC-018-R004 -> BACKLOG-014 / DECOMP-001-U003
SPEC-018-R005 -> quality constraint on BACKLOG-014 and BACKLOG-016
SPEC-018-R006 -> DECOMP-001-U006 / all feature boundaries
SPEC-018-R007 -> DECOMP-001-U007 / artifact traceability
```

## Lifecycle State

- Intake: complete.
- Discovery: complete.
- Specification: active and ready.
- Decomposition: complete with readiness `ready-for-architecture`.
- Existing backlog: updated with feature-driven product hierarchy.
- Architecture: complete in `ARCH-001`.
- System Design for `BACKLOG-014`: complete in `SD-001`.
- Engineering Decomposition for `BACKLOG-014`: complete in `ENG-001`.
- Next allowed phase for `BACKLOG-014`: Implementation may be considered
  if explicitly requested.

## Boundary Check

- Architecture: created later by Phase 5 in `ARCH-001`, not by
  Decomposition.
- System Design for `BACKLOG-014`: created later by Phase 6 in `SD-001`,
  not by Decomposition.
- Engineering Decomposition for `BACKLOG-014`: created later by Phase 7
  in `ENG-001`, not by Decomposition.
- Implementation Planning: not created.
- Implementation: not started.
- Verification: not executed.
- Review: not executed.
- Delivery: not executed.
- Operate: not executed.
- Tasks: created later by Phase 7 rework as `TASK-001` through
  `TASK-005`, not by Decomposition.
- Application source: not changed.
