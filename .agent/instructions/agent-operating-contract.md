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
  → CLASSIFY the request — FOUNDATION, SEED_APP, or CROSS_CUTTING; which
      project (if any) owns it; and does it require planning before
      implementing?
      (SPEC-011 -> "Request classification", "Project/foundation
      boundary check"; SPEC-014 -> "Required behavior";
      development-lifecycle.md -> "When planning is required")
  → LOAD PROJECT BRAIN when the route targets a project/product —
      .project/projects/<project>/PROJECT.md after the foundation rules,
      before source files or feature implementation
      (ADR-016; SPEC-014 -> "Dual operating scope")
  → UNDERSTAND the request — does it already exist (SPEC/ADR/backlog)?
  → INTAKE when the request is raw business/product input that must be
      captured before downstream engineering — create REQ-* and stop
      before Discovery (intake.md, SPEC-015)
  → DISCOVERY when a completed REQ-* is selected for investigation —
      create DISC-* with evidence-backed facts, lens findings, current
      state, gaps, needed capabilities, unknowns, risks, and open
      questions; stop before Specification
      (discovery.md, SPEC-016)
  → SPECIFICATION when a completed DISC-* is selected for requirements —
      create SPEC-* with explicit testable requirements or unresolved
      blockers; stop before Decomposition
      (specification.md, SPEC-017)
  → DECOMPOSITION when an active SPEC-* is ready —
      create DECOMP-* with coherent product/system scope units and
      requirement coverage; stop before Architecture
      (decomposition.md, SPEC-019)
  → ANALYZE — relevant lenses, relevant technologies, use vs. build vs.
      adopt for anything new
      (backlog-and-feature-development.md, engineering-standards.md ->
      "Use vs. build vs. adopt")
  → material ambiguity? → ask, or escalate to RFC/SPEC
  → DEFINE SCOPE — needed now vs. discovered
      (backlog-and-feature-development.md — the central rule: discovery
      does not automatically become implementation scope)
  → PLAN proportionally — for a feature, decide which phases it actually
      needs before implementation (backlog-and-feature-development.md ->
      "Phase determination"; feature.md; app-analysis.md)
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

## When a decision needs a human

Don't hunt across specs to know whether something needs to stop for
approval — `SPEC-011` → "Human-in-the-loop" is the consolidated index of
every existing escalation trigger. Not in that list → stays autonomous.

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
