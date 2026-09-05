---
id: SPEC-015
type: spec
title: Intake lifecycle phase
status: active
created: 2026-09-05
related: [SPEC-003, SPEC-004, SPEC-010, SPEC-013, SPEC-014, ADR-010, ADR-011, ADR-016]
---

# SPEC-015: Intake Lifecycle Phase

Operational entry point: `.agent/workflows/intake.md`.
Behavioral proof: `tooling/tests/intake.test.mjs`.

## Purpose

Intake is the first governed phase for raw business/product input:

```text
BUSINESS / PRODUCT INPUT
  -> INTAKE
  -> REQ-* artifact
  -> DISCOVERY
```

Intake captures the request. It does not perform Discovery, Specification,
Decomposition, Architecture, Implementation, Verification, Review,
Delivery, Operate, or Feedback.

## Artifact Contract

Intake produces one `REQ-*` markdown artifact under `.project/requirements/`.
The artifact follows repository artifact conventions: YAML frontmatter,
stable identity, status, creation date, and `related:` references.

Here, "contract" means responsibilities, inputs, outputs, boundaries, and
completion conditions. It is not a standalone executable contract
framework, lifecycle engine, or Intake-specific CLI.

Required fields:

```text
id                  REQ-###
type                requirement
title               non-empty request title
status              captured
created             YYYY-MM-DD
Original Request    original request text
Desired Outcome     captured from the request, not invented downstream
Source              type/reference
Facts               explicitly supplied information
Known Context       supplied context
Known Constraints   supplied or governing constraints
Unknowns            information not established yet
Assumptions         inferred but unvalidated information, if any
Explicit Scope      Intake-only work
Explicit Non-Goals  downstream phases explicitly excluded
Lifecycle State     intake captured, discovery next
Traceability        TRACE-### reference
Boundary Check      downstream work explicitly not performed
```

Facts, unknowns, and assumptions are distinct. Intake must not convert an
assumption into a fact.

## Transition

Phase 1 implements only this transition:

```text
input -> intake/captured -> discovery
```

The transition is valid only when the Intake artifact has identity,
preserves the original request, records desired outcome/source, separates
knowns from unknowns/assumptions, has traceability, and records that
downstream work did not occur.

## Boundary

Intake must not:

- inspect implementation details unnecessarily
- design a technical solution
- create feature ADRs
- create implementation tasks
- write application code
- invent acceptance criteria, schema, API design, or technology decisions
- claim unknown requirements are known
- perform Discovery while calling it Intake

Missing information is recorded as `unknowns` or, when clearly inferred
but unvalidated, `assumptions`.

## Validation

`node --test tooling/tests/intake.test.mjs` checks the actual Intake
workflow, current `REQ-*` artifact, trace/state records, and boundary
expectations. It also covers vague, minimal, technical, and boundary-attack
requests as negative behavior cases.

## Status

`active` — governs Intake from M26 onward. Discovery and later phases are
not implemented by this spec.
