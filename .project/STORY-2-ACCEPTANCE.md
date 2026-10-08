# Story 01.1.01-S2 - organization setup

## Repository alignment

This story builds on the Story 1 Workspace feature in `servers/api/features/workspace` and its web flow in `apps/web/features/organizations`. The pasted task describes `src/modules/...`, Next API routes, a `workspaceId/organizationId` compound index, and an owner write. Those structures do not exist in this repository. Do not create a parallel organization module, collection, or API proxy.

The current `organizations` collection already owns organizations. `ownerId` records the creator as the initial sole owner, `workspaceIds` starts empty, `deletedAt` supports soft deletion, Mongoose timestamps provide `updatedAt`, and owner/workspace indexes support the list query. Creation writes the organization and its owner in one MongoDB document insert. No second owner write, event publisher, or migration exists, so transaction and event rollback should be treated as not applicable unless the ownership model changes.

The current authentication model resolves persisted user sessions only. It has no workspace role, guest principal, or API-key principal type. Unauthenticated and unrecognized sessions are rejected; there is no role data with which to distinguish a lead from a member. A separate lead/member policy requires an explicit role source before it can be implemented safely.

## Implementation status

| Story task | Status in this repository | Evidence / remaining |
|---|---|---|
| T1 schema, indexes, migration | Existing schema reused | `servers/api/features/workspace/integrations/organization.model.ts`; model is allow-listed as `organizations`. No schema migration is needed for the current create operation. The story's proposed compound index refers to fields not present in this data model. |
| T2 organization name rule | Implemented for web and API | Web validates trimmed names from 1-80 characters with field feedback; API validates before calling the gateway. The explicit repository domain/result pattern in the pasted task does not match the existing feature layout. |
| T3 policy | Existing authenticated-user create policy | `organization:create` is bound in the Workspace command path; missing/denied/mismatched decisions are tested. Role-based lead/member/API-key distinctions need a role/principal contract. |
| T4 action and route | Implemented in existing boundaries | Web Server Action calls the authenticated `POST /organizations` API and returns validation, failure, or conflict outcomes; success returns to the organization list and scrolls to the created item. The existing Express API is the public route. |
| T5 client island | Implemented for setup submission | Setup form uses `useOptimistic`; failed actions clear the optimistic pending message, and typed 409 responses show the current name when provided. The current API does not produce a version conflict because setup creates a new record rather than updating a versioned one. |
| T6 automated acceptance checks | Focused checks pass | Setup load result is 12,000 requests over ten minutes, zero failures, p95 8.03 ms against 300 ms. Focused web setup checks pass 3/3 and API workspace command/gateway/route/signal checks pass 11/11. |
| T7 manual accessibility walk | Pending | Native labeled input, submit button, cancel link, visible validation, and polite live status are present. Record a preview keyboard/screen-reader walk separately. |

## Acceptance and Definition of Done still to establish

- AC-4 passes in the isolated loopback measurement recorded at `servers/api/performance-results/organization-setup-2026-10-07.json`: 20 requests/second for ten minutes, 12,000/12,000 successful creates, p95 8.03 ms against a 300 ms budget. The runner used the compiled API entrypoint because local TSX execution is blocked by os.userInfo() returning ENOMEM. The proposed on-call policy now includes a create-operation p95 threshold of 300 ms; alert activation remains pending ratification.
- Confirm whether the team has a role source for distinguishing leads from members. Do not infer authority from workspace membership alone.
- Record the manual keyboard and screen-reader walk, CI results, peer approval, and any operational retention or alert work required by this change.
- Direct TSX startup fails because its temporary-directory helper calls `os.userInfo()`, which returns `ENOMEM`; the focused web and API test files were compiled to temporary output and run with Node instead. They pass 14/14. API build, web/API TypeScript checks, lint, repository architecture check, manifest parsing, and AC-4 measurement pass.
