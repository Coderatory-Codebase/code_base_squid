---
id: engineering-graph
type: instruction
applies_to: describing-relationships-between-engineering-entities
---

# Engineering Graph

A documentation-level model for describing relationships between
engineering entities (`Nodes + typed relationships = engineering
graph`) — not a system. Comprehensive definition, including the full
relationship vocabulary and invariants:
`.project/specs/SPEC-007-engineering-graph.md`. Read that before adding
any typed relationship; this file is the quick-reference entry point.

## The one thing to remember

`related:` (existing, M04) is an **untyped cross-reference** — "see
also." A **graph edge** is one of twelve specific, defined meanings
(`depends-on`, `blocks`, `implements`, `satisfies`, `consumes`,
`produces`, `owned-by`, `derived-from`, `discovered-from` (added M15 —
provenance for backlog items, see `SPEC-010`), `supersedes`,
`validated-by`, `affects` — full definitions in `SPEC-007`). Never assume
a `related:` entry or a markdown link is an edge; promoting one to a
typed edge is a deliberate choice, not something inferred automatically.

## Relationship to M06 and M08

```text
                GRAPH
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
 dependencies   impact    blockers
       │          │          │
       └──────────┼──────────┘
                  ▼
          DEVELOPMENT LOOP (development-loop.md)
                  │
                  ▼
             LIFECYCLE (development-lifecycle.md)
```

The graph is **context**, not another lifecycle. It informs UNDERSTAND/
PLAN (what does this depend on, what would it affect, what blocks it) and
REVIEW (did the change touch something it wasn't supposed to). It adds no
new stage to either the lifecycle or the loop.

## Using it

- Most work needs nothing from this file — the existing `related:`
  convention already covers ordinary cross-referencing.
- Reach for a typed edge only when you need one of the eleven specific
  meanings, and the entities on both ends already have stable identity
  (an existing artifact ID, an existing workflow/skill `name:`, or a
  deployable/package/contract that's real, not planned).
- Before recording an `owned-by`/`depends-on` edge, check it agrees with
  `architecture.yaml` → `dependency_direction` and `boundaries` — an edge
  never authorizes a relationship the architecture forbids
  (`boundaries.md`).
- Don't create a node for something that doesn't exist yet to make a
  diagram complete.

## Non-goals

No graph engine, database, resolver, orchestration, visualization, API,
package, or CLI. Full list and rationale: `SPEC-007` → "Explicit
non-goals."
