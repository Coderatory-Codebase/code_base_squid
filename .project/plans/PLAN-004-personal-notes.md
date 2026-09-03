---
id: PLAN-004
type: plan
title: Personal notes (create, view, edit, delete)
status: complete
created: 2026-09-03
related: [ADR-012, ADR-013, BACKLOG-005, TRACE-014]
---

# PLAN-004: Personal Notes

No new architecture — reuses `ADR-012`/`ADR-013`'s deployable split and
the existing `Session`-record pattern (`ADR-014`) as the template for a
second, unrelated `userId`-owned collection. Proportional plan for a
moderate feature (`SPEC-010` → "Feature planning").

## Scope

**Needed now**:

- Create a note (title required, body optional).
- View the current user's notes (list + single note).
- Edit a note (title and/or body).
- Delete a note.
- Every operation is scoped to the authenticated user — a user can never
  read, edit, or delete another user's note.

**Out of scope** (discovered during analysis, not built — see
`BACKLOG` reconciliation in `TRACE-014`): search/filter over notes;
tagging/categorization; rich text or Markdown rendering; sharing a note
with another user; archiving/soft-delete or trash/undo; export;
pagination (list is expected to stay small for a personal-notes MVP —
revisit if it becomes a real problem); offline/optimistic sync.

## Repository layout

```text
servers/test/api/src/domains/notes/
  notes.model.ts      # new — Note schema (userId, title, body, timestamps)
  notes.contracts.ts  # new — CreateNoteRequest, UpdateNoteRequest, NoteSummary
  notes.service.ts     # new — createNote/listNotes/getOwnedNote/updateNote/deleteNote
  notes.routes.ts       # new — GET/POST /api/notes, GET/PATCH/DELETE /api/notes/:id

servers/test/api/src/app.ts        # amended — mount notesRouter
servers/test/api/test/domains/notes/
  notes.routes.test.ts # new

apps/test/web/src/app/notes/
  page.tsx             # new — server component, redirects unauthenticated
  note-list.tsx         # new — client component (list + create + edit + delete)

apps/test/web/src/lib/notes-client.ts # new — fetch wrapper functions
apps/test/web/src/app/dashboard/page.tsx # amended — link to /notes
```

## Acceptance criteria

- An authenticated user can create a note with a title (required, 1-200
  chars) and an optional body (up to 20,000 chars); an empty/whitespace
  title is rejected with a clear validation error.
- An authenticated user can view the list of their own notes, newest
  first, and can view a single note of theirs.
- An authenticated user can edit a note's title and/or body; the
  updated note reflects the change immediately.
- An authenticated user can delete a note; a deleted note no longer
  appears in the list or is fetchable.
- No note operation (view/edit/delete) ever succeeds against another
  user's note — the response is `404`, not `403`, consistent with the
  existing session-ownership pattern (never confirms another user's
  resource exists).
- Unauthenticated requests to any notes endpoint are rejected (`401`).
- The `/notes` page redirects to `/login` when unauthenticated, matching
  `/dashboard`/`/profile`/`/settings`.

## Validation

`pnpm run validate` + `format:check`; new `servers/test/api` test suite
covering create/list/get/update/delete, validation errors, ownership
isolation (cross-user `404`), and a persistence-layer defense-in-depth
test bypassing route-level zod validation; manual pass through both
real dev servers (`validation.md`, M21 bullet).

## Status

`complete` — all acceptance criteria verified (test suite + manual
pass). See `TRACE-014`.
