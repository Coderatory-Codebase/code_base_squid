---
id: ENG-001
type: engineering-decomposition
title: Manage owned personal notes engineering decomposition
status: complete
created: 2026-09-05
related:
  [
    SPEC-022,
    REQ-001,
    DISC-001,
    SPEC-018,
    DECOMP-001,
    BACKLOG-013,
    BACKLOG-014,
    BACKLOG-015,
    ARCH-001,
    SD-001,
    ADR-012,
    ADR-013,
    ADR-014,
    ADR-016,
    TRACE-029,
  ]
---

# ENG-001: Manage Owned Personal Notes Engineering Decomposition

## Selected Feature

Exactly one Feature is decomposed into engineering work:

```text
BACKLOG-014 - Manage owned personal notes
```

`BACKLOG-014` is a `PROJECT / test` backlog row with `Level: feature`,
`Kind: feature`, `Status: ready`, parent `BACKLOG-013`, source
`DECOMP-001`, dependency `BACKLOG-015`, Architecture coverage in
`ARCH-001`, and System Design coverage in `SD-001`.

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
  -> ENG-001
```

- Source requirement: `REQ-001`.
- Source Discovery: `DISC-001`, status `complete`.
- Source Specification: `SPEC-018`, status `active`, readiness
  `ready-for-decomposition`.
- Source Decomposition: `DECOMP-001`, status `complete`, readiness
  `ready-for-architecture`.
- Selected Feature: `BACKLOG-014`, "Manage owned personal notes".
- High-level Architecture baseline: `ARCH-001`, status `complete`.
- Source System Design: `SD-001`, status `complete`, readiness
  `ready-for-engineering-decomposition`.
- Governing Engineering Decomposition spec: `SPEC-022`.

## Engineering Scope

In scope for engineering work:

- preserve or align the authenticated notes page and browser notes
  experience for create, list/view, edit, delete, pending, empty, and
  error states;
- preserve or align same-origin `/api/notes` client behavior using local
  app-owned types;
- preserve or align notes API behavior for authenticated CRUD requests,
  validation, success/error responses, and mutation rate limiting;
- preserve or align notes domain/service behavior for owner-scoped
  create/list/read/update/delete;
- preserve or align persistence of owner id, title, body, `createdAt`,
  and `updatedAt`;
- preserve or extend verification coverage necessary to prove `SD-001`
  behavior when implementation executes.

Out of scope:

- product-wide engineering decomposition;
- engineering work for `BACKLOG-015` except the ownership invariant that
  constrains `BACKLOG-014`;
- engineering work for `BACKLOG-016`;
- search, tags, sharing, export, pagination, rich text, attachments,
  reminders, collaboration, migration, documentation, retention,
  deployment topology, admin access, or accessibility expansion;
- new app, server, package, persistence store, infrastructure boundary,
  shared source contract, runtime, agent role, skill, or engine;
- source-code changes in this phase.

## Existing Code Evidence

Targeted source inspection shows the notes capability already exists. The
engineering decomposition therefore describes the actual implementation
delta as preservation, validation, and gap-aware alignment rather than a
from-scratch build:

| Evidence                                                   | Relevant reality                                                                                   | Engineering implication                                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `apps/test/web/src/app/notes/page.tsx`                     | Redirects unauthenticated users before rendering `NoteList`.                                       | Web entry work must preserve the authenticated page gate.                                                                  |
| `apps/test/web/src/app/notes/note-list.tsx`                | Manages create/list/edit/delete UI state, pending mutation state, refresh, and errors.             | UI work is primarily preservation/alignment unless future verification exposes drift.                                      |
| `apps/test/web/src/lib/notes-client.ts`                    | Uses same-origin `/api/notes` requests with credentials and local note types.                      | Client work must preserve app-owned contract consumption and error propagation.                                            |
| `servers/test/api/src/domains/notes/notes.routes.ts`       | Requires auth, validates payloads, rate-limits mutations, and routes CRUD behavior.                | API work must preserve auth-first validation and consistent errors.                                                        |
| `servers/test/api/src/domains/notes/notes.service.ts`      | Uses owner-scoped queries for list/read/update/delete and note creation by user id.                | Domain work must preserve owner-scoped access at the service/data-access boundary.                                         |
| `servers/test/api/src/domains/notes/notes.model.ts`        | Persists user id, title, body, and timestamps with field limits.                                   | Persistence work must preserve durable note shape and defense-in-depth validators.                                         |
| `servers/test/api/test/domains/notes/notes.routes.test.ts` | Covers backend CRUD, validation, unauthenticated access, ownership isolation, and delete behavior. | Backend verification already covers much of `SD-001`; frontend automated coverage remains a known gap under `BACKLOG-005`. |

## Actual Delta

The current implementation already realizes the approved baseline. No
mandatory source-code delta is identified by Engineering Decomposition.

Implementation may still execute the work by inspecting the target
boundaries, preserving the existing behavior, correcting any drift found
against `SD-001`, and adding or confirming verification. If a later
implementation pass discovers missing behavior, it should make only the
smallest change inside the existing `apps/test/web` and
`servers/test/api` boundaries needed to satisfy the corresponding work
item.

No architecture change, new package, new store, new service, or duplicate
notes system is required.

## Engineering Work Items

| ID          | Target area                     | Responsibility / intended work                                                                                                                                                                                                                                                            | Existing boundary                                                                                                                            | Depends on       | Expected outcome                                                                                                     | Verification expectation                                                                                                                                        | Traceability                                                                                                    |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ENG-001-W01 | Web entry and notes experience  | Preserve the authenticated notes surface, create form, list/empty/loading/error states, edit state, delete handling, pending mutation state, and post-mutation refresh behavior described by `SD-001`. Correct only drift found against that behavior.                                    | `apps/test/web/src/app/notes/page.tsx`, `apps/test/web/src/app/notes/note-list.tsx`                                                          | none             | An authenticated owner can manage notes from the notes surface without losing visible state on failures.             | Future implementation/verification confirms unauthenticated redirect, create/list/edit/delete UI paths, pending states, empty state, and error display.         | `SPEC-018-R001`, `SPEC-018-R004`; `SD-001` Feature Behavior, Interaction Flows, System Responsibilities.        |
| ENG-001-W02 | Web/API client integration      | Preserve same-origin `/api/notes` requests with credentials, app-owned note response shape, and API error propagation. Correct only drift that would break `SD-001` request/response behavior.                                                                                            | `apps/test/web/src/lib/notes-client.ts`, `apps/test/web/next.config.ts`                                                                      | ENG-001-W01      | Browser code consumes the existing API boundary without importing server source or shared packages.                  | Future verification confirms GET/POST/PATCH/DELETE client calls use credentials, surface API errors, and keep local app-owned types.                            | `SPEC-018-R001`, `SPEC-018-R006`; `SD-001` Data Flow, System Responsibilities, Architecture Consistency Check.  |
| ENG-001-W03 | Notes API behavior              | Preserve authenticated CRUD route behavior, request validation, response shapes, not-found behavior, and mutation rate limiting for notes management. Correct only route drift against `SD-001`.                                                                                          | `servers/test/api/src/app.ts`, `servers/test/api/src/domains/notes/notes.routes.ts`, `servers/test/api/src/domains/notes/notes.contracts.ts` | ENG-001-W04      | API requests implement the approved create/list/read/update/delete behavior through the existing API deployable.     | Backend route tests prove unauthenticated rejection, validation rejection, success responses, not-found responses, and mutation behavior.                       | `SPEC-018-R001`, `SPEC-018-R005`; `SD-001` Interaction Flows, Validation / Error Behavior, Observability.       |
| ENG-001-W04 | Domain/service ownership        | Preserve owner-scoped create/list/read/update/delete service behavior using the authenticated current user id. Correct only drift that would allow cross-user disclosure or mutation.                                                                                                     | `servers/test/api/src/domains/notes/notes.service.ts`, existing auth/session middleware                                                      | none             | Notes are created for, queried by, updated by, and deleted by the authenticated owner only.                          | Backend route/service coverage proves caller-only list, owned read/update/delete, and same not-found result for missing or not-owned notes.                     | `SPEC-018-R001`, `SPEC-018-R002`, `SPEC-018-R004`; `SD-001` Authorization / Ownership and Interaction Flows.    |
| ENG-001-W05 | Notes persistence               | Preserve durable note persistence with owner id, title, body, timestamps, title/body limits, and validator behavior. Correct only schema or persistence drift that violates `SD-001`.                                                                                                     | `servers/test/api/src/domains/notes/notes.model.ts`, service persistence calls                                                               | ENG-001-W04      | Notes remain durable, owner-associated records with the summary fields expected by the Feature.                      | Persistence and route tests prove title/body limits, empty body behavior, timestamped summaries, and validator enforcement on update.                           | `SPEC-018-R004`, `SPEC-018-R005`; `SD-001` Data Flow, Validation / Error Behavior, Observability.               |
| ENG-001-W06 | Feature verification coverage   | Preserve existing backend route coverage and explicitly account for the known frontend component/E2E gap without creating a new backlog item. If a later implementation phase selects test expansion, keep it scoped to `BACKLOG-014` behavior and `BACKLOG-005`'s existing coverage gap. | `servers/test/api/test/domains/notes/notes.routes.test.ts`, future frontend test boundary if selected                                        | ENG-001-W01..W05 | Verification evidence maps every important `SD-001` behavior to backend tests, future frontend checks, or known gap. | Future verification reports backend test results and either frontend manual verification or selected frontend automated tests under existing scope.             | `SPEC-018-R005`; `SD-001` Observability / Testability, Validation / Error Behavior, Traceability.               |
| ENG-001-W07 | Integration and final readiness | Validate that the completed implementation still respects `ARCH-001`, `SD-001`, project-owned deployable boundaries, local contract ownership, and duplicate-system exclusions before marking the Feature implemented.                                                                    | Existing validation scripts, app/API boundaries, `.project/backlog/BACKLOG.md`, `.project/state/PROJECT-STATE.md`                            | ENG-001-W01..W06 | Implementation can be accepted only when behavior, boundaries, and records remain consistent.                        | Future final implementation validation includes lint/typecheck/tests/build/architecture/secrets/format and confirms `apps/`/`servers/` changes are intentional. | `SPEC-018-R006`, `SPEC-018-R007`; `ARCH-001` Constraints, `SD-001` Architecture Consistency Check and Boundary. |

## Dependencies / Sequencing

Independent work:

- `ENG-001-W01` can inspect/preserve the web notes experience
  independently.
- `ENG-001-W04` can inspect/preserve service-level ownership behavior
  independently.

Dependent work:

- `ENG-001-W02` depends on `ENG-001-W01` because client behavior must
  serve the notes experience's requested flows.
- `ENG-001-W03` depends on `ENG-001-W04` because API route behavior must
  delegate to owner-scoped domain/service access rather than duplicating
  ownership logic.
- `ENG-001-W05` depends on `ENG-001-W04` because persistence must preserve
  the owner-scoped model used by service behavior.
- `ENG-001-W06` depends on `ENG-001-W01` through `ENG-001-W05` because
  verification expectations must map to the implemented behavior.
- `ENG-001-W07` depends on all earlier work items because final readiness
  requires behavior, boundary, and verification consistency.

No contradictory dependency cycle exists.

## Affected System Areas

- `apps/test/web` notes page and notes client.
- `servers/test/api` notes route, contract, service, model, and tests.
- Existing auth/session boundary as the source of current-user identity.
- Existing `.project/backlog/BACKLOG.md` row `BACKLOG-014` as the selected
  Feature record.

No new top-level boundary, package, runtime, contract system, or
orchestration area is affected.

## Verification Expectations

| `SD-001` behavior / responsibility | Future verification expectation                                                                                       | Engineering work    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Authenticated notes page gate      | Confirm unauthenticated web access redirects before note behavior and authenticated access renders the notes surface. | ENG-001-W01         |
| Load/list owned notes              | Confirm `GET /api/notes` rejects unauthenticated callers and lists only the current user's notes newest first.        | ENG-001-W03/W04     |
| Create owned note                  | Confirm valid title/body creates an owner-associated note and invalid title/body is rejected.                         | ENG-001-W01/W03/W05 |
| View owned note                    | Confirm owned note read succeeds and missing/not-owned read returns not found without disclosure.                     | ENG-001-W03/W04     |
| Edit owned note                    | Confirm valid title/body updates succeed and empty/invalid updates are rejected.                                      | ENG-001-W01/W03/W05 |
| Delete owned note                  | Confirm owned delete returns no content, later read is not found, and not-owned delete does not remove another note.  | ENG-001-W01/W03/W04 |
| Client failure/error behavior      | Confirm API/client failures surface errors and preserve visible state where possible.                                 | ENG-001-W01/W02     |
| Local contract ownership           | Confirm web keeps local consumed types and does not import server source or create a shared package.                  | ENG-001-W02/W07     |
| Architecture boundary preservation | Confirm no new app/server/package/store/service/contract boundary is introduced for the baseline.                     | ENG-001-W07         |

## Acceptance Relationship

`ENG-001` is complete only if the engineering work represents every
implementable responsibility required by `SD-001` for `BACKLOG-014`:

```text
SPEC-018-R001 -> SD-001 CRUD behavior -> ENG-001-W01/W02/W03/W04
SPEC-018-R002 -> SD-001 ownership invariant -> ENG-001-W04/W07
SPEC-018-R004 -> SD-001 durability/data flow -> ENG-001-W03/W05
SPEC-018-R005 -> SD-001 testability expectations -> ENG-001-W06/W07
SPEC-018-R006 -> SD-001 duplicate-system boundary -> ENG-001-W02/W07
SPEC-018-R007 -> SD-001 traceability -> ENG-001-W06/W07
```

`SPEC-018-R003` belongs to sibling Feature `BACKLOG-016`; it constrains
the surrounding product experience but does not create engineering work
inside `ENG-001`.

## Architecture Consistency Check

Result: `compatible`.

`ENG-001` fits the `ARCH-001` and `SD-001` baseline:

| Baseline constraint                             | Engineering treatment                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| Reuse `apps/test/web` for notes experience      | Work items use the existing notes page, component, and client boundaries.   |
| Reuse same-origin web/API integration           | Work items preserve `/api/notes` client calls and Next.js proxy behavior.   |
| Reuse `servers/test/api` notes API/domain       | Work items use existing notes route, contracts, service, and model.         |
| Preserve auth and owner-scoped data access      | Work items keep auth-first route handling and service owner filters.        |
| Reuse existing notes persistence                | Work items preserve the current note document shape and validators.         |
| Do not create new service/package/store         | No work item requires a new reusable package, service, store, or contract.  |
| Keep unrelated enhancements out of the baseline | No work item covers search, tags, sharing, export, pagination, or siblings. |

Architectural Impact: none.

No Architecture or System Design re-evaluation is required before
Implementation for `BACKLOG-014`.

## Readiness

`ready-for-implementation`.

The selected Feature is valid, System Design is complete, architectural
impact is resolved as none, executable engineering work items cover the
approved responsibilities, dependencies are explicit, verification
expectations are represented, and traceability is intact.

## Traceability

```text
REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-014 -> ARCH-001 -> SD-001 -> ENG-001
```

System Design to Engineering Work:

```text
SD-001 Feature Behavior -> ENG-001-W01/W02/W03/W04/W05
SD-001 Interaction Flows -> ENG-001-W01/W02/W03/W04
SD-001 System Responsibilities -> ENG-001-W01/W02/W03/W04/W05
SD-001 Data Flow -> ENG-001-W02/W03/W05
SD-001 Authorization / Ownership -> ENG-001-W03/W04/W07
SD-001 Validation / Error Behavior -> ENG-001-W01/W03/W05/W06
SD-001 Observability / Testability -> ENG-001-W06/W07
SD-001 Architecture Consistency Check -> ENG-001-W07
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
  `ready-for-implementation`.
- Next allowed phase for `BACKLOG-014`: Implementation may be considered
  if explicitly requested.

## Boundary Check

- Product-wide Engineering Decomposition: not created.
- Sibling Feature decomposition for `BACKLOG-015`: not created.
- Sibling Feature decomposition for `BACKLOG-016`: not created.
- Implementation: not started.
- Verification: not executed.
- Review: not executed.
- Delivery: not executed.
- Engineering tasks/jobs: not created.
- `TASK-*`: not created.
- API implementation: not changed.
- Database implementation: not changed.
- UI implementation: not changed.
- Application source: not changed.
- Architecture: not silently changed.
- System Design: not silently changed.
- Roles/jobs/skills: not created.
- Feature registry / duplicate backlog / duplicate contract /
  duplicate traceability system: not created.
- Runtime / orchestration / agent framework: not created.
