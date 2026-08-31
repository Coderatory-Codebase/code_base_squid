---
id: agent-operating-contract
type: instruction
applies_to: bootstrapping-into-this-repository
---

# Agent Operating Contract

Read this when you have no context from a prior session — it's the map
connecting everything else, not a rulebook of its own. Durable,
comprehensive definition: `.project/specs/SPEC-011-agent-repository-operating-contract.md`.
Every rule this file points to lives in exactly one place; this file
never restates one.

## The sequence

```text
AGENTS.md (read in full)
  → repository-orientation.md (verify the filesystem, get your bearings)
  → UNDERSTAND the request — does it already exist (SPEC/ADR/backlog)?
  → ANALYZE — relevant lenses, relevant technologies
      (backlog-and-feature-development.md, engineering-standards.md)
  → material ambiguity? → ask, or escalate to RFC/SPEC
  → DEFINE SCOPE — needed now vs. discovered
      (backlog-and-feature-development.md — the central rule: discovery
      does not automatically become implementation scope)
  → PLAN proportionally (development-lifecycle.md)
  → IMPLEMENT (development-loop.md's reasoning applies here)
  → VALIDATE (validation.md — pnpm run validate + format:check)
  → REVIEW (development-lifecycle.md -> "Review dimensions")
  → RECORD durable knowledge, if any resulted
  → UPDATE BACKLOG — discovered/deferred work, once real
  → Git governance throughout (git-governance.md)
```

## A request to explore is not a request to implement

"Explore X" / "figure out how we should do Y" means: discover, inspect,
understand, identify constraints and ambiguity, report findings. It does
not authorize changing the repository. Only a request that actually asks
for implementation does.

## When guidance conflicts

Follow `SPEC-008` → "Guidance precedence" (already defined — this file
doesn't reinvent it). The one rule worth repeating here: your own
preference never silently overrides an explicit repository constraint or
a recorded architectural decision. A genuine conflict between two
authoritative sources gets surfaced, not silently resolved by guessing.

## When you think an existing decision is wrong

A local implementation correction, within the current feature's scope: go
ahead. An architectural disagreement: surface it, follow the existing
ADR/RFC/SPEC process (`change-management.md`, `SPEC-010`), get human
direction when it's material. Never edit a `superseded`/historical
artifact's body to make the current approach look cleaner — supersede it
properly instead.

## When there's no instruction for something

Absence of a documented rule isn't permission to invent a repository-wide
one. Check existing conventions and relevant SPECs/ADRs, apply engineering
judgment (`engineering-standards.md`), and ask when the decision is
material — don't build a framework to fill the gap.

## Before calling anything done

`development-lifecycle.md` → "Implementation complete vs. work complete"
is authoritative. Practical form: `SPEC-011` → "Definition of complete."
