---
id: SPEC-007
type: spec
title: Engineering graph — model and semantics
status: active
created: 2026-08-30
updated: 2026-08-31
related: [SPEC-004, SPEC-005, SPEC-006, SPEC-010, SPEC-013, ADR-001, ADR-002, ADR-008]
---

# SPEC-007: Engineering Graph

Operational guidance: `.agent/instructions/engineering-graph.md`. This
spec is the comprehensive, durable definition; that file is the shorter
agent-facing entry point into it.

## Purpose

Let the project and future agents describe and reason about
relationships between engineering entities — dependencies, impact,
blocking, ownership, execution order, parallelizable work, affected
components, traceability — as a documented **model**, not a running
system.

## Scope

M09 defines nodes, relationship semantics, identity rules, and
invariants. It does not implement storage, traversal, resolution,
visualization, or automatic inference. See "Explicit non-goals" below.

## Node concept

A **node** is an identifiable engineering entity. Node types in this
model: `PROJECT`, `SPEC`, `PLAN`, `TASK`, `ADR`, `REVIEW`, `BACKLOG`,
`TRACE`, `APPLICATION`, `SERVER`, `AGENT`, `PACKAGE`, `CONTRACT`,
`WORKFLOW`, `SKILL`, `TEST`.

Not every type has instances yet. Today's real nodes: every `SPEC-*`,
`PLAN-*`, `ADR-*`, `REVIEW-*`, `TRACE-*` (identity = their existing
artifact ID); every workflow under `.agent/workflows/*` and skill under
`.agent/skills/*` (identity = their existing `name:` frontmatter field —
these already function as stable node identities without any new
mechanism). `TRACE` (added M18, `ARTIFACT-TYPES.md` → `TRACE-<NNN>`) has
exactly one instance (`TRACE-001`) as of M18. `BACKLOG` (added M15,
`ARTIFACT-TYPES.md` → `BACKLOG-<NNN>`), `APPLICATION`, `SERVER`, `AGENT`,
`PACKAGE`, `CONTRACT`, `TEST` have zero instances — no `apps/`,
`servers/`, `agents/`, or `packages/` content exists yet
(`architecture.yaml` → `boundaries`), and no backlog item has been
captured yet (nothing has been implemented to discover or defer work
from). The type list is extensible; a type gains an instance when the
repository actually creates one, not preemptively.

## Relationship concept

A **relationship** (graph edge) connects two nodes with one explicit,
predefined semantic meaning — never a generic, meaningless connector.

## Identity

- Every artifact node already has a stable ID (`ARTIFACT-TYPES.md` →
  `<TYPE>-<NNN>`).
- Every workflow/skill node already has a stable identity (`name:`).
- A future deployable/package/contract/test node receives a stable ID
  (e.g. `APP-001`, `SERVER-001`, `PACKAGE-001`, `CONTRACT-001`) **only
  when the repository has a real need to reference it across a
  boundary** — not manufactured in advance. No registry assigns or
  reserves IDs; an ID is just a value stable enough to be referenced,
  the same way `SPEC-001` became stable by being created once and never
  renumbered.

## Relationship vocabulary

Every edge uses exactly one of these. No relationship type is added
without this list being updated first (this file, then
`engineering-graph.md`).

| Type              | Meaning                                                                                     | Example                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `depends-on`      | X cannot correctly build/operate without Y (structural reliance).                           | `SERVER-A --depends-on--> PACKAGE-X`                                                               |
| `blocks`          | X must complete before Y can start (sequencing, not structural reliance).                   | `TASK-001 --blocks--> TASK-002`                                                                    |
| `implements`      | X is the concrete realization of a requirement Y states.                                    | `PLAN-001 --implements--> SPEC-001`                                                                |
| `satisfies`       | X (a completed unit) fulfills a specific stated criterion of Y.                             | `TASK-002 --satisfies--> "acceptance criterion in PLAN-001"`                                       |
| `consumes`        | X uses Y as an input at an interface boundary.                                              | `SERVER-A --consumes--> CONTRACT-001`                                                              |
| `produces`        | X emits/creates Y.                                                                          | `TASK-002 --produces--> "the change it implements"`                                                |
| `owned-by`        | X's owning boundary is Y (locality — `ADR-002`, `ADR-008`).                                 | `CONTRACT-001 --owned-by--> SERVER-A`                                                              |
| `derived-from`    | X was created by extracting/adapting Y.                                                     | `PACKAGE-001 --derived-from--> "code that lived in SERVER-A"`                                      |
| `discovered-from` | X (typically a `BACKLOG` item) was identified while doing Y — provenance, not extraction.   | `BACKLOG-004 --discovered-from--> "the Checkout feature"` (added M15, `SPEC-010`)                  |
| `supersedes`      | X replaces Y as the authoritative version.                                                  | `ADR-008 --supersedes--> ADR-007`                                                                  |
| `validated-by`    | X's correctness is checked by Y.                                                            | `CONTRACT-001 --validated-by--> TEST-*`, or `TASK-* --validated-by--> "validate-repository skill"` |
| `affects`         | A change to X may require reconsidering/revalidating Y (impact, not structural dependency). | `PACKAGE-X --affects--> SERVER-A`, `PACKAGE-X --affects--> APPLICATION-B`                          |

`discovered-from` differs from `derived-from`: the latter is about code
being extracted/adapted from a source; the former is about a piece of
_work_ (almost always a `BACKLOG` item) being _identified_ while doing
something else — no code is extracted, only provenance is recorded, so a
future agent understands why the item exists (`SPEC-010` → "Discovery
capture").

## References vs. edges

**Not the same thing.** The existing `related:` frontmatter array
(`ARTIFACT-TYPES.md` → "Relationships", established at M04) is an
**untyped cross-reference** — "these two artifacts are worth reading
together." It is unchanged by this spec and remains sufficient for the
common case.

A **graph edge** exists only when one of the eleven typed relationships
above genuinely holds. `related: [ADR-003]` on `SPEC-001` does **not**
imply `SPEC-001 --depends-on--> ADR-003` — it implies nothing beyond "see
also." A markdown link never implies an edge. Promoting a reference to a
typed edge is a deliberate act, not an automatic inference — see
"Invariants."

Typed edges may optionally be recorded as a `relations:` frontmatter
list (`{type, target}` pairs) alongside `related:`, per
`ARTIFACT-TYPES.md` → "Typed relationships (optional)" — but only when a
real relationship needs that precision. As of M09, **no existing
artifact has been retrofitted with `relations:`** — e.g. `ADR-007`'s
relationship to `ADR-008` is already fully expressed through
`status: superseded` + prose + `related:`; adding a formal `supersedes`
edge there today would be notation without new capability, so it wasn't
added. The mechanism is documented and available for the first case that
actually needs it.

## Dependency semantics

`depends-on` is structural: X cannot correctly build or operate without
Y. It is not interchangeable with `blocks` (sequencing) or `affects`
(impact) — see the next two sections.

## Blocking semantics

`blocks` describes execution order, not structural reliance:
`TASK-001 --blocks--> TASK-002` means TASK-002 shouldn't start before
TASK-001 finishes, independent of whether TASK-002's code literally
imports anything TASK-001 produced. A chain such as
`SPEC-001 → PLAN-001 → TASK-001 → TASK-002 → REVIEW-001` is a sequence of
`blocks`/`implements` edges describing intended order — not an executed
pipeline.

## Impact semantics

`affects` is for impact reasoning: `PACKAGE-X --affects--> SERVER-A` and
`PACKAGE-X --affects--> APPLICATION-B` mean a change to `PACKAGE-X` may
require re-validating `SERVER-A`/`APPLICATION-B` — it does not mean
either depends on `PACKAGE-X` for every operation, and it authorizes
nothing by itself. No automatic impact analysis is implemented; this is
the semantic an agent applies by hand, or a future tool could compute
from declared `depends-on`/`consumes` edges.

## Ownership

`owned-by` edges must agree with the repository's actual ownership rules
(`ADR-002`, `ADR-008`): business logic is owned by its deployable, a
package is owned by wherever its source lives. A graph edge **describes**
a relationship; it does **not authorize** one. An edge that would imply a
`packages/` node depending on an `apps/`/`servers/`/`agents/` node
contradicts `architecture.yaml` → `dependency_direction` and is invalid
to record — the graph must reflect the architecture, never override it.

## Invariants

- **No dangling semantic edges** — a typed relationship references an
  identifiable, existing node.
- **No ambiguous edge types** — every edge is one of the eleven defined
  types; `related-to`/`connected-to`/`associated-with`/`linked-to` are
  not edge types (use `related:` for that case instead).
- **No architectural bypass** — an edge that would contradict
  `architecture.yaml`'s boundaries or `dependency_direction` is not
  recorded; the boundary is authoritative, not the edge.
- **No automatic inference** — a textual reference, markdown link, or
  `related:` entry is never treated as a typed edge by default; promoting
  one is a deliberate, explicit act.
- **No speculative nodes** — a node is not created because the type list
  supports it; it exists because the repository already has the entity.
- **The graph is not the source of truth for everything** — source code,
  artifacts, `architecture.yaml`, and configuration remain authoritative
  for their own domains; the graph describes relationships _between_
  them, it doesn't replace any of them.

## Agent usage (conceptual)

```text
Task → Graph → Dependencies → Affected entities → Required validation
```

and

```text
Task A --blocks--> Task B
Task C --depends-on--> Task D
        ↓
Agent determines: A before B, D before C
```

This describes what a future agent _could_ derive by reading declared
edges — it is not implemented as reasoning in M09. See
"Relationship to M06/M08" in `engineering-graph.md`: the graph supplies
context (dependencies/impact/blockers) that informs PLAN and REVIEW in
the existing lifecycle/loop; it is not a third lifecycle.

## Explicit non-goals

No graph database, traversal runtime, dependency resolver, orchestration
engine, visualization UI, graph API, graph package, graph CLI, automatic
graph generation, or persistence layer. No `.project/graph/` directory —
the model is fully expressed as documentation
(`engineering-graph.md`) plus an optional, undemonstrated frontmatter
convention (`ARTIFACT-TYPES.md`). These may become justified future
capabilities; none is part of M09.

## Status

`active` — governs how engineering relationships are described (when
description is warranted at all) from M09 onward.
