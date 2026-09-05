---
name: decomposition
type: workflow
version: 1
when_to_use: >
  Breaking a ready Specification into coherent product/system scope units
  before Architecture, Implementation Planning, or Implementation.
---

# Decomposition Workflow

Use this workflow when a work-item `SPEC-*` artifact is `active` and its
`Specification Readiness` is `ready-for-decomposition`. Decomposition
answers: "How can the specified outcome/capability be broken into
coherent, bounded scope units so that Architecture can reason about what
must be realized?"

The agent performs Decomposition directly using the ready Specification,
relevant Discovery evidence, project memory, state, traceability, and
existing backlog/graph semantics. There is no Decomposition CLI, engine,
state machine, role system, job-contract system, or second backlog model.

## Steps

1. Read the source `SPEC-*` artifact and confirm it is `active`.
2. Confirm `Specification Readiness` is `ready-for-decomposition`.
3. If either gate fails, stop with Decomposition blocked and route the
   issue upstream through Specification/Discovery clarification or rework.
4. Read only the relevant upstream Discovery evidence, project memory,
   state, and trace needed to understand the specified scope.
5. Extract the active Specification requirements. Ignore inactive
   candidate requirements and non-goals except as boundaries.
6. For each active requirement, decide whether it maps to a decomposition
   unit, is inherently represented by another unit, requires no separate
   unit with rationale, or blocks Decomposition.
7. Create only the hierarchy levels needed for meaningful boundaries:
   outcome, initiative, epic, feature, capability, or story. Do not force
   every level.
8. For every unit, record identity, type, purpose, scope, requirement
   mapping, boundaries, meaningful relationships, and readiness notes for
   Architecture.
9. Distinguish parent/child from `depends-on` and ordinary `related:`
   references. Use typed graph language only where it carries real
   meaning.
10. Create one ordinary `DECOMP-*` artifact under `.project/decomposition/`
    using `.project/ARTIFACT-TYPES.md` and `SPEC-019`.
11. Update the relevant `TRACE-*` record using `SPEC-013`.
12. Update `.project/state/PROJECT-STATE.md` only enough to show
    Decomposition status and the next allowed phase.
13. Stop at the Decomposition boundary.

## Boundary

Decomposition describes product/system scope, not technical realization.

Allowed:

- "Authenticated owners manage their personal notes."
- "Personal-note access is private to the owner."
- "Notes are discoverable from the user's primary workspace."

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
Specification, accounts for all active requirements, creates no orphan
scope, preserves traceability to Specification and requirement IDs, and
states that Architecture and later phases have not been started.
