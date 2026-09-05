---
name: decomposition
type: workflow
version: 1
when_to_use: >
  Breaking a ready Specification into feature-driven product scope units
  and representing them in the existing backlog before Architecture,
  Implementation Planning, or Implementation.
---

# Decomposition Workflow

Use this workflow when a work-item `SPEC-*` artifact is `active` and its
`Specification Readiness` is `ready-for-decomposition`. Decomposition
answers: "How can the specified outcome be broken into coherent product
units, with Features as the primary delivery unit, so that Architecture can
reason about what must be realized?"

The agent performs Decomposition directly using the ready Specification,
relevant Discovery evidence, project memory, state, traceability, and
existing backlog/graph semantics. There is no Decomposition CLI, engine,
state machine, role system, job-contract system, or second backlog model.
`DECOMP-*` is the reasoning/evidence artifact; the resulting product units
are represented as ordinary rows in `.project/backlog/BACKLOG.md`.

## Steps

1. Read the source `SPEC-*` artifact and confirm it is `active`.
2. Confirm `Specification Readiness` is `ready-for-decomposition`.
3. If either gate fails, stop with Decomposition blocked and route the
   issue upstream through Specification/Discovery clarification or rework.
4. Read only the relevant upstream Discovery evidence, project memory,
   state, and trace needed to understand the specified scope.
5. Extract the active Specification requirements. Ignore inactive
   candidate requirements and non-goals except as boundaries.
6. For each active requirement, decide whether it maps to a Feature, maps
   to another product unit, becomes a constraint/cross-cutting concern,
   requires no separate unit with rationale, or blocks Decomposition.
7. Create only the hierarchy levels needed for meaningful boundaries:
   outcome, initiative, epic/product area, feature, capability, or story.
   Do not force every level.
8. Make Features the primary delivery-oriented units. Capabilities,
   requirements, backlog rows, engineering tasks, and Features are related
   concepts, not interchangeable labels.
9. Update the existing backlog table for the resulting product units. Use
   `Level` for hierarchy/sizing, `Parent` for parent-child ancestry, and
   `Status` for workflow state. Do not create `FEATURE-*`, another backlog,
   or a parallel decomposition registry.
10. For every unit, record identity, type/level, purpose, product value,
    scope, requirement mapping, Discovery evidence, boundaries, meaningful
    relationships, backlog row mapping, and readiness notes for
    Architecture.
11. Distinguish parent/child from `depends-on` and ordinary `related:`
    references. Use typed graph language only where it carries real
    meaning.
12. Create or update one ordinary `DECOMP-*` artifact under
    `.project/decomposition/` using `.project/ARTIFACT-TYPES.md` and
    `SPEC-019`.
13. Update the relevant `TRACE-*` record using `SPEC-013`.
14. Update `.project/state/PROJECT-STATE.md` only enough to show
    Decomposition status and the next allowed phase.
15. Stop at the Decomposition boundary.

## Boundary

Decomposition describes product/system scope, not technical realization.

Allowed:

- "Authenticated owners manage their personal notes."
- "Personal-note access is private to the owner."
- "Notes are discoverable from the user's primary workspace."
- "Feature row `BACKLOG-014` belongs under epic `BACKLOG-013` and is
  `ready` for Architecture."

Not allowed:

- endpoint paths, controllers, database schemas, migrations, indexes, route
  handlers, framework choices, React component names, test-file names, or
  implementation tasks.

Do not create Architecture, Implementation Planning, Implementation,
Verification, Review, Delivery, Operate, TASK artifacts, API contracts,
database schemas, UI designs, source-code changes, roles, jobs, skills, or
a decomposition engine.

## Validation

Use:

```bash
node --test tooling/tests/decomposition.test.mjs
```

The valid exit state is a `DECOMP-*` artifact that consumes a ready
Specification, accounts for all active requirements, creates appropriate
Feature rows in the existing backlog, creates no orphan scope, keeps
hierarchy separate from workflow state, preserves traceability to
Specification/Discovery/backlog/product-unit IDs, and states that
Architecture and later phases have not been started.
