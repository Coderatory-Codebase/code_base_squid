---
id: SPEC-014
type: spec
title: Agent operating model realignment
status: active
created: 2026-09-05
related: [SPEC-010, SPEC-011, SPEC-012, SPEC-013, ADR-013, ADR-015, ADR-016]
---

# SPEC-014: Agent Operating Model Realignment

## Purpose

This repository is a reusable agent operating foundation for building
MERN/Next.js monorepo applications. It must work at two scopes: the
monorepo/foundation itself, and the projects/products built inside it.
The seed project under `apps/test/web` and `servers/test/api` proves the
model, but the foundation is the main product.

The realignment exists because the repository had drifted toward
after-the-fact record keeping: specs, plans, ADRs, state, and traces were
often most useful after implementation, while agents still needed a
stronger pre-implementation path.

## Required behavior

Every meaningful request is first routed as one of:

```text
FOUNDATION    changes the agent operating layer, project memory,
              architecture model, workflow/skill/backlog/artifact rules,
              validation, or bootstrap behavior

SEED_APP      changes the MERN/Next.js seed application inside a
              project-owned app/server boundary

CROSS_CUTTING changes both; the foundation and app portions stay
              explicitly separated in scope, plan, implementation, and
              record
```

The routing decision happens before reading source code deeply and before
choosing an implementation workflow. A wrong route is a process defect,
not merely a documentation issue.

## Dual operating scope

The operating model has two brains:

```text
Repository/foundation brain
  .agent/
  architecture.yaml
  .project/state/PROJECT-STATE.md
  .project/roadmap/
  foundation SPEC/ADR/PLAN/TRACE records
  backlog rows with Scope = FOUNDATION

Project/product brain
  .project/projects/<project>/PROJECT.md
  apps/<project>/
  servers/<project>/
  agents/<project>/
  project SPEC/ADR/PLAN/TRACE records
  backlog rows with Scope = PROJECT and Owner = <project>
```

Agents must load and maintain the correct scope. Project/product work is
not allowed to redefine the foundation silently. Foundation work is not
allowed to pretend it delivered product behavior. Cross-cutting work must
show both sides explicitly.

## Dual-track model

The repository runs two connected tracks:

```text
Discovery / analysis track
  product, UX, domain, architecture, data, API, security, privacy,
  performance, reliability, testing, accessibility, operations,
  developer-experience, standards, dependency, and risk lenses
        ↓
  multilevel backlog, specs, ADRs, architecture updates, and ready
  feature slices

Delivery track
  selected feature slice
        ↓
  spec/plan/ADR when warranted
        ↓
  vertical implementation across UI, API, domain, data, validation,
  tests, and documentation
        ↓
  validation, review, trace, state/backlog update
```

Discovery does not authorize implementation by itself. Delivery does not
skip discovery because a feature sounds obvious.

## Pre-implementation artifacts

A non-trivial feature or foundation change must have enough durable shape
before code changes begin:

- selected backlog item or explicit user request with recorded scope
- SPEC when the required behavior/model should guide future work
- ADR when a real architecture or technology decision is being made
- PLAN when implementation spans multiple boundaries, technologies, or
  validation modes

Small fixes can remain lightweight, but they still need a route,
understanding, and scope.

## Architecture model

`architecture.yaml` describes current architecture first:

- monorepo topology and ownership boundaries
- project-owned deployables
- seed application shape
- stack and dependency direction
- feature ownership and reusable-package rules
- validation expectations
- operating-model routing rules

Milestone history is useful context, but it must not be the primary
architecture model. Detailed milestone history now lives in
`.project/roadmap/MILESTONES.yaml`; `architecture.yaml` keeps the live
architecture, active phase, and pointer to that history file.

## Skill model

The foundation must include reusable skills once a repeated stack or
implementation capability is real enough. The first approved stack skill
is `mern-nextjs-vertical-slice`, used for end-to-end seed-app features
that touch Next.js, Express, MongoDB/Mongoose, and shared TypeScript
validation/contracts.

Creating future skills still follows `SPEC-012`: no speculative skill
proliferation, but no pretending a real repeated capability should stay
only in prose after it has clearly become part of the boilerplate.

## Multilevel backlog

Backlog work is interpreted in levels:

```text
product area -> capability/epic -> feature -> story/task -> discovered issue
```

The current single-table backlog remains the persistence mechanism. Each
row carries `Scope` and `Owner` so one file can maintain both foundation
and project/product work without mixing their responsibilities. A later
migration should add level/parent relationships without splitting into
disconnected backlogs.

## Validation

The operating layer is incomplete until validation covers more than
top-level directories. Required future validators:

- artifact ID/type/location/frontmatter/lifecycle consistency
- backlog ID/status/link consistency, including level/parent fields once
  migrated
- project-owned deployable paths
- dependency direction across `apps/`, `servers/`, `agents/`, and
  `packages/`
- stale current-state contradictions between `architecture.yaml`,
  `.project/state/PROJECT-STATE.md`, and artifact locations

## Status

`active` — governs the M26 realignment and subsequent foundation/app
feature work.
