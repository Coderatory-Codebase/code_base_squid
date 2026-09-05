---
id: PLAN-009
type: plan
title: Intake correction
status: complete
created: 2026-09-05
related: [SPEC-015, PLAN-008, TRACE-020]
---

# PLAN-009: Intake Correction

## Objective

Correct Phase 1 Intake so it proves the repository operating model rather
than a standalone Intake framework.

## Scope

- Inspect the current Intake diff before changing it.
- Preserve useful workflow/spec/artifact/trace work.
- Remove the standalone Intake CLI and helper contract module.
- Reframe the Intake contract as responsibilities, inputs, outputs,
  boundaries, and completion conditions.
- Make tests inspect real repository behavior: workflow, requirement
  artifact, state, trace, and downstream boundary.
- Verify the personal-notes Intake artifact does not manufacture product
  or technical decisions.

## Out of Scope

- Discovery or Phase 2.
- Feature specification, architecture, decomposition, tasks, or app code.
- A lifecycle engine or orchestration runtime.

## Outcome

Completed in `TRACE-020`.
