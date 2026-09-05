---
id: SD-001
type: system-design
title: Manage owned personal notes system design
status: complete
created: 2026-09-05
related:
  [
    SPEC-021,
    REQ-001,
    DISC-001,
    SPEC-018,
    DECOMP-001,
    BACKLOG-013,
    BACKLOG-014,
    BACKLOG-015,
    ARCH-001,
    ADR-012,
    ADR-013,
    ADR-014,
    ADR-016,
    TRACE-028,
  ]
---

# SD-001: Manage Owned Personal Notes System Design

## Selected Feature

Exactly one Feature is designed:

```text
BACKLOG-014 - Manage owned personal notes
```

`BACKLOG-014` is a `PROJECT / test` backlog row with `Level: feature`,
`Kind: feature`, `Status: ready`, parent `BACKLOG-013`, and source
`DECOMP-001`.

## Sources

```text
Human Request
  -> REQ-001
  -> DISC-001
  -> SPEC-018
  -> DECOMP-001
  -> BACKLOG-014
  -> ARCH-001
  -> SD-001
```

- Source requirement: `REQ-001`.
- Source Discovery: `DISC-001`, status `complete`.
- Source Specification: `SPEC-018`, status `active`, readiness
  `ready-for-decomposition`.
- Source Decomposition: `DECOMP-001`, status `complete`, readiness
  `ready-for-architecture`.
- Source Feature: `BACKLOG-014`, "Manage owned personal notes".
- High-level Architecture baseline: `ARCH-001`, status `complete`.
- Governing System Design spec: `SPEC-021`.

## Feature Eligibility

`BACKLOG-014` is eligible for System Design because:

- it exists in the singleton backlog;
- it is a `feature`, not an epic, task, risk, or discovered issue;
- it belongs to parent epic `BACKLOG-013`, which exists;
- it is `ready`;
- it is produced by `DECOMP-001`;
- `DECOMP-001` maps it to active requirements `SPEC-018-R001` and
  `SPEC-018-R004`;
- `ARCH-001` maps it to the existing web notes experience, notes API,
  notes domain, and notes persistence.

## Scope

In scope for this Feature:

- an authenticated owner can create a note with a title and optional body;
- an authenticated owner can list and view their own notes;
- an authenticated owner can edit their own note title and/or body;
- an authenticated owner can delete their own note;
- note content remains durable and associated with the owner across
  ordinary authenticated use;
- the system preserves the existing web/API/domain/persistence shape from
  `ARCH-001`.

Out of scope:

- product-wide personal notes design;
- detailed design for `BACKLOG-015`;
- detailed design for `BACKLOG-016`;
- search, tags, sharing, export, pagination, rich text, attachments,
  reminders, collaboration, migration, documentation, or admin access;
- new application, server, package, persistence store, infrastructure
  boundary, or shared contract boundary;
- Engineering Decomposition, tasks, implementation plan, or source-code
  changes.

## Sibling Feature Boundaries

`BACKLOG-015` is referenced only as an ownership/security invariant:
managed notes must remain owner-scoped. This artifact does not design a
new ownership model, sharing model, admin model, or authorization service.

`BACKLOG-016` is not designed here. This artifact assumes a user has
reached the notes management surface; workspace navigation and
discoverability remain the sibling Feature's concern.

## Actors

| Actor                         | Role in this Feature                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Authenticated owner           | Creates, lists/views, edits, and deletes their own notes.                                  |
| Unauthenticated visitor       | Cannot manage notes; receives authentication rejection before note behavior is performed.  |
| Browser notes experience      | Holds transient form/list/edit/loading/error state and calls the notes API.                |
| `servers/test/api` notes API  | Validates authenticated note requests and coordinates domain behavior.                     |
| Notes domain/service boundary | Applies owner-scoped create, list, read, update, and delete behavior.                      |
| Notes persistence boundary    | Stores owner id, title, body, creation time, and update time for durable personal records. |

## Feature Behavior

The Feature behavior is CRUD-style owner management of durable personal
notes within the existing seed app:

- Load: the notes experience requests the authenticated owner's notes and
  renders loading, empty, populated, or error states.
- Create: the owner submits a required title and optional body; the system
  validates input, persists a new owner-associated note, clears the create
  form, and refreshes the visible list.
- View: the owner sees note title, optional body, and update timestamp in
  the list. The API can also return a single owned note by id when needed.
- Edit: the owner opens one note for editing, changes title and/or body,
  saves through the API, exits edit mode, and refreshes the visible list.
- Delete: the owner deletes one owned note; if that note was being edited,
  edit mode is cleared; the list refreshes after deletion.

## Interaction Flows

### Load Owned Notes

```text
Authenticated owner on notes surface
  -> browser notes experience requests GET /api/notes
  -> same-origin API proxy preserves cookie-based session behavior
  -> notes API requires authentication
  -> notes service lists notes for req.userId only, newest first
  -> persistence returns matching notes
  -> API returns { notes }
  -> browser renders empty or populated note list
```

Failure outcomes:

- unauthenticated request is rejected before notes are listed;
- API/client failure renders a load error instead of pretending the list
  is empty.

### Create Owned Note

```text
Owner submits title/body
  -> browser posts { title, body } to POST /api/notes
  -> notes API requires authentication and validates input
  -> notes service creates a note with req.userId as owner
  -> persistence stores owner id, title, body, createdAt, updatedAt
  -> API returns 201 with the created note summary
  -> browser clears create inputs and reloads the owner's list
```

Failure outcomes:

- missing/blank/too-long title is invalid;
- too-long body is invalid;
- unauthenticated request is rejected;
- failed creation leaves the existing list intact and exposes an error.

### View Owned Note

```text
Owner needs note details
  -> API receives GET /api/notes/:id
  -> notes API requires authentication
  -> notes service looks up {_id: noteId, userId: req.userId}
  -> owned note returns as a note summary
```

Failure outcomes:

- nonexistent or not-owned note returns not found without disclosing which
  case occurred;
- unauthenticated request is rejected.

### Edit Owned Note

```text
Owner selects Edit
  -> browser copies the selected note into local edit state
  -> owner submits changed title and/or body
  -> browser sends PATCH /api/notes/:id
  -> notes API requires authentication and validates a meaningful update
  -> notes service updates {_id: noteId, userId: req.userId}
  -> persistence validators still apply
  -> API returns the updated note summary
  -> browser exits edit mode and reloads the owner's list
```

Failure outcomes:

- update with no changed field is invalid;
- invalid title/body is rejected;
- nonexistent or not-owned note returns not found;
- failed save keeps the user in control of the current edit state and
  exposes an error.

### Delete Owned Note

```text
Owner selects Delete
  -> browser sends DELETE /api/notes/:id
  -> notes API requires authentication
  -> notes service deletes one note matching {_id: noteId, userId: req.userId}
  -> API returns 204
  -> browser clears edit state for that note if needed and reloads the list
```

Failure outcomes:

- nonexistent or not-owned note returns not found;
- unauthenticated request is rejected;
- failed delete keeps the existing list visible and exposes an error.

## System Responsibilities

| Boundary / responsibility       | Design for `BACKLOG-014`                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `apps/test/web` notes page      | Presents the notes management surface only after the current-user gate has succeeded.                               |
| Browser notes experience        | Manages transient loading, create form, edit form, pending mutation, refresh, empty, and error states.              |
| `apps/test/web` notes client    | Sends same-origin `/api/notes` requests with credentials and converts API error responses into user-visible errors. |
| `servers/test/api` app boundary | Mounts notes behavior under the existing API deployable boundary.                                                   |
| Notes API boundary              | Requires authentication, validates note request payloads, emits consistent success/error responses.                 |
| Notes domain/service boundary   | Executes owner-scoped create/list/read/update/delete behavior using current-user identity.                          |
| Notes persistence boundary      | Persists owner id, title, body, and timestamps; enforces field limits as defense in depth.                          |
| Existing auth/session boundary  | Supplies authenticated current-user identity; detailed ownership-feature design remains outside this artifact.      |

## Data Flow

```text
Browser form/list/edit state
  -> notes client request payload
  -> same-origin API boundary
  -> authenticated req.userId
  -> notes service command/query
  -> Note persistence document
  -> note summary response
  -> refreshed browser note list
```

Note summary shape used by this Feature:

```text
id
title
body
createdAt
updatedAt
```

Persistent note attributes:

```text
userId
title
body
createdAt
updatedAt
```

No new data store, migration, shared package, or cross-project contract is
part of this System Design.

## Authorization / Ownership

All note management behavior requires an authenticated current user.

Owner scoping is applied by using the authenticated user's id for create,
list, read, update, and delete operations. Read/update/delete requests for
missing or not-owned notes return the same not-found outcome so the system
does not disclose another user's note existence.

This section constrains `BACKLOG-014` using the `BACKLOG-015` ownership
invariant. It does not design a new ownership Feature.

## Validation / Error Behavior

| Condition                                      | Expected behavior                                                |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Unauthenticated list/create/read/update/delete | Reject before note behavior runs.                                |
| Create with valid title and optional body      | Create note and return the created note summary.                 |
| Create with no body                            | Store and return an empty body.                                  |
| Blank or over-limit title                      | Reject as invalid input.                                         |
| Over-limit body                                | Reject as invalid input.                                         |
| List with no notes                             | Return an empty list, not an error.                              |
| Update with title and/or body                  | Update the owned note and return the updated note summary.       |
| Update with no fields                          | Reject as invalid input.                                         |
| Read/update/delete missing or not-owned note   | Return not found without data disclosure.                        |
| Successful delete                              | Remove the owned note and return no content.                     |
| Client/API failure                             | Preserve existing visible state where possible and expose error. |

## Observability / Testability

Existing evidence already exercises the core behavior through
`servers/test/api/test/domains/notes/notes.routes.test.ts`:

- unauthenticated rejection;
- create with title/body and with title only;
- validation rejection;
- owner-only list newest first;
- empty list;
- owned note read;
- not-owned read/update/delete returning not found;
- update field behavior and persistence-layer validators;
- delete and post-delete not-found behavior.

For Engineering Decomposition, frontend component/E2E coverage remains a
known separate gap under `BACKLOG-005`; it does not block this System
Design for the existing baseline.

## Non-Functional Behavior

- Security/privacy: owner scoping and no cross-user disclosure are
  baseline invariants.
- Reliability: successful mutations refresh the list so the visible state
  follows persisted state.
- Maintainability: behavior stays inside the existing project-owned
  deployables and notes domain boundary.
- Performance: no pagination or search behavior is selected; future scale
  concerns need their own lifecycle pass.
- Accessibility: this System Design does not add new accessibility scope;
  future accessibility expansion remains separate unless selected.

## Architecture Consistency Check

Result: `compatible`.

`SD-001` fits the `ARCH-001` baseline:

| `ARCH-001` baseline constraint                  | `SD-001` treatment                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| Reuse `apps/test/web` for notes experience      | Design keeps browser behavior in the existing notes surface.             |
| Reuse same-origin web/API integration           | Design uses `/api/notes` over the existing same-origin boundary.         |
| Reuse `servers/test/api` notes API/domain       | Design keeps note behavior in the existing API and notes domain/service. |
| Preserve auth and owner-scoped data access      | Design uses authenticated current-user id for all note operations.       |
| Reuse existing notes persistence                | Design uses existing note owner/title/body/timestamp persistence.        |
| Do not create new service/package/store         | Design creates no new boundary.                                          |
| Keep unrelated enhancements out of the baseline | Design excludes sibling/unselected enhancement scope.                    |

Architectural Impact: none.

No Architecture re-evaluation is required before Engineering
Decomposition for this selected Feature.

## Architectural Feedback Control

If later System Design evidence showed that `BACKLOG-014` required a new
store, new service boundary, shared contract package, ownership model
change, or replacement notes system, this artifact would become blocked
and route to controlled Architecture re-evaluation. It would not silently
edit `ARCH-001`, ADRs, or `architecture.yaml`.

No such contradiction was found for the real `BACKLOG-014` design.

## Unresolved Questions

No unresolved question blocks Engineering Decomposition for
`BACKLOG-014`.

Non-blocking concerns:

- `BACKLOG-005` still tracks frontend component/E2E coverage gaps.
- Future search, tags, sharing, export, pagination, rich text,
  attachments, reminders, collaboration, migration, documentation,
  retention, admin access, or accessibility expansion require separate
  lifecycle selection.

## Readiness

`ready-for-engineering-decomposition`.

The selected Feature has one concrete System Design, an explicit
Architecture compatibility result, requirement traceability, and bounded
sibling-feature references.

## Traceability

```text
REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-014 -> ARCH-001 -> SD-001
```

Requirement coverage:

```text
SPEC-018-R001 -> BACKLOG-014 -> SD-001 behavior / interaction flows
SPEC-018-R004 -> BACKLOG-014 -> SD-001 data flow / persistence interaction
SPEC-018-R002 -> BACKLOG-015 invariant constraining SD-001 ownership behavior
SPEC-018-R006 -> SD-001 out-of-scope duplicate-system boundary
SPEC-018-R005 -> SD-001 testability expectations and BACKLOG-005 non-blocking concern
```

Architecture constraints:

```text
ARCH-001 A001 -> existing web/API project architecture
ARCH-001 A002 -> owner isolation as auth + domain/data boundary
ARCH-001 A003 -> existing notes persistence
ARCH-001 A004 -> workspace reachability remains sibling Feature scope
```

## Lifecycle State

- Intake: complete.
- Discovery: complete.
- Specification: active and ready.
- Decomposition: complete and ready for Architecture.
- Architecture: complete.
- Selected Feature: `BACKLOG-014`.
- System Design: complete with readiness
  `ready-for-engineering-decomposition`.
- Engineering Decomposition: complete with readiness
  `ready-for-implementation` in `ENG-001`.
- Next allowed phase for `BACKLOG-014`: Implementation may be considered
  if explicitly requested.

## Boundary Check

- Product-wide System Design: not created.
- Sibling Feature design for `BACKLOG-015`: not created.
- Sibling Feature design for `BACKLOG-016`: not created.
- Engineering Decomposition: created later by Phase 7 in `ENG-001`, not
  by System Design.
- Implementation: not started.
- Engineering tasks/jobs: not created.
- API implementation: not changed.
- Database implementation: not changed.
- UI implementation: not changed.
- Application source: not changed.
- Roles/jobs/skills: not created.
- Feature registry / duplicate backlog / duplicate traceability system:
  not created.
