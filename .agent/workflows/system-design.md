---
name: system-design
type: workflow
version: 1
when_to_use: >
  Turning one selected backlog Feature plus a ready high-level Architecture
  into concrete behavioral and interaction design before Engineering
  Decomposition or Implementation.
---

# System Design Workflow

Use this workflow when a single backlog Feature is selected for detailed
design after a ready `ARCH-*` baseline exists. System Design answers:
"How does this one Feature behave and interact with the existing
architectural boundaries?"

System Design consumes:

```text
SELECTED FEATURE
  + SPECIFICATION requirements
  + DECOMPOSITION feature coverage
  + HIGH-LEVEL ARCHITECTURE baseline
  -> SYSTEM DESIGN
  -> SD-* artifact
  -> ENGINEERING DECOMPOSITION
```

The agent performs System Design directly using existing artifacts,
backlog rows, project memory, Architecture, ADRs, and targeted source
inspection where implementation evidence is needed. There is no System
Design CLI, engine, registry, manager, state machine, role system, job
system, new skill, feature registry, graph engine, duplicate backlog, or
duplicate traceability system.

## Input Gate

1. Identify exactly one selected backlog Feature.
2. Confirm the backlog row exists in `.project/backlog/BACKLOG.md`.
3. Confirm `Level` is `feature`, `Kind` is `feature`, and `Status` is
   eligible for design (`ready` or `selected`).
4. Confirm the Feature has a valid parent/ancestry when `Parent` is not
   `none`.
5. Confirm the Feature is covered by the source `DECOMP-*` artifact and
   active source Specification requirements.
6. Confirm a ready `ARCH-*` baseline exists and maps or constrains the
   selected Feature.
7. If any gate fails, stop with `blocked` and route to the existing
   backlog, Specification, Decomposition, or Architecture rework path.

## Steps

1. Read the selected Feature row and its parent row only as needed.
2. Read the source Specification requirements that justify the selected
   Feature.
3. Read the source Decomposition feature section and coverage table.
4. Read the source Architecture baseline, constraints, and relevant
   decisions.
5. Inspect targeted source evidence when needed to design real behavior.
6. Define the selected Feature scope and sibling Feature boundaries.
7. Describe actors, feature behavior, user/system interactions, data flow,
   authorization/ownership behavior, validation and error behavior,
   observability/testability expectations, and relevant non-functional
   behavior.
8. Run the architectural consistency check:
   - compatible: record `Architectural Impact: none`;
   - clarification required: record the unresolved issue and block
     readiness;
   - contradiction/change required: record the impact, affected
     architecture decision or boundary, affected Features if known, and
     block downstream work pending controlled Architecture re-evaluation.
9. Create one ordinary `SD-*` artifact under `.project/system-design/`.
10. Update the relevant `TRACE-*`, `.project/state/PROJECT-STATE.md`,
    `architecture.yaml`, and roadmap memory proportionally.
11. Stop before Engineering Decomposition, Implementation Planning,
    Implementation, Verification, Review, Delivery, or Operate.

## Boundary

System Design may state:

- request/response and user/system interaction flows;
- component/service responsibilities within the existing architecture;
- data movement and persistence interaction;
- authorization, validation, error, and state behavior;
- testable scenarios and readiness for Engineering Decomposition;
- architectural compatibility, clarification, or contradiction results.

System Design must not create:

- product-wide design;
- sibling Feature designs;
- Engineering Decomposition;
- implementation plans or tasks;
- source-code changes;
- API/database/UI implementation changes;
- role-scoped agents, jobs, skills, CLIs, engines, registries, managers,
  state machines, feature registries, or duplicate backlog/traceability
  systems.

## Validation

Use:

```bash
node --test tooling/tests/system-design.test.mjs
```

The valid exit state is an `SD-*` artifact scoped to exactly one eligible
Feature, traceable to Specification, Decomposition, backlog, and
Architecture, with a concrete behavioral design, explicit architectural
consistency assessment, and no downstream engineering or implementation
leakage.
