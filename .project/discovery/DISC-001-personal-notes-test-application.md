---
id: DISC-001
type: discovery
title: Personal notes in the test application
status: complete
created: 2026-09-05
updated: 2026-09-05
related: [REQ-001, TRACE-021, TRACE-022, TRACE-024, PLAN-011, PROJECT-test, TRACE-014]
---

# DISC-001: Personal Notes in the Test Application

## Source Requirement

- Requirement: `REQ-001`.
- Intake trace: `TRACE-019`.

## Original Request

Add personal notes functionality to the test application.

## Rework History

### Initial Discovery Outcome

`DISC-001` originally ended with status `needs-clarification`. Discovery
found that personal notes already existed in the seed app, while the
Intake request did not say whether the desired outcome was enhancement,
verification, rebuild, migration, documentation, or lifecycle
demonstration.

That original blocked understanding is preserved here because it is the
reason Specification initially produced a draft `SPEC-018` and blocked
Decomposition.

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

Return point: Discovery.

Reason: the clarification changes Discovery-level understanding of the
desired outcome and gap. Specification must not become the only source for
that new fact.

## Route

`PROJECT` / `SEED_APP`.

The request names the test application. Discovery therefore loads the
repository/foundation brain first, then the `test` project/product brain.

## Discovery Jobs Used

- Repository/context investigation.
- Requirements clarification.
- Dependency investigation.
- Risk/constraint investigation.

No implementation tasks were created.

## Problem Understanding

The request concerns note-taking functionality in the seed `test`
application. After clarification, Discovery understands this as an
improvement/preservation pass over the existing personal-notes capability,
not as a request to create a duplicate notes system.

## Desired Outcome

The user wants the existing personal-notes capability in the test
application treated as the product baseline to improve and preserve. The
clarification resolves the original duplicate-scope ambiguity without
adding search, tags, sharing, export, pagination, rich text, attachments,
reminders, collaboration, migration, or documentation scope.

## Actors

- Fact: the current seed app has authenticated users.
- Clarified fact: the active actor is the authenticated owner of personal
  notes.
- Out of scope from this clarification: anonymous notes, shared notes,
  admin-managed notes, or another actor model.

## Lens Selection

| Lens                     | Applicability | Reason                                                                                       |
| ------------------------ | ------------- | -------------------------------------------------------------------------------------------- |
| Business / Product       | High          | The request states a desired product capability but not the user outcome or success meaning. |
| UX / User Experience     | High          | Notes are user-facing, and the current app already has notes and dashboard navigation UI.    |
| Security                 | High          | "Personal notes" implies ownership/access boundaries; existing notes routes require auth.    |
| QA / Quality             | High          | Existing behavior and tests must be understood before deciding whether anything is missing.  |
| Technical / Engineering  | High          | The request targets an existing MERN/Next.js seed app with API, data, and frontend patterns. |
| Data                     | High          | Existing notes persistence and field model are directly relevant.                            |
| Privacy                  | High          | Personal user content may be sensitive even though no compliance need is established.        |
| Accessibility            | Medium        | The existing notes UI is form/list based; accessibility matters if future UI changes occur.  |
| Integration              | Medium        | The feature crosses web, API, auth/session, and persistence boundaries.                      |
| Performance              | Low           | No scale, volume, or latency requirement was supplied; keep as non-selected unless surfaced. |
| Operations/Observability | Low           | No operational requirement or incident context was supplied.                                 |
| Compliance/Legal/Cost    | Low           | No regulated domain, external service, or cost-bearing dependency was supplied.              |

Low-applicability lenses were not expanded because no evidence makes them
material for this request yet.

## Lens Findings

### Business / Product

- Finding: the named capability appears already present, and the clarified
  product intent is to improve/preserve that existing capability rather
  than create another notes system.
- Evidence: `PROJECT-test` lists personal notes as a current capability.
- Implication: downstream Specification may define requirements for the
  existing authenticated-owner baseline, but may not invent additional
  enhancements.
- Open question: which future enhancement, if any, should be selected
  after the baseline is specified?

### UX / User Experience

- Finding: users can discover notes from the dashboard and reach a notes
  page.
- Evidence: `apps/test/web/src/app/dashboard/page.tsx` links to `/notes`;
  `apps/test/web/src/app/notes/page.tsx` renders `NoteList`.
- Implication: dashboard discoverability is part of the clarified baseline
  to preserve.
- Open question: no additional UX enhancement has been selected.

### Security

- Finding: the existing notes API is authenticated, and route tests cover
  unauthenticated rejection and ownership isolation.
- Evidence: `notesRouter.use(requireAuth)` in
  `servers/test/api/src/domains/notes/notes.routes.ts`; cross-user tests
  in `servers/test/api/test/domains/notes/notes.routes.test.ts`.
- Implication: authenticated-owner privacy is part of the clarified
  baseline to preserve.
- Open question: no sharing or cross-user access model has been selected.

### QA / Quality

- Finding: route-level tests already exercise create/list/read/update/
  delete, validation, unauthenticated access, and cross-user isolation.
- Evidence: `servers/test/api/test/domains/notes/notes.routes.test.ts`.
- Implication: existing route-level behavior and ownership tests form the
  current quality baseline to preserve.
- Open question: no additional frontend/E2E quality bar has been selected.

### Technical / Engineering

- Finding: the existing implementation already spans the expected web/API/
  persistence boundaries.
- Evidence: `/notes` page and client in `apps/test/web`; `notesRouter`,
  contracts, service, and model in `servers/test/api/src/domains/notes`.
- Implication: the needed capability is `reuse` plus focused
  improvement/preservation, not `create`.
- Open question: no technical replacement or migration has been selected.

### Data / Privacy

- Finding: notes are persisted with `userId`, `title`, `body`, and
  timestamps.
- Evidence: `servers/test/api/src/domains/notes/notes.model.ts`.
- Implication: persisted owner-scoped note content is part of the
  clarified baseline to preserve.
- Open question: no retention, export, or additional field requirement has
  been selected.

## Existing Context

- The repository is an agent-native MERN/Next.js foundation with a seed
  project under `apps/test/web` and `servers/test/api`.
- The `test` project already records "Personal notes: create, view, edit,
  delete notes scoped to the authenticated owner" as a current capability.
- The API app mounts `notesRouter` at `/api/notes`.
- `notesRouter` requires authentication for all notes routes.
- The web app has a `/notes` page that redirects unauthenticated users to
  `/login`.
- The web client calls `/api/notes` using same-origin credentials.
- The notes domain currently uses a Mongoose `Note` model with `userId`,
  `title`, `body`, and timestamps.
- Existing route tests cover create/list/read/update/delete behavior,
  unauthenticated rejection, validation, and cross-user isolation.

## Current State

- Existing capability: personal notes are already present in the seed app.
- Existing UX: dashboard navigation points to `/notes`; `/notes` renders a
  create/list/edit/delete-oriented notes UI.
- Existing API: `/api/notes` routes are mounted by the Express app.
- Existing authorization: notes routes require authentication.
- Existing persistence: notes are stored through a Mongoose model.
- Existing QA: backend route tests cover main notes behavior and ownership
  isolation.
- Existing constraints: deployables stay project-owned under
  `apps/test/web` and `servers/test/api`; app and API do not share source
  contracts directly.

## Known Requirements

- The Intake request asks for personal notes functionality in the test
  application.
- The clarification establishes that the existing personal-notes capability
  should be improved/preserved rather than duplicated.
- The clarification establishes the authenticated-owner personal-notes
  model as the baseline for this work.
- The clarification explicitly excludes additional enhancement families
  such as search, tags, sharing, export, pagination, rich text,
  attachments, reminders, collaboration, migration, and documentation.
- Existing project memory and source code already contain a notes
  capability matching a common interpretation of that phrase.

## Gap / Capability Analysis

```text
Desired outcome:
  Improve and preserve the existing personal notes functionality in the
  test application without creating a duplicate notes system.

Current state:
  Personal notes already exist in the test application with web UI, API,
  authentication, persistence, dashboard navigation, and backend tests.

Gap:
  The original request lacked intent. The clarification resolves the
  duplicate-system ambiguity and selects the existing authenticated-owner
  notes model as the baseline, but does not select any additional feature
  enhancement.

Needed capability:
  Reuse/preserve the existing capability and specify the baseline
  requirements; defer any additional enhancement until separately
  clarified.
```

| Need Type   | Discovery Result                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Reuse       | Existing notes UI/API/model/tests are the selected baseline.                                   |
| Modify      | Possible later, but no concrete modification is established by this clarification.             |
| Create      | No duplicate notes capability is authorized.                                                   |
| Remove      | No conflicting existing capability is evidenced.                                               |
| Integrate   | Existing integration already crosses dashboard, `/notes`, `/api/notes`, auth, and persistence. |
| Decide      | Resolved for baseline scope; still required for any additional enhancement.                    |
| Investigate | Not required before baseline Specification; required later if a new enhancement is selected.   |

## Existing Capabilities

- Authenticated users.
- Dashboard navigation to notes.
- Notes page and client-side note interactions.
- Express notes API.
- Mongoose notes persistence.
- Per-user ownership boundary.
- Backend tests for notes behavior.

## Missing Capabilities

- No missing notes capability is established by current evidence.
- Missing future-selection detail: no specific additional enhancement has
  been chosen.
- No missing baseline capability is established after clarification.

## Needed Capabilities / Changes

- `reuse`: preserve the existing notes capability as the selected baseline.
- `specify`: allow Specification to define the baseline requirements now
  supported by clarified Discovery.
- `decide` / `investigate`: only for future additional enhancements.
- `create`: explicitly not authorized for a duplicate notes system.

## Facts

- `REQ-001` preserves the original request: "Add personal notes
  functionality to the test application."
- `PROJECT-test` says the seed project owns `apps/test/web` and
  `servers/test/api`.
- `PROJECT-test` lists personal notes as an existing product capability.
- `servers/test/api/src/app.ts` mounts `notesRouter` at `/api/notes`.
- `servers/test/api/src/domains/notes/notes.routes.ts` applies
  `requireAuth` to the notes router.
- `apps/test/web/src/app/dashboard/page.tsx` links to `/notes`.
- `apps/test/web/src/app/notes/page.tsx` redirects unauthenticated users
  to `/login`.
- `apps/test/web/src/lib/notes-client.ts` calls `/api/notes` with
  `credentials: "include"`.
- `servers/test/api/src/domains/notes/notes.model.ts` defines persisted
  note fields using Mongoose.
- `servers/test/api/test/domains/notes/notes.routes.test.ts` contains
  notes route tests for authentication, validation, CRUD-like behavior,
  and ownership isolation.

## Inferences

- The request is probably not a greenfield feature request against the
  current repository state, because relevant note-taking UI, API, model,
  and tests already exist.
- The next Specification phase should not specify a new notes system. It
  can specify the existing authenticated-owner baseline and keep additional
  enhancements inactive.
- The existing system likely satisfies the literal wording of `REQ-001`;
  the clarified outcome turns that current state into upstream evidence for
  a baseline Specification, not into implementation instructions.

## Assumptions

- No additional enhancement beyond the clarified baseline is assumed.

## Unknowns

- Which future enhancement, if any, should be selected after the baseline.
- Whether a future request should add frontend/E2E coverage beyond the
  current backend route-level coverage.
- Whether future search, tags, sharing, export, pagination, rich text,
  attachments, reminders, collaboration, migration, or documentation work
  should be requested separately.

## Dependencies

- Existing `test` project memory and deployables.
- Existing authentication/session behavior.
- Existing same-origin `/api/**` proxy behavior.
- Existing notes domain files and route tests.
- Existing dashboard navigation.
- Existing architecture decisions `ADR-012`, `ADR-013`, `ADR-014`, and
  `ADR-016`.

## Risks

- Duplicate-spec risk: Specification could accidentally define a feature
  that already exists.
- Scope-expansion risk: Discovery facts about existing CRUD, MongoDB,
  title/body fields, and authentication could be mistaken for newly
  approved requirements.
- Product-ambiguity risk: without clarification, a future spec may solve
  the wrong problem.
- Privacy/security risk: personal-note ownership and access model must stay
  explicit if future changes are requested.
- Evidence-timing risk: later implementation knowledge must not be
  presented as pre-implementation discovery for a different request; this
  artifact explicitly references current repository state as of
  2026-09-05.

## Decisions Needed

- No decision blocks baseline Specification after the clarification in
  `TRACE-024`.
- A future decision is still required before selecting any additional
  enhancement beyond the baseline.

## Contradictions

- The Intake request says to add personal notes functionality.
- The current repository evidence shows personal notes functionality is
  already present in the seed app.
- Resolution: the clarification says to improve/preserve the existing
  capability rather than create a duplicate notes system.

## Open Questions

- Which future enhancement, if any, should be selected after the baseline
  is specified?
- Should future work add frontend/E2E coverage beyond the current
  route-level test baseline?

## Evidence

| Finding                            | Evidence                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Intake source exists               | `.project/requirements/REQ-001-add-personal-notes-functionality-to-the-test-application.md` |
| Project owns app/API               | `.project/projects/test/PROJECT.md`                                                         |
| Notes listed as current capability | `.project/projects/test/PROJECT.md`                                                         |
| API mounts notes routes            | `servers/test/api/src/app.ts`                                                               |
| Notes routes require auth          | `servers/test/api/src/domains/notes/notes.routes.ts`                                        |
| Dashboard links to notes           | `apps/test/web/src/app/dashboard/page.tsx`                                                  |
| Web notes page requires auth       | `apps/test/web/src/app/notes/page.tsx`                                                      |
| Web client uses `/api/notes`       | `apps/test/web/src/lib/notes-client.ts`                                                     |
| Note persistence exists            | `servers/test/api/src/domains/notes/notes.model.ts`                                         |
| Note contracts exist               | `servers/test/api/src/domains/notes/notes.contracts.ts`                                     |
| Notes behavior is tested           | `servers/test/api/test/domains/notes/notes.routes.test.ts`                                  |
| Historical implementation trace    | `.project/traces/TRACE-014-personal-notes.md`                                               |

## Synthesis

Discovery now understands the request well enough to avoid a false
greenfield Specification: the requested outcome names personal notes in the
test application, and the current repository already contains a
substantially matching capability. The initial gap was missing intent about
the desired delta from the current product. The clarification resolves that
gap for baseline scope: reuse and preserve the existing authenticated-owner
notes capability, and do not create a duplicate system or silently activate
additional enhancements.

## Conclusion

Discovery is complete enough to proceed to a ready baseline Specification.
The initial `needs-clarification` result remains preserved in Rework
History; the current Discovery status is `complete` because the clarified
intent is now represented upstream.

## Lifecycle State

- Intake: complete.
- Discovery: reworked and complete after clarification.
- Next allowed phase: `specification`.

## Boundary Check

- Specification: not created.
- Decomposition: not created.
- Architecture: not created.
- Implementation: not started.
- Tasks: not created.
