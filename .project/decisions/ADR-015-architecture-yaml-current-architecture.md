---
id: ADR-015
type: adr
title: architecture.yaml describes current architecture before milestone history
status: accepted
created: 2026-09-05
related: [SPEC-014, ADR-013]
---

# ADR-015: architecture.yaml Describes Current Architecture Before Milestone History

## Context

`architecture.yaml` was originally useful as the machine-readable source
for boundaries, dependency direction, and roadmap state. Over time, the
roadmap section became the largest and most active part of the file. That
made the file behave like a milestone log instead of the current
architecture source agents need before building features.

The repository is now a foundation for MERN/Next.js monorepo app
development. Agents need `architecture.yaml` to answer what exists, where
new work belongs, what boundaries apply, and how app work differs from
foundation work.

## Decision

`architecture.yaml` is current architecture first and milestone history
second.

It must describe:

- repository topology and top-level boundaries
- project-owned app/server/agent paths
- seed project architecture
- current stack
- dependency direction
- feature ownership and package extraction rules
- operating request routing
- validation expectations

Detailed milestone history lives in `.project/roadmap/MILESTONES.yaml`.
It is historical context and must not override current architecture.

## Consequences

Agents should read `architecture.yaml` for architecture, not as a
chronological story. `PROJECT-STATE.md` remains the live dashboard.
Detailed history belongs in `.project/roadmap/MILESTONES.yaml`.
