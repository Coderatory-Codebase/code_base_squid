---
id: SPEC-018
type: spec
title: Personal notes test application specification
status: active
created: 2026-09-05
updated: 2026-09-05
related: [REQ-001, DISC-001, SPEC-017, TRACE-023, TRACE-024, PROJECT-test, TRACE-014]
---

# SPEC-018: Personal Notes Test Application Specification

## Source Discovery

- Discovery artifact: `DISC-001`.
- Initial Discovery status: `needs-clarification`.
- Current Discovery status after rework: `complete`.
- Governing phase spec: `SPEC-017`.

## Source Requirement

- Requirement artifact: `REQ-001`.
- Intake trace: `TRACE-019`.

## Original Request

Add personal notes functionality to the test application.

## Rework History

### Initial Specification Outcome

`SPEC-018` originally ended as `draft` with readiness
`needs-clarification`. It correctly blocked Decomposition because
`DISC-001` found that personal notes already existed in the seed app while
the desired delta was unknown.

The initial draft recorded candidate requirements as inactive and did not
authorize new product scope.

### Clarification Event

Source: product clarification introduced during Phase 3 correction
(`TRACE-024`) to prove the lifecycle loop.

Clarification:

> The intent is to improve the existing personal notes capability rather
> than create a new notes system. Preserve the existing authenticated-owner
> personal-notes model as the product baseline for this work. Do not add
> search, tags, sharing, export, pagination, rich text, attachments,
> reminders, collaboration, migration, or documentation scope from this
> clarification.

Return point used: Discovery.

Reason: the clarification changes Discovery-level understanding of the
desired outcome and gap. `DISC-001` was reworked first, then this
Specification was revised.

## Route

`PROJECT` / `SEED_APP`.

The request targets the `test` project/product brain. The Specification is
therefore project-scoped, while the Specification phase itself is
foundation-scoped.

## Specification Readiness

`ready-for-decomposition`.

This Specification is now `active` because clarified Discovery establishes
the intended baseline: preserve and improve the existing authenticated-
owner personal-notes capability without creating a duplicate notes system
or selecting unrelated enhancements.

## Discovery Inputs Used

- `REQ-001` preserves the original request.
- `DISC-001` initially found that the requested notes capability already
  existed and that the desired delta was unclear.
- The clarification recorded in `DISC-001` selects the existing
  authenticated-owner notes model as the baseline.
- `DISC-001` identifies existing notes UI, API behavior, persistence,
  dashboard navigation, authentication protection, ownership isolation, and
  backend route tests as current-state evidence.
- `DISC-001` explicitly excludes search, tags, sharing, export,
  pagination, rich text, attachments, reminders, collaboration, migration,
  and documentation from this clarification.

## Clarification Gate

| State                              | Outcome                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| Initial unresolved intent          | Specification stayed draft, readiness `needs-clarification`, Decomposition blocked.           |
| Failed or irrelevant clarification | Specification would remain draft or blocked; candidate requirements would remain inactive.    |
| Successful clarification           | Discovery was reworked first; Specification was revised only after upstream evidence changed. |
| Current readiness                  | Baseline Specification is ready; Decomposition may be considered but has not been executed.   |

## Finding Treatment

| Discovery Finding                                       | Treatment                     | Reason                                                                                |
| ------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| The requested capability appears already present.       | Active constraint             | Do not create a duplicate notes system.                                               |
| Clarified intent is to improve/preserve existing notes. | Active baseline requirement   | Discovery now supports baseline requirements for the existing capability.             |
| Authenticated-owner behavior exists.                    | Active requirement            | Clarification selects the authenticated-owner model as the product baseline.          |
| Dashboard discovery of notes exists.                    | Active UX requirement         | It is part of the selected baseline to preserve.                                      |
| Backend tests cover notes behavior and ownership.       | Active quality baseline       | Current route-level validation is relevant evidence for preserving baseline behavior. |
| Search, tags, sharing, export, and pagination unknown.  | Inactive candidate / non-goal | The clarification explicitly does not select these enhancements.                      |
| Low-applicability operations/compliance/cost lenses.    | Not carried forward           | Discovery found no evidence making them material for this request.                    |

## Active Requirements

### SPEC-018-R001 - Preserve Existing Notes Baseline

Type: functional requirement.

Source: `DISC-001` -> `Existing Capabilities`, `Clarification Event`.

Requirement: an authenticated user can create, view, edit, and delete
their own personal notes in the test application.

Acceptance condition: the selected baseline demonstrates create, view,
edit, and delete behavior for notes owned by the authenticated user.

### SPEC-018-R002 - Maintain Ownership Isolation

Type: security / privacy requirement.

Source: `DISC-001` -> `Security`, `Data / Privacy`, `Clarification Event`.

Requirement: a user must not receive, edit, or delete another user's
personal note.

Acceptance condition: attempts to access another user's note do not
disclose or modify that note.

### SPEC-018-R003 - Keep Notes Discoverable

Type: UX requirement.

Source: `DISC-001` -> `UX / User Experience`, `Current State`.

Requirement: authenticated users can discover and reach their personal
notes from the dashboard-level application navigation.

Acceptance condition: the application exposes a navigation path from the
authenticated dashboard experience to personal notes.

### SPEC-018-R004 - Preserve Durable Personal Notes

Type: data behavior requirement.

Source: `DISC-001` -> `Data / Privacy`, `Existing Context`.

Requirement: personal note content remains associated with its owner and
available across ordinary authenticated use of the test application.

Acceptance condition: a note created by an authenticated user remains
available to that same user after the notes view is revisited.

### SPEC-018-R005 - Preserve Current Quality Baseline

Type: quality requirement.

Source: `DISC-001` -> `QA / Quality`, `Evidence`.

Requirement: validation for the selected baseline continues to cover
create/list/read/update/delete behavior, input validation, unauthenticated
rejection, and cross-user ownership isolation.

Acceptance condition: baseline validation evidence covers the listed
behavior without requiring new enhancement scope.

### SPEC-018-R006 - Do Not Create a Duplicate Notes System

Type: constraint.

Source: `DISC-001` -> `Gap / Capability Analysis`, `Clarification Event`.

Requirement: this work must not create a second notes capability, parallel
domain, replacement model, migration, or redesign from the original wording
of `REQ-001`.

Acceptance condition: downstream work, if later performed, is scoped to
the existing personal-notes capability unless a later Intake/Discovery
cycle selects a different outcome.

### SPEC-018-R007 - Preserve Clarification Traceability

Type: traceability requirement.

Source: `SPEC-017`, `DISC-001`, `TRACE-024`.

Requirement: the initial blocked Specification, the clarification event,
the Discovery rework, and the revised ready Specification remain
discoverable.

Acceptance condition: an engineer can read `REQ-001`, `DISC-001`,
`SPEC-018`, `TRACE-023`, and `TRACE-024` to answer why the Specification
was blocked, what changed, and why it became ready.

## Candidate Requirements Not Yet Active

These are not implementation scope. They remain inactive because the
clarification selected the baseline only.

| ID            | Type             | Candidate Requirement                                                                                         | Source     | Status     |
| ------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| SPEC-018-C001 | Functional       | Add search, tags, sharing, export, pagination, rich text, attachments, reminders, or collaboration.           | `DISC-001` | inactive   |
| SPEC-018-C002 | Quality          | Add frontend component tests or end-to-end coverage beyond the existing route-level baseline.                 | `DISC-001` | unresolved |
| SPEC-018-C003 | Accessibility    | Define new accessibility acceptance criteria for future UI changes beyond preserving the current notes entry. | `DISC-001` | unresolved |
| SPEC-018-C004 | Migration / Docs | Migrate, replace, or document the notes feature as the selected product outcome.                              | `DISC-001` | inactive   |

## Functional Requirements

- `SPEC-018-R001`: authenticated owners can create, view, edit, and delete
  their own personal notes.
- `SPEC-018-R003`: authenticated users can discover notes from the
  dashboard-level navigation.
- `SPEC-018-R004`: personal notes remain available across ordinary
  authenticated use.

## Non-Functional Requirements

- `SPEC-018-R002`: ownership isolation and personal-note privacy are
  preserved.
- `SPEC-018-R005`: the current baseline remains validated.

## Business Rules

- The existing notes capability is the selected baseline.
- The clarified work is not greenfield notes creation.
- Additional enhancements require their own supported Intake/Discovery
  evidence before becoming active requirements.

## Constraints

- The `test` project remains the owner of this request.
- The repository/foundation and project/product scopes must remain
  distinct.
- Specification must preserve facts, findings, assumptions, unknowns, and
  unresolved decisions from Discovery without turning them into hidden
  implementation decisions.
- Architecture, implementation, and task decomposition remain downstream
  phases.

## Acceptance Conditions

- `SPEC-018` references `REQ-001` and `DISC-001`.
- The original request remains preserved.
- The initial `needs-clarification` outcome remains discoverable.
- The clarification is represented in `DISC-001` before this revised
  Specification claims readiness.
- The Specification readiness is `ready-for-decomposition`.
- Active requirements are limited to the clarified baseline.
- Candidate enhancements remain inactive.
- Decomposition is allowed only as a next phase and is now represented by
  `DECOMP-001`.

## Non-Goals

- Do not create a duplicate notes feature.
- Do not select search, tags, sharing, export, pagination, rich text,
  attachments, reminders, collaboration, migration, or documentation.
- Do not create architecture, data schema, API contract, UI component
  design, implementation plan, task breakdown, or source-code change.
- Do not execute Decomposition or any later lifecycle phase in this
  correction.

## Unresolved Decisions

No decision blocks the clarified baseline Specification.

Future work still needs a separate decision before any additional notes
enhancement, replacement, migration, documentation, frontend/E2E quality
bar, or accessibility expansion is selected.

## Traceability

```text
Human request
  -> REQ-001
  -> DISC-001 initial needs-clarification
  -> SPEC-018 initial draft / needs-clarification
  -> TRACE-024 clarification/rework
  -> DISC-001 reworked / complete
  -> SPEC-018 revised / ready-for-decomposition
```

- Request: "Add personal notes functionality to the test application."
- Intake: `REQ-001`, trace `TRACE-019`.
- Discovery: `DISC-001`, traces `TRACE-021`, `TRACE-022`, and `TRACE-024`.
- Specification: `SPEC-018`, traces `TRACE-023` and `TRACE-024`.

## Lifecycle State

- Intake: complete.
- Discovery: reworked and complete after clarification.
- Specification: active with readiness `ready-for-decomposition`.
- Decomposition: complete in `DECOMP-001`.
- Next allowed phase: Architecture may be considered, but has not been
  executed.

## Boundary Check

- Decomposition: created later by Phase 4 in `DECOMP-001`, not by
  Specification.
- Architecture: not created.
- Implementation: not started.
- Verification: not executed.
- Review: not executed.
- Delivery: not executed.
- Operate: not executed.
- Feedback: not executed.
- Tasks: not created.
