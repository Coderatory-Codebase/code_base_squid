---
name: specification
type: workflow
version: 1
when_to_use: >
  Converting a completed Discovery artifact into explicit, testable
  requirements before Decomposition, Architecture, or Implementation.
---

# Specification Workflow

Use this workflow when a `DISC-*` artifact is ready for Specification.
Specification answers: "Given what Discovery established, what exactly
must be true for this work to be considered correct?"

The agent performs Specification directly using existing repository
artifacts, project memory, source references already captured by
Discovery, state, and traces. There is no Specification CLI, engine, state
machine, validator framework, or separate requirement framework.

## Steps

1. Read the source `DISC-*` artifact and its source `REQ-*` artifact.
2. Preserve the original request and route: `FOUNDATION`, `PROJECT` /
   `SEED_APP`, or `CROSS_CUTTING`.
3. Load the owning project/product brain when the route targets a project.
4. Extract only the Discovery findings, lenses, gaps, needs, risks,
   decisions, unknowns, and constraints that matter to Specification.
5. For each material Discovery finding, either transform it into a
   requirement, record why it does not become a requirement, or mark it as
   unresolved.
6. Write requirements as observable behavior or verifiable properties, not
   implementation steps.
7. Classify requirements only where useful: functional, non-functional,
   business rule, constraint, acceptance condition, non-goal, or
   unresolved decision.
8. Preserve traceability from requirement back to Discovery and Intake.
9. If Discovery leaves a material decision unresolved, create a draft
   Specification that names the blocker and prevents Decomposition.
10. Create one ordinary `SPEC-*` artifact under `.project/specs/` using
    `.project/ARTIFACT-TYPES.md` and `SPEC-017`.
11. Update the relevant `TRACE-*` record using `SPEC-013`.
12. Update `.project/state/PROJECT-STATE.md` only enough to show
    Specification status and the next allowed phase.
13. Stop at the Specification boundary.

## Boundary

Do not create a decomposition, feature task list, ADR, architecture
diagram, API contract, database schema, implementation plan, library
choice, source-code change, or application behavior from Specification.

Specification may require that a user can delete their own note. It must
not prescribe a route shape, controller name, collection/schema field, React
component name, or library that belongs to Architecture or Implementation.

If the source Discovery is `needs-clarification` and the unresolved
decision materially changes required behavior, keep the Specification
`draft`, record the unresolved decision, and stop.

## Validation

Use:

```bash
node --test tooling/tests/specification.test.mjs
```

The valid exit state is a Specification artifact that consumes Discovery,
records explicit testable requirements or unresolved blockers, preserves
traceability to Intake and Discovery, and states that Decomposition,
Architecture, and Implementation have not been started.
