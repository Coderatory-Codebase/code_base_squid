---
id: DISC-001
type: discovery
title: Personal notes in the test application
status: needs-clarification
created: 2026-09-05
related: [REQ-001, TRACE-021, TRACE-022, PLAN-011, PROJECT-test, TRACE-014]
---

# DISC-001: Personal Notes in the Test Application

## Source Requirement

- Requirement: `REQ-001`.
- Intake trace: `TRACE-019`.

## Original Request

Add personal notes functionality to the test application.

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

The request appears to concern note-taking functionality in the seed
`test` application. Discovery cannot yet determine whether the requester
means a new capability, an enhancement, validation of an existing
capability, or a fresh example requirement for the lifecycle model.

## Desired Outcome

The user wants personal notes functionality added to the test application.
The desired outcome is preserved from Intake; Discovery does not rewrite it
into a specification.

## Actors

- Fact: the current seed app has authenticated users.
- Inference: the affected actor may be an authenticated user of the test
  app, because the existing notes implementation is guarded by
  authentication.
- Unknown: whether the new request intends authenticated-user notes,
  anonymous notes, shared notes, admin-managed notes, or another actor.

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

- Finding: the named capability appears already present, so the product
  gap is not yet established.
- Evidence: `PROJECT-test` lists personal notes as a current capability.
- Implication: downstream Specification needs clarified intent before it
  defines new requirements.
- Open question: is the desired outcome an enhancement, verification,
  rebuild, migration, documentation update, or lifecycle demonstration?

### UX / User Experience

- Finding: users can discover notes from the dashboard and reach a notes
  page.
- Evidence: `apps/test/web/src/app/dashboard/page.tsx` links to `/notes`;
  `apps/test/web/src/app/notes/page.tsx` renders `NoteList`.
- Implication: Discovery does not currently show a missing basic entry
  point, though future UX requirements remain unknown.
- Open question: is the existing create/list/edit/delete page sufficient
  for the intended user workflow?

### Security

- Finding: the existing notes API is authenticated, and route tests cover
  unauthenticated rejection and ownership isolation.
- Evidence: `notesRouter.use(requireAuth)` in
  `servers/test/api/src/domains/notes/notes.routes.ts`; cross-user tests
  in `servers/test/api/test/domains/notes/notes.routes.test.ts`.
- Implication: security work should likely reuse or verify the existing
  ownership model rather than define a new one blindly.
- Open question: is authenticated-owner privacy the desired product model?

### QA / Quality

- Finding: route-level tests already exercise create/list/read/update/
  delete, validation, unauthenticated access, and cross-user isolation.
- Evidence: `servers/test/api/test/domains/notes/notes.routes.test.ts`.
- Implication: a future spec should decide whether to audit existing
  coverage or add missing frontend/E2E coverage, not duplicate backend
  behavior by default.
- Open question: what quality bar is expected for this request?

### Technical / Engineering

- Finding: the existing implementation already spans the expected web/API/
  persistence boundaries.
- Evidence: `/notes` page and client in `apps/test/web`; `notesRouter`,
  contracts, service, and model in `servers/test/api/src/domains/notes`.
- Implication: the likely capability classification is `reuse` plus
  `decide`/`investigate`, not immediate `create`.
- Open question: should future work modify the current implementation or
  treat it as satisfactory?

### Data / Privacy

- Finding: notes are persisted with `userId`, `title`, `body`, and
  timestamps.
- Evidence: `servers/test/api/src/domains/notes/notes.model.ts`.
- Implication: data ownership exists in the current system, but Discovery
  cannot promote current fields into required future product requirements
  without Specification.
- Open question: are fields, retention, deletion, privacy, or export
  requirements missing?

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
- No additional product behavior is established by the Intake request.
- Existing project memory and source code already contain a notes
  capability matching a common interpretation of that phrase.

## Gap / Capability Analysis

```text
Desired outcome:
  Add personal notes functionality to the test application.

Current state:
  Personal notes already exist in the test application with web UI, API,
  authentication, persistence, dashboard navigation, and backend tests.

Gap:
  The request does not say what is missing from the existing notes
  capability, or whether the request is a lifecycle demonstration rather
  than product work.

Needed capability:
  Clarified downstream intent before Specification.
```

| Need Type   | Discovery Result                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Reuse       | Existing notes UI/API/model/tests can likely be reused if the desired outcome is the already-present capability.   |
| Modify      | Possible, but no modification is established until the user states what is missing or inadequate.                  |
| Create      | No new notes capability is currently evidenced as missing.                                                         |
| Remove      | No conflicting existing capability is evidenced.                                                                   |
| Integrate   | Existing integration already crosses dashboard, `/notes`, `/api/notes`, auth, and persistence.                     |
| Decide      | Decide whether this request means enhancement, validation, rebuild, documentation, migration, or demo-only output. |
| Investigate | If product work is intended, investigate the specific desired delta and quality bar before Specification.          |

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
- Missing understanding: the desired delta from the existing capability.
- Missing decision: whether Specification should validate, extend, replace,
  or ignore the current notes implementation.

## Needed Capabilities / Changes

- `reuse`: preserve the existing notes capability as discovered context.
- `decide`: clarify the intended product/lifecycle meaning of `REQ-001`.
- `investigate`: if enhancement is intended, investigate the target
  behavior, UX, security/privacy model, and quality bar.
- `modify` or `create`: not established yet.

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
- The next Specification phase should not blindly specify a new notes
  feature. It should first clarify whether the intent is enhancement,
  verification, rebuild, migration, documentation, or only a lifecycle
  demonstration.
- The existing system likely satisfies the literal wording of `REQ-001`,
  but Discovery cannot declare the user's goal complete because the Intake
  request was intentionally minimal.

## Assumptions

- None validated during Discovery.

## Unknowns

- Whether the user knows the current seed app already has personal notes.
- Whether the desired work is a new notes feature, a change to existing
  notes, a quality audit, a reimplementation, or a lifecycle demonstration.
- Whether search, tags, sharing, export, pagination, rich text, attachments,
  reminders, or collaboration are desired.
- Whether the existing authenticated-owner model is acceptable for the new
  request.
- Whether current tests and UI behavior satisfy the requester.
- Whether the prior notes implementation should be treated as authoritative
  current product behavior for this request.

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

- Decide whether `REQ-001` is a lifecycle demonstration or an actual
  product request.
- If product work is intended, decide the intended delta from the current
  notes feature.
- Decide whether the existing authenticated-owner model should remain the
  product model.
- Decide whether Specification should focus on validation, enhancement,
  replacement, or documentation.

## Contradictions

- The Intake request says to add personal notes functionality.
- The current repository evidence shows personal notes functionality is
  already present in the seed app.
- Status: requires clarification before Specification creates new product
  requirements.

## Open Questions

- Is `REQ-001` intended as a lifecycle demonstration only?
- If it is a real product request, what is missing from the existing notes
  capability?
- Should Specification validate the existing feature, extend it, replace
  it, or document it?
- Which actor and ownership model should govern any future notes work?
- What outcome would make the next phase complete?

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
substantially matching capability. The main gap is not an obviously missing
technical component; it is missing intent about the desired delta from the
current product. Relevant product, UX, security, QA, technical, data,
privacy, accessibility, and integration lenses all point to the same
readiness implication: proceed only after clarifying whether future work is
reuse/validation, modification, replacement, or lifecycle demonstration.

## Conclusion

Discovery is complete enough to proceed only to the Specification boundary,
but the discovery status is `needs-clarification` because the requested
capability appears already present. Specification should not create new
requirements until the requester clarifies whether the intended work is an
enhancement, verification, rebuild, or lifecycle-only demonstration.

## Lifecycle State

- Intake: complete.
- Discovery: complete with status `needs-clarification`.
- Next allowed phase: `specification`.

## Boundary Check

- Specification: not created.
- Decomposition: not created.
- Architecture: not created.
- Implementation: not started.
- Tasks: not created.
