---
id: ADR-005
type: adr
title: Context loads progressively; CLAUDE.md stays small
status: accepted
created: 2026-08-29
related: [ADR-004]
---

# ADR-005: Progressive Disclosure Over Front-Loaded Context

## Context

An agent operating in this repository could be handed the entire
architecture, every instruction, every workflow, every skill, and all
project history on every task — at increasing token cost and decreasing
signal as the repository grows. Decided at M01, extended at each
subsequent milestone as new layers (`.agent/`, `.project/`) were added.

## Decision

Context loads on demand, in this order, stopping as soon as there's enough
to act:

```text
CLAUDE.md → AGENTS.md → relevant .agent/instructions
  → relevant .agent/workflows → relevant .agent/skills
  → current project state (.project/state/PROJECT-STATE.md)
  → relevant .project artifact → relevant source code
```

`CLAUDE.md` in particular is kept intentionally small — it is an entry
point and navigation aid, never a restatement of `AGENTS.md` or anything
under `.agent/`/`.project/`.

## Consequences

- Every root/adapter document (`CLAUDE.md`, `AGENTS.md`, `.agent/README.md`,
  `.project/README.md`) states this chain rather than embedding the
  content it points to.
- `.project/state/PROJECT-STATE.md` exists specifically so "what's the
  current state of the project" doesn't require reading every artifact in
  `.project/` — it's the progressive-disclosure anchor for project memory,
  the way `README.md`/`architecture.yaml` are for repository structure.

## Status

Accepted at M01. Still in force.
