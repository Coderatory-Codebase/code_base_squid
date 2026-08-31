---
id: ADR-011
type: adr
title: Repository-native trace persistence
status: accepted
created: 2026-08-31
related: [SPEC-013, ADR-010]
---

# ADR-011: Repository-Native Trace Persistence

## Context

M18 requires a durable way to reconstruct what an agent actually did —
what was requested, what was decided, what changed, what was validated,
how it concluded. Two real alternatives existed: a repository-native,
version-controlled record (one file per trace, same convention as
`SPEC-*`/`ADR-*`/`BACKLOG-*`), or an external system — a database, an
event bus, a telemetry/observability platform, or a dashboard/API built
specifically for this.

## Decision

Repository-native. `TRACE-<NNN>` artifacts, one markdown file per trace,
in `.project/traces/`, following the exact convention every other
`.project/` artifact type already uses (`ARTIFACT-TYPES.md`). No
database, API, CLI, dashboard, telemetry service, event bus, or external
observability platform.

## Rationale

- **Same reasoning as `ADR-010`** (single, repository-native backlog),
  applied to a structurally identical problem: a durable record of
  work, one contributor, zero real instances at decision time, and an
  existing convention (git-inspectable markdown, one file per item) that
  already solves discoverability, versioning, and provenance for every
  other artifact type in this repository. An external system would add a
  dependency, an auth/sync surface, and a second place knowledge can
  drift out of sync with the repository it's supposedly describing —
  for a problem plain files already solve at this repository's actual
  scale.
- **A trace is not telemetry.** Telemetry favors an external system
  because it's high-volume, ephemeral, and queried at scale. A trace is
  the opposite: low-volume (proportional — most work needs none at all,
  `SPEC-013` → "Proportionality"), durable, and read by a human opening
  one file. The volume/durability profile that would justify an external
  system doesn't exist here and isn't assumed to appear.
- **Consistent with `ADR-004`** (agent-agnostic core): a trace readable
  by opening a file works identically for Claude or any other agent this
  repository supports; a bespoke telemetry integration would not.
- If a genuine need for cross-repository trace aggregation, high-volume
  event capture, or queryable trace search ever emerges, that's a
  concrete future trigger to revisit this decision — not assumed now.

## Consequences

- `.project/traces/` and the `TRACE-<NNN>` ID scheme join
  `ARTIFACT-TYPES.md`'s existing conventions, created with this
  milestone's own first real instance (`TRACE-001`) rather than as an
  empty directory.
- A trace is exactly as durable, diffable, and git-blame-able as an ADR
  or SPEC — no separate backup/retention/access-control story is needed
  beyond what the repository already has.
- Nothing in this decision creates a runtime, service, or process that
  must be operated — a trace file, once written, requires no
  infrastructure to remain readable.

## Status

Accepted at M18. Governs `.project/traces/` and the `TRACE-<NNN>`
artifact type.
