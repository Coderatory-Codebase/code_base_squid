---
name: discovery
type: workflow
version: 1
when_to_use: >
  Investigating a completed Intake requirement before Specification,
  Decomposition, Architecture, or Implementation.
---

# Discovery Workflow

Use this workflow when a `REQ-*` artifact is ready for Discovery. Discovery
answers: "What do we need to understand before we can responsibly specify
this work?"

The agent performs Discovery directly using existing repository artifacts,
project memory, source inspection, evidence references, state, and traces.
There is no Discovery CLI, engine, state machine, or separate contract
framework.

## Steps

1. Read the source `REQ-*` artifact and preserve its original request.
2. Confirm the request route: `FOUNDATION`, `PROJECT` / `SEED_APP`, or
   `CROSS_CUTTING`.
3. Load the owning project/product brain when the route targets a project.
4. Select only the Discovery jobs that are necessary:
   - repository/context investigation
   - requirements clarification
   - dependency investigation
   - risk/constraint investigation
5. Inspect relevant repository artifacts and source files.
6. Record evidence-backed facts separately from inferences, assumptions,
   unknowns, risks, dependencies, contradictions, and open questions.
7. Create one `DISC-*` artifact under `.project/discovery/` using
   `.project/ARTIFACT-TYPES.md` and `SPEC-016`.
8. Update the relevant `TRACE-*` record using `SPEC-013`.
9. Update `.project/state/PROJECT-STATE.md` only enough to show Discovery
   is complete and the next allowed phase is Specification.
10. Stop at the Discovery boundary.

## Boundary

Do not create a feature SPEC, ADR, PLAN, TASK, API contract, database
schema, architecture diagram, implementation job, or source-code change
from Discovery. Do not turn a requested or possible technical direction
into a validated decision unless the evidence actually establishes it.

If a significant question remains unresolved, keep it as an unknown or
open question. If evidence conflicts, surface the contradiction and mark it
as requiring clarification or decision.

## Validation

Use:

```bash
node --test tooling/tests/discovery.test.mjs
```

The valid exit state is a Discovery artifact whose lifecycle section says
Discovery is complete, Specification is next, and Specification/
Decomposition/Architecture/Implementation have not been started.
