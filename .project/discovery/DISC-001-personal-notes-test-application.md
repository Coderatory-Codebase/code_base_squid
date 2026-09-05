---
id: DISC-001
type: discovery
title: Personal notes in the test application
status: needs-clarification
created: 2026-09-05
related: [REQ-001, TRACE-021, PROJECT-test, TRACE-014]
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

## Known Requirements

- The Intake request asks for personal notes functionality in the test
  application.
- No additional product behavior is established by the Intake request.
- Existing project memory and source code already contain a notes
  capability matching a common interpretation of that phrase.

## Facts

- `REQ-001` preserves the original request: "Add personal notes
  functionality to the test application."
- `PROJECT-test` says the seed project owns `apps/test/web` and
  `servers/test/api`.
- `PROJECT-test` lists personal notes as an existing product capability.
- `servers/test/api/src/app.ts` mounts `notesRouter` at `/api/notes`.
- `servers/test/api/src/domains/notes/notes.routes.ts` applies
  `requireAuth` to the notes router.
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

## Dependencies

- Existing `test` project memory and deployables.
- Existing authentication/session behavior.
- Existing same-origin `/api/**` proxy behavior.
- Existing notes domain files and route tests.
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
| Web notes page requires auth       | `apps/test/web/src/app/notes/page.tsx`                                                      |
| Web client uses `/api/notes`       | `apps/test/web/src/lib/notes-client.ts`                                                     |
| Note persistence exists            | `servers/test/api/src/domains/notes/notes.model.ts`                                         |
| Note contracts exist               | `servers/test/api/src/domains/notes/notes.contracts.ts`                                     |
| Notes behavior is tested           | `servers/test/api/test/domains/notes/notes.routes.test.ts`                                  |
| Historical implementation trace    | `.project/traces/TRACE-014-personal-notes.md`                                               |

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
