---
id: ADR-001
type: adr
title: Packages are the only reuse boundary
status: accepted
created: 2026-08-29
related: [ADR-002, SPEC-001]
---

# ADR-001: Packages Are the Only Reuse Boundary

## Context

A foundation monorepo needs one clear place for reusable capability, or
reuse ends up scattered (a top-level `modules/`, ad hoc cross-imports
between apps, duplicated utilities). This decision was made at M01
(Foundation Definition) and has governed the repository since.

## Decision

Reusable capability — infrastructure, protocols, transports, platform
integrations, libraries, runtime primitives, shared contracts, utilities —
lives exclusively in `packages/`. There is no generic top-level `modules/`
directory; `modules`, `services`, `business-services`, and
`domain-services` are explicitly forbidden as top-level directories
(`architecture.yaml` → `forbidden_top_level_dirs`).

A package is created for a concrete, currently-needed reusable capability —
never speculatively, and never merely to break a poorly designed dependency
cycle (see ADR-002 for where non-reusable logic belongs instead).

## Consequences

- `apps/`, `servers/`, `agents/`, and `tooling/` may depend on `packages/`;
  `packages/` must never depend on them (`architecture.yaml` →
  `dependency_direction`).
- No packages exist yet (as of M04) — this ADR governs the boundary in
  advance of any package being created, so the first one is placed
  correctly rather than the boundary being inferred after the fact.

## Status

Accepted at M01. Still in force.
