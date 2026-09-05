---
id: SPEC-018
type: spec
title: Personal notes test application specification
status: draft
created: 2026-09-05
related: [REQ-001, DISC-001, SPEC-017, TRACE-023, PROJECT-test, TRACE-014]
---

# SPEC-018: Personal Notes Test Application Specification

## Source Discovery

- Discovery artifact: `DISC-001`.
- Discovery status: `needs-clarification`.
- Governing phase spec: `SPEC-017`.

## Source Requirement

- Requirement artifact: `REQ-001`.
- Intake trace: `TRACE-019`.

## Original Request

Add personal notes functionality to the test application.

## Route

`PROJECT` / `SEED_APP`.

The request targets the `test` project/product brain. The Specification is
therefore project-scoped, while the Specification phase itself is
foundation-scoped.

## Specification Readiness

`needs-clarification`.

This Specification is intentionally `draft`. Discovery established that
personal notes already exist in the seed app and that the intended delta is
not known. This artifact records the requirements and candidate
requirements justified by Discovery, but it does not authorize
Decomposition.

## Discovery Inputs Used

- `DISC-001` preserves the original request from `REQ-001`.
- `DISC-001` finds that the current seed app already contains personal
  notes UI, API behavior, persistence, dashboard navigation, authentication
  protection, ownership isolation, and backend tests.
- `DISC-001` classifies the main needed capability as `decide` /
  `investigate`, with `reuse` likely available if the desired outcome is
  the already-present capability.
- `DISC-001` identifies business/product, UX, security, QA,
  technical/engineering, data, privacy, accessibility, and integration
  findings.
- `DISC-001` says Specification must not create new product requirements
  until the requester clarifies whether the intent is enhancement,
  verification, rebuild, migration, documentation, or lifecycle
  demonstration.

## Finding Treatment

| Discovery Finding                                      | Treatment                  | Reason                                                                                     |
| ------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------ |
| The requested capability appears already present.      | Active constraint          | Specification must not turn current implementation into new scope without a desired delta. |
| The product intent is unclear.                         | Active requirement         | Decomposition is blocked until the intended outcome is selected.                           |
| Authenticated-owner behavior exists.                   | Candidate requirement      | It is relevant, but Discovery did not establish whether that remains the intended model.   |
| Dashboard discovery of notes exists.                   | Candidate UX requirement   | Relevant if validation or enhancement is selected; not enough to choose that path.         |
| Backend tests cover notes behavior and ownership.      | Candidate quality baseline | Relevant to validation, but the requested quality bar is not established.                  |
| Search, tags, sharing, export, and pagination unknown. | Unresolved                 | Discovery listed them as unknowns, not approved requirements.                              |
| Low-applicability operations/compliance/cost lenses.   | Not carried forward        | Discovery found no evidence making them material for this request yet.                     |

## Active Requirements

### SPEC-018-R001 - Resolve Intended Outcome

Type: business/product decision.

Source: `DISC-001` -> `Decisions Needed`.

Requirement: before this work may proceed to Decomposition, the intended
outcome must be explicitly identified as one of: validate the existing
notes capability, enhance it, rebuild/replace it, document it, migrate it,
use it only as a lifecycle demonstration, or another stated outcome.

Acceptance condition: the Specification records the selected outcome,
removes or resolves the blocking uncertainty, and names which candidate
requirements become active.

### SPEC-018-R002 - Do Not Create Duplicate Notes Scope

Type: constraint.

Source: `DISC-001` -> `Current State`, `Gap / Capability Analysis`,
`Risks`.

Requirement: this Specification must not require creating, modifying, or
removing notes capability solely from the original wording of `REQ-001`,
because Discovery found a substantially matching current capability and no
missing product delta.

Acceptance condition: no Decomposition, Architecture, Implementation plan,
task breakdown, source-code change, or product backlog change is created
from `REQ-001` until `SPEC-018-R001` is resolved.

### SPEC-018-R003 - Preserve Discovery Finding Traceability

Type: traceability requirement.

Source: `SPEC-017` and `DISC-001`.

Requirement: each material Discovery finding used by a later completed
Specification must be traceable to `DISC-001` and must be marked as an
active requirement, constraint, non-goal, unresolved decision, or not
carried forward with reason.

Acceptance condition: an engineer can read the resulting Specification and
answer why each active requirement exists without re-running Discovery.

## Candidate Requirements Not Yet Active

These are not implementation scope. They are candidate transformations of
Discovery findings that may become active only after `SPEC-018-R001` is
resolved.

| ID            | Type               | Candidate Requirement                                                                                                                                                          | Source     | Status     |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------- |
| SPEC-018-C001 | Functional         | If the selected outcome is to validate or preserve the current private-notes capability, an authenticated user must be able to create, view, edit, and delete their own notes. | `DISC-001` | unresolved |
| SPEC-018-C002 | Security / Privacy | If notes remain personal/private, a user must not receive, edit, or delete another user's note.                                                                                | `DISC-001` | unresolved |
| SPEC-018-C003 | UX                 | If the selected outcome includes current user navigation, users must be able to find notes from the dashboard.                                                                 | `DISC-001` | unresolved |
| SPEC-018-C004 | Data behavior      | If durable notes remain in scope, note content must persist across page reloads and authenticated sessions.                                                                    | `DISC-001` | unresolved |
| SPEC-018-C005 | Quality            | If validation of the current feature is selected, tests must cover the selected create/view/edit/delete behavior and ownership boundary.                                       | `DISC-001` | unresolved |
| SPEC-018-C006 | Accessibility      | If UI changes are selected, the notes interface must preserve keyboard-accessible interaction for the specified workflow.                                                      | `DISC-001` | unresolved |

## Functional Requirements

No final product functional requirement is active yet beyond
`SPEC-018-R001` and `SPEC-018-R002`. Discovery did not establish whether
the correct product outcome is validation, enhancement, rebuild,
documentation, migration, or lifecycle demonstration.

## Non-Functional Requirements

No final product non-functional requirement is active yet. Security,
privacy, accessibility, data, and quality requirements remain candidate
requirements until the intended outcome is resolved.

## Business Rules

- The existing notes capability must be treated as current repository
  context, not as proof that a new notes feature should be built.
- Product intent must be clarified before downstream work can select a
  feature slice.

## Constraints

- The `test` project remains the owner of this request.
- The repository/foundation and project/product scopes must remain
  distinct.
- Specification must preserve facts, findings, assumptions, unknowns, and
  unresolved decisions from Discovery without turning them into hidden
  implementation decisions.
- Architecture, implementation, and task decomposition are downstream
  phases.

## Acceptance Conditions

- `SPEC-018` references `REQ-001` and `DISC-001`.
- The original request remains preserved.
- The Specification identifies `needs-clarification` readiness.
- The Specification carries forward material Discovery findings by
  requirement, candidate requirement, unresolved decision, or explicit
  non-carry-forward reason.
- Candidate product requirements remain inactive while the intended outcome
  is unresolved.
- Decomposition is not allowed until `SPEC-018-R001` is resolved.

## Non-Goals

- Do not specify a final notes feature from the original request alone.
- Do not select validation, enhancement, rebuild, documentation, migration,
  or lifecycle demonstration without a source decision.
- Do not add search, tags, sharing, export, pagination, rich text,
  attachments, reminders, or collaboration as requirements.
- Do not create architecture, data schema, API contract, UI component
  design, implementation plan, task breakdown, or source-code change.

## Unresolved Decisions

- Is `REQ-001` a lifecycle demonstration or an actual product request?
- If it is product work, what is the intended delta from the existing notes
  capability?
- Should the current authenticated-owner model remain the product model?
- Should a future completed Specification focus on validation,
  enhancement, replacement, migration, documentation, or something else?
- What quality bar should be used if validation or enhancement is selected?

## Traceability

```text
Human request
  -> REQ-001
  -> DISC-001
  -> SPEC-018
```

- Request: "Add personal notes functionality to the test application."
- Intake: `REQ-001`, trace `TRACE-019`.
- Discovery: `DISC-001`, traces `TRACE-021` and `TRACE-022`.
- Specification: `SPEC-018`, trace `TRACE-023`.

## Lifecycle State

- Intake: complete.
- Discovery: complete with status `needs-clarification`.
- Specification: draft with readiness `needs-clarification`.
- Next allowed phase: none until the unresolved intended outcome is
  resolved.
- Decomposition: not allowed yet.

## Boundary Check

- Decomposition: not created.
- Architecture: not created.
- Implementation: not started.
- Verification: not executed.
- Review: not executed.
- Delivery: not executed.
- Operate: not executed.
- Feedback: not executed.
- Tasks: not created.
