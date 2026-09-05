---
id: ADR-016
type: adr
title: Dual operating scope for foundation and project development
status: accepted
created: 2026-09-05
related: [SPEC-014, SPEC-010, ADR-010, ADR-013, ADR-015]
---

# ADR-016: Dual Operating Scope for Foundation and Project Development

## Context

This repository must support two kinds of development at the same time:

- the monorepo/foundation itself, which defines how agents work
- the projects/products built inside the monorepo, which use that
  foundation to deliver software features end to end

The previous model named foundation versus project work, but it did not
make the project/product operating memory explicit enough. That allowed
agents to blur the test application, the repository foundation, backlog
items, specs, state, and architecture into one flat story.

## Decision

The repository has a dual operating scope:

- **Repository/foundation brain**: current architecture, agent
  instructions, workflows, skills, validation, roadmap, artifact model,
  and foundation backlog.
- **Project/product brain**: project/product intent, app architecture,
  product backlog, feature specs, plans, decisions, validations, and
  delivery history for one project inside the monorepo.

The physical `.project/backlog/BACKLOG.md` remains one backlog per
`ADR-010`, but each item now carries an explicit `Scope` and `Owner`.
That keeps one discoverable backlog while making foundation work and
project/product work behave differently.

Project/product operating memory lives under `.project/projects/<project>/`
once that project exists. The first instantiated project memory is
`.project/projects/test/PROJECT.md`, matching the existing seed project
under `apps/test/web` and `servers/test/api`.

## Consequences

Agents must apply both scopes when appropriate:

- A foundation request updates the repository/foundation brain and does
  not assume application code is involved.
- A project/product request loads the relevant project brain and follows
  the foundation's workflows/skills without redefining them.
- A cross-cutting request separates the foundation and project portions
  in scope, plan, backlog updates, validation, and trace.

Backlog items are not split into separate files or separate backlogs.
They are separated by `Scope` and `Owner` so the agent can decide whether
an item maintains the monorepo foundation or a product built inside it.
