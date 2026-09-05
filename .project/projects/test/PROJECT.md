---
id: PROJECT-test
type: project-state
title: Test seed project operating memory
status: active
created: 2026-09-05
related: [ADR-013, ADR-016, ADR-012, ADR-014]
---

# Test Seed Project

This is the project/product operating brain for the existing seed app.
It records what the `test` project is, what it owns, and how agents
should orient before changing its product behavior.

## Role

`test` is the reference MERN/Next.js product used to prove the repository
foundation. It is a real seed application, but it is not the whole repo.

## Owned Deployables

- `apps/test/web` — Next.js/React web app.
- `servers/test/api` — Express/MongoDB API.

## Current Product Capabilities

- Authentication: register, login, logout, refresh, current user, route
  protection.
- Profile: editable `displayName`.
- Account security settings: change password and manage server-side
  sessions.
- Personal notes: create, view, edit, delete notes scoped to the
  authenticated owner.

## Governing Decisions

- `ADR-012` — MERN/Next.js stack and authentication architecture.
- `ADR-013` — project-owned deployable boundaries.
- `ADR-014` — server-side session record.
- `ADR-016` — dual operating scope.

## Backlog Scope

Rows in `.project/backlog/BACKLOG.md` with `Scope = PROJECT` and
`Owner = test` are product/project backlog items for this seed project.
Rows with `Scope = FOUNDATION` belong to the repository operating layer.
Rows with `Scope = CROSS_CUTTING` must separate project and foundation
work in their plan and trace.

## Agent Entry

For work inside this project:

1. Load the repository/foundation operating rules first.
2. Confirm the request route is `PROJECT`/`SEED_APP` or `CROSS_CUTTING`.
3. Load this file before selecting source files.
4. Use `.agent/workflows/app-analysis.md` when the requested feature is
   not already clearly scoped.
5. Use `.agent/skills/mern-nextjs-vertical-slice/SKILL.md` for
   end-to-end seed-app features.
6. Update this file only when durable project/product state changes.
