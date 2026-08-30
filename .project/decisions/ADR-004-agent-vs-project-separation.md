---
id: ADR-004
type: adr
title: .agent/ and .project/ are separate, non-overlapping boundaries
status: accepted
created: 2026-08-30
related: [ADR-005, SPEC-001]
---

# ADR-004: `.agent/` and `.project/` Are Separate Boundaries

## Context

Both "how agents should work" and "what the project has decided" are
things an agent needs to discover, and it would be easy to collapse them
into one directory. Decided at M01 (named as a boundary) and made concrete
at M03/M04 when both directories were actually built.

## Decision

`.agent/` holds the repository-level agent operating system: instructions,
workflows, skills, templates — **how** agents operate. It contains no
project state or decisions.

`.project/` holds durable project memory: specs, plans, decisions,
reviews, current state — **what** the project knows. It contains no
operating instructions.

Neither directory is allowed to become a dumping ground for the other's
responsibility. A rule about _how to work_ belongs in `.agent/`; a record
of _what was decided or is known_ belongs in `.project/`.

## Consequences

- `.claude/` (pre-existing Claude Code tool configuration — permission
  allowlists) is neither of these; it stays Claude-tool-local and doesn't
  become a third competing source of repository-level truth.
- Adding a new instruction that references project state (e.g.
  `validation.md` referencing "the current milestone") points at
  `.project/state/PROJECT-STATE.md` rather than duplicating that state
  inline.

## Status

Accepted at M01, realized at M03 (`.agent/`) and M04 (`.project/`). Still
in force.
