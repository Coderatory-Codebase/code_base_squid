---
name: specification
type: workflow
version: 1
when_to_use: >
  Converting a completed Discovery artifact into explicit, testable
  requirements before Decomposition, Architecture, or Implementation.
---

# Specification Workflow

Use this workflow when a `DISC-*` artifact is ready for Specification, or
when a blocked Specification receives clarification that must be evaluated
against its upstream Discovery. Specification answers: "Given what
Discovery established, what exactly must be true for this work to be
considered correct?"

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
   Specification that names the blocker, the clarification needed, the
   appropriate upstream return point, and the downstream phase it blocks.
10. Create one ordinary `SPEC-*` artifact under `.project/specs/` using
    `.project/ARTIFACT-TYPES.md` and `SPEC-017`.
11. Update the relevant `TRACE-*` record using `SPEC-013`.
12. Update `.project/state/PROJECT-STATE.md` only enough to show
    Specification status and the next allowed phase.
13. Stop at the Specification boundary.

## Clarification / Rework Path

Clarification is a control path, not a lifecycle phase. Do not create a
clarification engine, state machine, CLI, framework, or new artifact type
unless a future concrete need proves the existing artifact model cannot
represent the work.

When Specification cannot become ready, distinguish the missing input:

| Missing input                                                     | Return point               | Required handling                                                                 |
| ----------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| Original request, owner, route, or intent changed                 | Intake, then Discovery     | Rework the `REQ-*` if the captured request itself changed; then rework Discovery. |
| Current-state evidence is missing or stale                        | Discovery                  | Inspect only the targeted evidence and update the `DISC-*` before revising SPEC.  |
| Technical/product fact belongs to understanding                   | Discovery                  | Record the clarified fact in Discovery first; Specification consumes it after.    |
| Requirement wording is ambiguous but Discovery remains sufficient | Specification              | Revise the `SPEC-*` directly and trace why no upstream artifact changed.          |
| Clarification does not resolve the blocker                        | Same blocked Specification | Keep readiness `needs-clarification` or `blocked`; do not invent requirements.    |

A downstream artifact must not claim certainty that its upstream evidence
does not support. If a clarification changes Discovery-level understanding,
revise Discovery first, then revise Specification.

Rework uses the existing artifact model:

- If the same artifact still represents the same work item, update it in
  place, add `updated: YYYY-MM-DD`, and add a clear rework/history section.
- If the new understanding replaces the old work item, create the next
  ordinary artifact and mark the old one `superseded` with references.
- In both cases, record the clarification/rework event in `TRACE-*`.

Use targeted context only: current work item, current lifecycle artifact,
upstream artifact, relevant trace/state, the specific clarification, and
targeted evidence. Expand only when the evidence requires it.

## Boundary

Do not create a decomposition, feature task list, ADR, architecture
diagram, API contract, database schema, implementation plan, library
choice, source-code change, or application behavior from Specification.

Specification may require that a user can delete their own note. It must
not prescribe a route shape, controller name, collection/schema field, React
component name, or library that belongs to Architecture or Implementation.

If the source Discovery is `needs-clarification` and the unresolved
decision materially changes required behavior, keep the Specification
`draft`, record the unresolved decision, identify the upstream return
point, and stop unless a concrete clarification is already available. If a
clarification is available and changes Discovery-level understanding,
update Discovery before revising the Specification.

## Validation

Use:

```bash
node --test tooling/tests/specification.test.mjs
```

The valid exit state is a Specification artifact that consumes Discovery,
records explicit testable requirements or unresolved blockers, preserves
traceability to Intake and Discovery, and states that Decomposition,
Architecture, and Implementation have not been started.
