---
id: ADR-003
type: adr
title: Architecture is composable per-deployable, not repo-wide
status: accepted
created: 2026-08-29
related: [SPEC-001]
---

# ADR-003: Architecture Is Composable, Not Prescribed Repo-Wide

## Context

A foundation could mandate one methodology (DDD, hexagonal, CQRS,
vertical-slice, event-driven, modular monolith, microservices, ...) for
every deployable. That would bias the foundation toward the kinds of
projects that fit it and fight the ones that don't. Decided at M01.

## Decision

No single architectural methodology is mandated repository-wide. Each
`apps/`, `servers/`, or `agents/` deployable selects the pattern(s) that
fit it when it's created. These are patterns/capabilities a project opts
into, not a structural constraint this repository imposes on every
deployable uniformly.

## Consequences

- `.agent/instructions/implementation.md` explicitly calls this out so
  agents don't impose a house style when scaffolding a new deployable.
- The foundation itself stays unopinionated about internal deployable
  structure; opinions are scoped to the boundaries between deployables
  (ADR-001, ADR-002), not their internals.

## Status

Accepted at M01. Still in force.
