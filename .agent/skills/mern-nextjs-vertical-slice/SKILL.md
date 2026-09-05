---
name: mern-nextjs-vertical-slice
type: skill
description: Build one end-to-end MERN/Next.js feature slice in the seed monorepo.
when_to_use: >
  Use for a seed-app feature that spans the Next.js app, Express API,
  MongoDB/Mongoose persistence, TypeScript contracts/validation, and tests.
requires:
  [
    classified SEED_APP or CROSS_CUTTING request,
    selected feature scope,
    project-owned app/server paths,
  ]
produces:
  [
    vertical feature implementation plan,
    UI/API/data/test changes,
    validation notes,
    discovered backlog updates,
  ]
---

# MERN/Next.js Vertical Slice

This skill applies the repository's operating model to one seed-app
feature. It is not a generic MERN tutorial and does not override
`architecture.yaml`, ADRs, or feature scope.

## Entry checks

1. Confirm the request route: `SEED_APP` or `CROSS_CUTTING`.
2. Confirm the owning project path, currently `apps/test/web` and
   `servers/test/api` unless the user names another project.
3. Load the owning project brain:
   `.project/projects/<project>/PROJECT.md` when it exists.
4. Check `.project/backlog/BACKLOG.md`, relevant SPECs, ADRs, and plans
   before writing code. Product backlog rows for this seed project use
   `Scope = PROJECT` and `Owner = test`.
5. Decide whether app-analysis is needed first. Use it when the feature
   is not already selected and scoped.
6. Identify whether new durable guidance is needed. If the feature
   exposes a foundation gap, classify that as `CROSS_CUTTING` and keep
   foundation changes separate from product changes.

## Slice shape

Prefer a complete, narrow user/system behavior over layer-only work:

```text
UI route/component
  -> client API helper
  -> Express route
  -> request validation / contract
  -> domain service
  -> Mongoose model/query
  -> tests
  -> manual verification when UI behavior matters
```

Not every feature needs every part. State skipped parts when the omission
is not obvious.

## Next.js guidance

- Keep product UI under the owning app boundary.
- Use App Router conventions already present in `apps/test/web`.
- Keep server/API access behind the existing `/api/**` proxy pattern
  unless an ADR changes it.
- Reuse existing auth/session helpers before introducing new state
  mechanisms.
- Make loading, error, empty, and unauthorized states explicit for user-
  visible flows.
- Keep accessibility in the review: labels, keyboard path, focus,
  semantic controls, and live status where needed.

## Express/Mongo guidance

- Put backend feature code under the owning domain in
  `servers/test/api/src/domains/<domain>/`.
- Validate request bodies and params at the route edge.
- Enforce user ownership in database queries for user-scoped data.
- Prefer domain services for business behavior; routes should orchestrate
  parsing, auth, service calls, and response shape.
- Use Mongoose validators on write paths, including update paths where
  persistence-layer defense-in-depth matters.
- Apply existing rate-limit/security conventions to mutating routes.

## Contracts and validation

- Keep request/response types close to the owner unless real cross-
  deployable reuse requires a package.
- Match API tests to observable acceptance criteria, not only happy-path
  implementation.
- Include negative tests for auth, ownership, malformed input, and
  important security boundaries.
- For UI features, run manual browser verification when no frontend test
  harness exists; capture the gap as backlog only if it is real and not
  already tracked.

## Completion

Before calling the feature complete:

- all selected acceptance criteria are verified
- validation has run or blockers are recorded
- meaningful discoveries are resolved through the discovery decision model
- backlog/state/spec/ADR/plan/trace updates are made only where durable
  knowledge changed

## Side effects

**Modifying** — this skill changes application source and tests when used
for implementation. It may also update `.project/` artifacts required by
the feature workflow.
