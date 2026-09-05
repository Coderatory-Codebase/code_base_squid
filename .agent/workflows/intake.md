---
name: intake
type: workflow
version: 1
when_to_use: >
  Capturing raw business/product input before Discovery, Specification,
  Decomposition, Architecture, or Implementation.
---

# Intake Workflow

Use this workflow when the task is to capture a request as Intake. It is a
governed lifecycle phase, not a Discovery or implementation shortcut.
The agent performs these steps directly using the repository's existing
artifact, state, and trace conventions. There is no standalone Intake CLI
or lifecycle engine.

## Steps

1. Receive the original request and preserve its wording.
2. Record a concise request title.
3. Capture the desired outcome only as far as the request supports it.
4. Record the source.
5. Separate facts, known context, known constraints, unknowns, and
   assumptions.
6. Capture supplied in-scope and out-of-scope information.
7. Create or update one `REQ-*` artifact under `.project/requirements/`
   using `.project/ARTIFACT-TYPES.md` and `SPEC-015`.
8. Create or update the relevant `TRACE-*` record using `SPEC-013`.
9. Update `.project/state/PROJECT-STATE.md` only enough to show Intake was
   captured and the next allowed phase is Discovery.
10. Stop at the Intake boundary.

## Boundary

Do not perform Discovery, Specification, Decomposition, Architecture,
Implementation, Verification, Delivery, Operate, or Feedback. Do not
create implementation tasks, feature ADRs, database schema, API design,
acceptance criteria, or code from Intake.

If information is missing, write it as an unknown. If something is
inferred but not validated, write it as an assumption. Never promote an
assumption into a fact.

## Validation

Use:

```bash
node --test tooling/tests/intake.test.mjs
```

The valid exit state is an Intake artifact whose lifecycle section says
Intake is captured, Discovery is next, and Discovery/Specification/
Decomposition/Architecture/Implementation have not been executed.
