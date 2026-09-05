---
name: engineering-decomposition
type: workflow
version: 1
when_to_use: >
  Turning one approved Feature-scoped System Design into executable,
  traceable engineering work before implementation begins.
---

# Engineering Decomposition Workflow

Use this workflow when exactly one selected backlog Feature has a complete
`SD-*` artifact with readiness for Engineering Decomposition. Engineering
Decomposition answers: "What executable engineering work is required to
make this approved Feature System Design real?"

Engineering Decomposition consumes:

```text
SELECTED FEATURE
  + APPROVED SYSTEM DESIGN
  + HIGH-LEVEL ARCHITECTURE baseline
  + SPECIFICATION / DECOMPOSITION traceability
  -> ENGINEERING DECOMPOSITION
  -> ENG-* artifact
  -> TASK-* artifacts
  -> IMPLEMENTATION
```

The agent performs Engineering Decomposition directly using the existing
artifact model, backlog table, Architecture, System Design, traceability
language, and targeted source evidence. There is no Engineering
Decomposition CLI, engine, registry, manager, state machine, role system,
job system, new skill, feature registry, duplicate backlog, duplicate
contract system, or duplicate traceability system.

## Input Gate

1. Identify exactly one selected backlog Feature.
2. Confirm the backlog row exists in `.project/backlog/BACKLOG.md`.
3. Confirm `Level` is `feature`, `Kind` is `feature`, and `Status` is
   eligible (`ready` or `selected`).
4. Confirm the source Specification is active and ready.
5. Confirm the source Decomposition is complete and maps the Feature to
   active requirements.
6. Confirm the source Architecture is complete and has no unresolved
   contradiction for the Feature.
7. Confirm one complete `SD-*` exists for the selected Feature and has
   readiness `ready-for-engineering-decomposition`.
8. If any gate fails, stop with `blocked` and route to the existing
   Specification, Decomposition, backlog, Architecture, or System Design
   rework path.

## Steps

1. Read the selected Feature row and only the relevant parent/sibling rows.
2. Read the source Specification requirements that justify the Feature.
3. Read the source Decomposition coverage for the selected Feature.
4. Read the high-level Architecture baseline and its constraints.
5. Read the source System Design behavior, flows, responsibilities,
   testability expectations, readiness, and boundary check.
6. Inspect targeted source evidence only where needed to understand the
   real engineering boundary or existing implementation delta.
7. Identify the engineering scope and explicit non-scope.
8. Produce concrete engineering work items. Each item must identify its
   target area, responsibility, intended change or preservation
   requirement, relevant existing boundary, dependencies, expected
   outcome, verification expectation, and traceability back to `SD-*`.
9. Derive executable `TASK-*` artifacts from the work packages when they
   are needed for implementation readiness. Each task must identify its
   objective, bounded scope, source/design basis, relevant repository
   boundary, dependencies, expected outcome, verification expectation,
   acceptance criteria, and status.
10. Record dependencies and sequencing without inventing unnecessary
    serialization.
11. Check architectural consistency. If work or a task requires a new boundary,
    store, service, package, contract placement, ownership model, or other
    Architecture change not approved upstream, mark the decomposition
    blocked and route to Architecture/System Design rework.
12. Create or update one ordinary `ENG-*` artifact under
    `.project/engineering/`, with a Work Package to Task mapping.
13. Create concise `TASK-*` artifacts under `.project/tasks/` using the
    existing Task convention. Do not use backlog rows as task execution
    state.
14. Update the relevant `TRACE-*`, `.project/state/PROJECT-STATE.md`,
    `architecture.yaml`, roadmap memory, and docs proportionally.
15. Stop before executing the Tasks, Implementation, Verification, Review,
    Delivery, or Operate.

## Boundary

Engineering Decomposition may state:

- executable engineering work items;
- responsibility-level implementation areas;
- executable `TASK-*` artifacts derived from work packages;
- existing files or boundaries when needed for execution context;
- dependency and sequencing relationships;
- expected implementation outcomes;
- verification expectations derived from System Design;
- readiness for Implementation.

Engineering Decomposition must not create:

- product-wide engineering decomposition;
- sibling Feature decomposition;
- jobs, job contracts, or role-specific agent assignments;
- source-code procedures or implementation results inside tasks;
- source-code changes;
- API/database/UI implementation changes;
- new architecture decisions or silent architecture mutations;
- role-scoped agents, jobs, skills, CLIs, engines, registries, managers,
  state machines, feature registries, or duplicate backlog/contract/
  traceability systems.

## Validation

Use:

```bash
node --test tooling/tests/engineering-decomposition.test.mjs
```

The valid exit state is an `ENG-*` artifact scoped to exactly one eligible
Feature, traceable to Specification, Decomposition, Architecture, and
System Design, with Work Packages, executable `TASK-*` artifacts,
dependency ordering, verification expectations, readiness for
Implementation, and no implementation or framework leakage.
