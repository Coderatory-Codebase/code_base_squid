---
id: capability-model
type: instruction
applies_to: authoring-or-choosing-instructions-workflows-skills-or-packages
---

# Capability Model

Six concepts this repository keeps distinct. Collapsing any two of them
into one is the failure mode this file exists to prevent. Durable
statement of these properties: `.project/specs/SPEC-005-capability-model.md`.
Skill-specific detail (metadata, structure, selection, composition):
`.agent/skills/README.md`.

| Concept         | What it is                                                      | Example                                                                           |
| --------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Instruction** | A standing rule, always in force while it applies.              | "Never weaken a quality gate to make validation pass."                            |
| **Workflow**    | A lifecycle a piece of work moves through.                      | `Understand → Plan → Implement → Validate → Review`                               |
| **Skill**       | A discoverable, reusable capability an agent invokes on demand. | `validate-repository`                                                             |
| **Tool**        | Something an agent can directly invoke (a command, an API).     | `git`                                                                             |
| **Package**     | Reusable source code, consumed by import.                       | `packages/validation/` (hypothetical — none exist yet)                            |
| **Agent**       | An independently executable/deployable runtime.                 | `agents/<name>/` (none exist yet — distinct from `.agent/`, the operating system) |

## Rules that keep them distinct

- **A skill does not automatically deserve a package**, and a package
  does not automatically become a skill. `packages/` is reusable _source
  code_, consumed by import (`ADR-008`, `SPEC-003`). `.agent/skills/` is
  agent-facing _capability knowledge_ — a procedure, possibly using tools,
  possibly touching packages, but it is not itself compiled or imported.
  Example: a skill can explain "how to validate repository quality"
  without any of that knowledge living in a package; a package of
  validation _utilities_, if one existed, would be consumed by
  application code, not read by an agent as instructions.
- **A workflow does not become a skill merely because it has steps.** A
  workflow describes the _lifecycle stages_ a change moves through
  (`development-lifecycle.md`); a skill describes _how to perform one
  bounded capability_, often invoked as part of a workflow stage (e.g.
  `validate-repository` is invoked during a workflow's VALIDATE stage —
  it is not itself a workflow).
- **An instruction does not become a workflow merely because it lists
  several things to do in order.** An instruction is a standing rule
  applied continuously; a workflow is a stage sequence a specific piece of
  work passes through once.
- **A tool is not a skill.** `git`, `pnpm`, the compiler, are tools — an
  agent invokes them directly. A skill may _use_ a tool as part of its
  procedure (`review-change` uses `git` and repository inspection), but
  the tool itself needs no `SKILL.md`; only the reusable procedure around
  it might.
- **`.agent/agents/` is not created without a real requirement** — same
  decision M03 already made for `.agent/` generally (no speculative
  agent definitions). A skill describes a capability _available to_ an
  agent; it is not itself an agent, and does not imply one should exist.
  `agents/` (no dot — a repository-root boundary, `architecture.yaml`) is
  a different concept again: deployable agent runtimes, distinct from
  `.agent/` the operating system (`.agent/README.md`).

## Composition, without an engine

Skills compose by being invoked, in prose, from a workflow's stage
description — not through a dependency graph:

```text
feature workflow
  → implementation
  → validate-repository skill
  → review

architecture-related work
  → repository-orientation instruction
  → (a future inspect-architecture skill, if one is ever justified)
  → review
```

A skill may mention another capability it relies on in its own body text.
No dependency resolver, loader, or execution engine reads that
relationship — a human or agent does, by reading.
