---
id: SPEC-017
type: spec
title: Specification lifecycle phase
status: active
created: 2026-09-05
related: [SPEC-010, SPEC-011, SPEC-013, SPEC-014, SPEC-015, SPEC-016, ADR-016]
---

# SPEC-017: Specification Lifecycle Phase

Operational entry point: `.agent/workflows/specification.md`.
Behavioral proof: `tooling/tests/specification.test.mjs`.

## Purpose

Specification is the third governed lifecycle phase:

```text
DISC-* artifact
  -> SPECIFICATION
  -> SPEC-* artifact
  -> DECOMPOSITION
```

Specification converts Discovery's evidence-backed understanding into an
explicit, testable definition of what must be true. It is the contract of
intended behavior, not the implementation design.

Specification consumes Discovery. It does not re-run Discovery as a fresh
investigation, and it does not decompose work, choose architecture, plan
implementation, or write code.

## Artifact Model

Specification produces an ordinary `SPEC-*` markdown artifact under
`.project/specs/`. This reuses the existing spec artifact type; it does
not create a second specification prefix, requirement registry, contract
system, schema framework, CLI, or lifecycle engine.

This governing lifecycle spec is `SPEC-017`. A work-item Specification
uses the next available `SPEC-*` identity and references the `DISC-*`
artifact that informed it.

Required content for a work-item Specification:

```text
id                         SPEC-###
type                       spec
title                      non-empty title
status                     draft or active
created                    YYYY-MM-DD
Source Discovery           DISC-### reference
Source Requirement         REQ-### reference
Original Request           preserved request text
Route                      FOUNDATION / PROJECT / CROSS_CUTTING
Specification Readiness    ready-for-decomposition, needs-clarification, or blocked
Discovery Inputs Used      findings/lenses/gaps/needs/risks used by the spec
Finding Treatment          requirement / non-goal / unresolved / not carried forward
Requirements               explicit, testable requirements when established
Functional Requirements    if supported by Discovery
Non-Functional Requirements if supported by Discovery
Business Rules             if supported by Discovery
Constraints                known restrictions and governing constraints
Acceptance Conditions      observable conditions demonstrating correctness
Non-Goals                  explicitly excluded behavior
Unresolved Decisions       decisions blocking a complete specification
Traceability               Request -> Intake -> Discovery -> Specification
Lifecycle State            specification status and next allowed phase
Boundary Check             downstream work explicitly not performed
```

Do not fill categories mechanically. Empty categories are named only when
their absence is important to the phase outcome.

## Transformation Rule

Every material Discovery finding must resolve to one of these outcomes:

- `requirement`: converted into explicit, testable behavior or property
- `constraint`: preserved as a governing restriction
- `acceptance condition`: converted into an observable proof condition
- `non-goal`: explicitly excluded from the current specified scope
- `unresolved`: blocked by missing product, technical, business, or
  security decision
- `not carried forward`: considered but not material, with a reason

This is traceability, not a new graph system. Use the existing `related:`
frontmatter and prose references unless a typed relationship is genuinely
needed under `SPEC-007`.

## Requirement Quality

Requirements must be testable without prescribing implementation.

Prefer:

```text
When an authenticated user requests their notes, only notes belonging to
that user are returned.
```

Avoid:

```text
Add GET /api/notes using Express and query MongoDB by userId.
```

Specification may define required behavior, security properties, privacy
properties, UX outcomes, accessibility behavior, data behavior, quality
expectations, constraints, and acceptance conditions. It must not choose
database schemas, route shapes, component names, library choices, folder
layouts, or implementation tasks.

## Incomplete Specification

If Discovery is `needs-clarification` or `blocked`, Specification must not
manufacture certainty.

When an unresolved decision materially affects required behavior:

- create a `draft` Specification
- record `Specification Readiness` as `needs-clarification` or `blocked`
- include the unresolved decisions and their impact
- carry forward only requirements that are actually justified
- explicitly state that Decomposition is not allowed yet

A `draft` Specification is still a valid phase output when it truthfully
records why the work cannot responsibly proceed.

## Boundary

Specification must not create:

- decomposition or engineering tasks
- implementation plans
- ADRs or architecture diagrams
- API contracts
- database schemas
- UI component designs
- technology/library choices
- source-code changes

If a later phase might need one of those, record it as a downstream need
or unresolved decision, not as Specification output.

## Failure Handling

Specification may end in:

- `active` / `ready-for-decomposition` when requirements are established
  well enough for the next phase
- `draft` / `needs-clarification` when a human decision is required
- `draft` / `blocked` when required Discovery/source evidence cannot be
  inspected

Do not advance to Decomposition unless the Specification is ready.

## Validation

`node --test tooling/tests/specification.test.mjs` checks the actual
Specification workflow, current work-item Specification, Discovery
consumption, requirement traceability, unresolved-decision preservation,
and boundary expectations. It also covers clear, security, UX,
accessibility, and ambiguous request cases as behavior tests.

## Status

`active` - governs Specification from M26 onward. Decomposition and later
phases are not implemented by this spec.
