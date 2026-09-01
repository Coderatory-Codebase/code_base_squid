---
id: ADR-013
type: adr
title: Project-ownership boundary for apps/, servers/, and agents/
status: accepted
created: 2026-08-31
related: [SPEC-001, PLAN-002, ADR-012, TRACE-006]
---

# ADR-013: Project-Ownership Boundary for `apps/`, `servers/`, `agents/`

## Context

M22 built the repository's first real application directly at
`apps/web` and `servers/api` — one level under the global boundary.
`architecture.yaml`'s original `apps/`/`servers/` definitions (M01,
`SPEC-001`) list `examples: [web, admin, mobile]` / `[api, worker,
gateway]`, implying multiple independent deployables could sit directly
under those roots with no further ownership grouping. That's fine for a
single, permanently-one-project repository, but this repository's own
stated purpose (`README.md`: "a reusable software foundation from which
future projects are scaffolded") means more than one project could
eventually exist here. Without an explicit project boundary, a second
project's `apps/admin` would sit as a sibling to the first project's
`apps/web` with nothing distinguishing "these are the same product" from
"these are unrelated products that happen to share a repository" —
exactly the kind of implicit, undocumented structure `boundaries.md`
already exists to prevent for every other kind of directory decision.

## Decision

`apps/`, `servers/`, and `agents/` are **project-owned** boundaries: a
deployable lives at `apps/<project>/<app>`, `servers/<project>/<server>`,
`agents/<project>/<agent>` — never directly under the global root. M22's
application is retroactively corrected: `apps/web` → `apps/test/web`,
`servers/api` → `servers/test/api` (`test` is this first project's name,
chosen by the user at M23 — not a placeholder to rename mechanically
later without a reason to). `pnpm-workspace.yaml`'s globs move from
`apps/*`/`servers/*`/`agents/*` (one level) to `apps/*/*`/`servers/*/*`/
`agents/*/*` (two levels) to match.

`packages/` is **not** made project-owned by this decision — it remains
the cross-project/cross-deployable reuse boundary (`ADR-008`), consumed
directly by any deployable regardless of which project it belongs to.
`tooling/` also stays repository-level, not project-scoped — it serves
the whole repository, not one project.

## Rationale

- **The repository's own stated purpose requires this.** A "foundation
  from which future projects are scaffolded" (`README.md`) that lets a
  second project dump its deployables as flat siblings of the first
  project's has already failed at the one thing it exists to do.
- **Consistent with the existing boundary-decision discipline.**
  `boundaries.md` already requires flagging a new top-level boundary
  explicitly rather than adding it silently; this is the same principle
  one level down — a new deployable needs an explicit project owner,
  not an implicit one.
- **Cheap now, expensive later.** Correcting this after a second project
  existed would mean moving two projects' deployables instead of one,
  and updating every path a second project had already accumulated.
  M22 is the only real deployable that exists, so this is the cheapest
  possible moment to fix it.
- **Rejected alternative**: leave `apps/web`/`servers/api` as-is and
  handle project-scoping "when a second project actually shows up."
  Rejected because the repository's own `boundaries.md` explicitly
  argues against exactly this pattern for other structural decisions
  (a milestone name in the roadmap is not a concrete need; equally, "no
  second project yet" is not a reason to leave the first project's
  structure unable to accommodate one) — and because the migration cost
  only grows the longer it's deferred.

## Consequences

- `architecture.yaml` → `boundaries` (`apps/`, `servers/`, `agents/`)
  gains an explicit project-ownership statement; `boundaries.md` gains a
  corresponding checklist item.
- `pnpm-workspace.yaml` globs changed as above; verified via a full
  `pnpm install` + `pnpm run validate` pass after the migration.
- `@nut-shyll/web`/`@nut-shyll/api` renamed to `@nut-shyll/test-web`/
  `@nut-shyll/test-api` to stay unique and legible as this repository
  (potentially) grows more projects.
- `ADR-012`/`PLAN-002`/`TRACE-005` (M22's own decision/plan/execution
  records) are **not** rewritten — they accurately describe what was
  decided and built at M22, under the boundary model that existed then.
  This ADR is the corrective decision layered on top, the same pattern
  `ADR-007`→`ADR-008` already established for this repository (a
  superseded/corrected decision stays intact as history; the correction
  is a new, separate record).
- Any future second project creates its own `apps/<project>/`,
  `servers/<project>/` siblings — no change to this decision needed to
  accommodate it, which is the point.

## Status

Accepted at M23. Governs `apps/`, `servers/`, and `agents/` from this
point forward.
