---
id: ADR-006
type: adr
title: Agent-agnostic core, Claude-specific behavior confined to an adapter
status: accepted
created: 2026-08-29
related: [ADR-004]
---

# ADR-006: Agent-Agnostic Core With a Claude-Specific Adapter

## Context

Claude is the initial development agent for this repository, but the
repository is meant to outlive any single agent vendor. If Claude-specific
assumptions leak into the core structures, the foundation becomes
Claude-dependent by accident. Decided at M01.

## Decision

`AGENTS.md`, `architecture.yaml`, and everything under `.agent/` and
`.project/` are written to be usable by any coding agent (Claude, Codex,
or otherwise) — no Claude-specific tool names, behaviors, or assumptions
inside them. `CLAUDE.md` is the sole Claude-specific adapter: a small entry
point that tells Claude how to navigate into the agent-agnostic layers,
containing no rules of its own that aren't already in `AGENTS.md`.

## Consequences

- A reviewer can check this ADR is upheld by confirming `CLAUDE.md` never
  grows rules that `AGENTS.md` doesn't also state, and that nothing in
  `.agent/`/`.project/` references a Claude-only concept.
- A future agent-specific adapter (e.g. a `CODEX.md`) would follow the same
  pattern: thin, pointing into the same agent-agnostic core.

## Status

Accepted at M01. Still in force.
