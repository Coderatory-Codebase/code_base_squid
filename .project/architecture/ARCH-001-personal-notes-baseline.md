---
id: ARCH-001
type: architecture
title: Personal notes baseline architecture
status: complete
created: 2026-09-05
related:
  [
    SPEC-020,
    DISC-001,
    SPEC-018,
    DECOMP-001,
    REQ-001,
    BACKLOG-013,
    BACKLOG-014,
    BACKLOG-015,
    BACKLOG-016,
    ADR-012,
    ADR-013,
    ADR-014,
    ADR-016,
    TRACE-027,
  ]
---

# ARCH-001: Personal Notes Baseline Architecture

## Inputs

```text
REQ-001
  -> DISC-001
  -> SPEC-018
  -> DECOMP-001
  -> BACKLOG-013 / BACKLOG-014 / BACKLOG-015 / BACKLOG-016
  -> ARCH-001
```

- Discovery: `DISC-001`, status `complete`.
- Specification: `SPEC-018`, status `active`, readiness
  `ready-for-decomposition`.
- Decomposition: `DECOMP-001`, status `complete`, readiness
  `ready-for-architecture`.
- Backlog product units: `BACKLOG-013` epic and `BACKLOG-014` through
  `BACKLOG-016` Features, all `PROJECT / test` and `ready`.
- Governing Architecture spec: `SPEC-020`.

## Architecture Readiness

`ready-for-feature-system-design`.

The approved Feature structure has enough high-level architectural
treatment for one selected Feature to enter System Design. This does not
authorize Engineering Decomposition, implementation, engineering tasks, or
application source changes.

## Context

Product outcome: preserve and improve the existing authenticated-owner
personal notes baseline in the `test` seed application without creating a
duplicate notes system or selecting unrelated enhancements.

Features being architected:

- `BACKLOG-014`: Manage owned personal notes.
- `BACKLOG-015`: Protect personal note ownership.
- `BACKLOG-016`: Reach personal notes from the authenticated workspace.

## Current State

Discovery and targeted source inspection show the following existing
architecture:

| Evidence                                                   | Current technical reality                                                                                       | Architectural implication                                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `DISC-001` + `PROJECT-test`                                | The seed project owns `apps/test/web` and `servers/test/api`.                                                   | Personal notes remain project-owned; no repo-level package boundary is justified.                      |
| `apps/test/web/src/app/dashboard/page.tsx`                 | The authenticated dashboard links users to notes.                                                               | Workspace reachability already has a web-app entry point.                                              |
| `apps/test/web/src/app/notes/page.tsx`                     | The notes page requires an authenticated current user before rendering notes.                                   | Web access participates in the authenticated workspace boundary.                                       |
| `apps/test/web/src/lib/notes-client.ts`                    | The web client uses same-origin calls to the notes API and local app-owned types.                               | The web/API integration follows `ADR-012`; shared contracts are not currently required.                |
| `servers/test/api/src/app.ts`                              | The API app mounts the notes router beside existing auth routes.                                                | Notes already live inside the existing API deployable.                                                 |
| `servers/test/api/src/domains/notes/notes.routes.ts`       | Notes routes require authentication and delegate note operations to the notes service.                          | The API boundary already coordinates authentication, validation, and domain access.                    |
| `servers/test/api/src/domains/notes/notes.service.ts`      | Service functions query by note id plus owner id for read/update/delete and list by owner.                      | Ownership isolation is enforced at the domain/data-access boundary.                                    |
| `servers/test/api/src/domains/notes/notes.model.ts`        | Notes are persisted with owner identity, title, body, and timestamps.                                           | Existing persistence supports the durable personal-notes baseline.                                     |
| `servers/test/api/test/domains/notes/notes.routes.test.ts` | Route tests cover authenticated behavior, validation, create/list/read/update/delete, and cross-user isolation. | The current quality baseline is evidence-backed; frontend/E2E expansion remains separate tracked work. |

## Target State

Reuse the existing project-owned two-deployable architecture:

```text
apps/test/web
  -> authenticated workspace and notes user experience
  -> same-origin API integration

servers/test/api
  -> notes API boundary
  -> notes domain/service boundary
  -> authentication and ownership enforcement
  -> notes persistence boundary
```

No new application, server, package, persistence store, infrastructure
boundary, or shared contract boundary is justified for the clarified
baseline. Architecture should preserve the existing notes capability and
keep future enhancements out of scope until a later lifecycle pass selects
them.

## Boundaries

| Boundary                       | Architectural responsibility                                                    | Status for this scope                                                    |
| ------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Project ownership              | `test` owns the personal-notes product work and its app/API deployables.        | Reuse existing `PROJECT / test` boundary.                                |
| Web application                | Authenticated workspace entry and notes interaction surface.                    | Reuse existing `apps/test/web` boundary.                                 |
| API deployable                 | Browser-facing notes operations behind the existing app/API split.              | Reuse existing `servers/test/api` boundary.                              |
| Notes domain                   | Notes-specific product behavior and owner-scoped access.                        | Reuse existing `servers/test/api` notes domain boundary.                 |
| Authentication / authorization | Current user identity and access protection.                                    | Reuse existing auth/session boundary.                                    |
| Data ownership                 | Notes remain owned by their authenticated user.                                 | Reuse existing note persistence ownership model.                         |
| Integration                    | Web talks to API through the existing same-origin proxy pattern from `ADR-012`. | Reuse existing integration pattern.                                      |
| Package reuse                  | No cross-project or cross-deployable reuse pressure exists.                     | Do not create `packages/`.                                               |
| Runtime / deployment           | No production topology is selected by this scope.                               | Keep deployment topology unresolved; not blocking baseline architecture. |

## Feature Mapping

| Product Feature                                                     | Architectural treatment                                                                                                                                                           |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BACKLOG-014` Manage owned personal notes                           | Realized by the existing web notes experience, same-origin web/API integration, notes API boundary, notes domain service, and notes persistence. Depends on ownership protection. |
| `BACKLOG-015` Protect personal note ownership                       | Realized by the existing authentication boundary plus owner-scoped domain/data-access responsibility in the notes service and persistence model.                                  |
| `BACKLOG-016` Reach personal notes from the authenticated workspace | Realized by the existing authenticated dashboard and notes page boundary in the web app; related to, but not technically identical with, the management feature.                  |

The mapping is intentionally not one-to-one. `BACKLOG-014` crosses web,
API, domain, and data boundaries. `BACKLOG-014` and `BACKLOG-015` both use
the existing notes API/domain/persistence architecture. No technical
component is created merely because a Feature exists.

## Decisions

### A001 - Reuse the Existing Web/API Project Architecture

Decision: keep personal notes inside the existing `apps/test/web` and
`servers/test/api` project-owned architecture.

Context: `SPEC-018` requires preserving the existing authenticated-owner
baseline, and `DECOMP-001` produced Features for that baseline.

Evidence: `DISC-001`, `ADR-012`, `ADR-013`, `PROJECT-test`, and targeted
source inspection show an existing web/API implementation.

Options considered:

- Reuse the existing architecture.
- Create a second notes application or API.
- Extract shared notes code or contracts into `packages/`.

Selected approach: reuse existing architecture.

Rationale: the existing architecture already supports the approved
Features; new boundaries would duplicate scope and contradict
`SPEC-018-R006`.

Consequences: Feature-scoped System Design, if requested later, should
design against existing project-owned boundaries rather than a new service
or package.

Affected Features: `BACKLOG-014`, `BACKLOG-015`, `BACKLOG-016`.

Affected boundaries: `apps/test/web`, `servers/test/api`, project
ownership, package boundary.

Unresolved risks/questions: none blocking for the clarified baseline.

### A002 - Preserve Owner Isolation at the Auth and Domain/Data Boundary

Decision: treat ownership isolation as an architectural security boundary
spanning authentication and owner-scoped note access.

Context: `SPEC-018-R002` requires that users must not receive, edit, or
delete another user's note.

Evidence: `DISC-001` and source inspection show authenticated notes routes
and owner-scoped note service access.

Options considered:

- Preserve the current auth plus owner-scoped data-access boundary.
- Introduce a new authorization service or sharing model.

Selected approach: preserve the current boundary.

Rationale: the approved scope is private personal notes, not shared notes,
admin notes, or a new access model.

Consequences: Later System Design and Engineering Decomposition must
preserve owner-scoped access as a baseline invariant.

Affected Features: `BACKLOG-014`, `BACKLOG-015`.

Affected boundaries: authentication/session, notes API, notes domain,
notes persistence.

Unresolved risks/questions: future sharing or admin access would require a
new Intake/Discovery/Specification path.

### A003 - Reuse Existing Notes Persistence

Decision: keep personal-note persistence in the existing notes persistence
boundary.

Context: `SPEC-018-R004` requires durable owner-associated notes across
ordinary authenticated use.

Evidence: `DISC-001` and source inspection show existing persisted notes
with owner identity and timestamps.

Options considered:

- Reuse existing persistence.
- Introduce a new store, migration, or replacement model.

Selected approach: reuse existing persistence.

Rationale: no approved requirement needs a new persistence architecture;
replacement or migration is explicitly outside the clarified scope.

Consequences: Later System Design and Engineering Decomposition should
preserve data ownership and durability without introducing a new store.

Affected Features: `BACKLOG-014`, `BACKLOG-015`.

Affected boundaries: notes domain and persistence.

Unresolved risks/questions: retention, export, search, tags, and
collaboration remain unselected future product concerns.

### A004 - Keep Workspace Reachability in the Existing Web Boundary

Decision: realize notes reachability through the existing authenticated web
workspace boundary.

Context: `SPEC-018-R003` requires authenticated users to discover and
reach personal notes from dashboard-level navigation.

Evidence: `DISC-001` and targeted source inspection show existing
dashboard-to-notes reachability and authenticated page handling.

Options considered:

- Reuse existing authenticated workspace navigation.
- Create a new frontend surface or redesign the dashboard.

Selected approach: reuse existing web boundary.

Rationale: reachability is already supported; no visual redesign or new
front-end architecture is required by the Specification.

Consequences: Later System Design, if any, should preserve the
authenticated workspace entry rather than inventing a new surface.

Affected Features: `BACKLOG-016`.

Affected boundaries: `apps/test/web` authenticated workspace.

Unresolved risks/questions: expanded accessibility or frontend/E2E quality
bars remain separate future scope unless selected.

## Trade-Offs

| Trade-off                    | Resolution                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse vs. new construction   | Reuse wins. Existing architecture satisfies the clarified baseline; new construction would duplicate scope.                                       |
| Coupling vs. isolation       | Preserve current deployable isolation: web and API communicate over the existing HTTP boundary without shared source contracts.                   |
| Simplicity vs. extensibility | Simplicity wins for baseline preservation. Future enhancements can add architecture only when selected.                                           |
| Security vs. convenience     | Security boundary remains explicit: owner isolation is not optional convenience behavior.                                                         |
| Frontend quality vs. scope   | Existing backend route coverage supports the baseline. Frontend/E2E expansion is already tracked separately and does not block this architecture. |

## Constraints

- Preserve `SPEC-018-R006`: do not create a duplicate notes system.
- Preserve project-owned deployable boundaries from `ADR-013`.
- Preserve dual operating scope from `ADR-016`.
- Preserve same-origin web/API integration and local contract ownership
  from `ADR-012` unless a future decision changes it.
- Preserve the clarification traceability from `SPEC-018-R007`.
- Keep inactive candidate enhancements out of this architecture.

## Risks / Open Decisions

- `BACKLOG-009` remains an unresolved deployment/topology concern for
  proxy-aware client-IP handling. It does not block the personal-notes
  baseline architecture.
- `BACKLOG-005` remains the tracked frontend component/E2E test coverage
  gap. It does not block Architecture for the clarified baseline.
- Future search, tags, sharing, export, pagination, rich text,
  attachments, reminders, collaboration, migration, documentation,
  retention, or admin access would require a new lifecycle pass.

No open architectural decision blocks Feature-scoped System Design for the
clarified baseline.

## Downstream Handoff

Feature-scoped System Design may use this information if explicitly
requested later:

- work against the existing `test` project-owned web/API boundaries;
- preserve the notes domain and persistence ownership model;
- preserve owner isolation as a security invariant;
- preserve authenticated workspace reachability;
- avoid duplicate notes systems, new packages, new services, and
  unselected enhancements.

This is not a System Design artifact, implementation plan, or task
decomposition.

## Traceability

```text
DISC-001 -> SPEC-018 -> DECOMP-001 -> ARCH-001
```

Feature-to-architecture mapping:

```text
BACKLOG-014 -> web notes experience + notes API + notes domain + persistence
BACKLOG-015 -> auth/session boundary + owner-scoped domain/data access
BACKLOG-016 -> authenticated workspace + notes page reachability
```

## Lifecycle State

- Intake: complete.
- Discovery: complete.
- Specification: active and ready.
- Decomposition: complete and ready for Architecture.
- Architecture: complete with readiness `ready-for-feature-system-design`.
- System Design for `BACKLOG-014`: created later by Phase 6 in `SD-001`.
- Engineering Decomposition for `BACKLOG-014`: created later by Phase 7
  in `ENG-001`.
- Next allowed phase for `BACKLOG-014`: Implementation may be considered
  if explicitly requested.

## Boundary Check

- System Design for `BACKLOG-014`: created later by Phase 6 in `SD-001`,
  not by Architecture.
- Engineering Decomposition for `BACKLOG-014`: created later by Phase 7
  in `ENG-001`, not by Architecture.
- Implementation Planning: not created.
- Implementation: not started.
- Jobs/job contracts: not created.
- API implementation: not created.
- Database implementation: not created.
- UI implementation: not created.
- Application source: not changed.
- Roles/jobs/skills: not created.
- Duplicate architecture/backlog/state/contract/traceability framework:
  not created.
