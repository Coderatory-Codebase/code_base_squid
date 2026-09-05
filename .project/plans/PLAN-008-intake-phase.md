---
id: PLAN-008
type: plan
title: Intake lifecycle phase
status: superseded
created: 2026-09-05
related: [SPEC-015, SPEC-014, PLAN-009, TRACE-018, TRACE-020]
---

# PLAN-008: Intake Lifecycle Phase

## Objective

Implement and prove only Phase 1: Intake.

## Scope

- Research existing architecture before changes.
- Define a `REQ-*` Intake artifact contract using existing artifact
  conventions.
- Add an agent Intake workflow.
- Add a small executable creator/validator.
- Add automated tests, including malformed artifact and transition cases.
- Execute one real Intake example for "Add personal notes functionality to
  the test application."

## Out of Scope

- Discovery or later lifecycle phases.
- A lifecycle/orchestration engine.
- Feature architecture, implementation tasks, schema, API design, or app
  code for the sample request.
- A project-management UI or database.

## Acceptance Criteria

- A valid Intake artifact is produced and validated.
- Original intent is preserved.
- Facts, unknowns, and assumptions are separated.
- Traceability exists.
- Downstream boundary flags remain false.
- Tests cover normal, vague, minimal, technical, boundary-attack, invalid
  artifact, and invalid transition cases.

## Outcome

Superseded by `PLAN-009` during the same M26 correction before commit. The
useful parts remain: `SPEC-015`, `.agent/workflows/intake.md`, `REQ-*`
artifacts, and behavioral tests. The standalone Intake CLI/contract
framework from this plan was removed because it duplicated the existing
artifact, state, trace, and workflow mechanisms.
