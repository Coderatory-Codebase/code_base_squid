---
id: SPEC-017
type: spec
title: Specification lifecycle phase
status: active
created: 2026-09-05
updated: 2026-09-05
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

If Specification exposes a material unresolved input, it may stop with a
controlled clarification/rework path. That path returns to the appropriate
upstream phase before Specification is revised when the missing information
changes upstream understanding.

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
Clarification / Rework     required when readiness is not ready
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

## Clarification and Rework

Clarification is not a new lifecycle phase. It is the interaction/control
path used when a lifecycle input is missing or ambiguous. Specification
must distinguish the return point:

| Unresolved issue                                                                 | Return upstream to         | Reason                                                                            |
| -------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| Captured request, route, owner, or product intent is wrong or materially changed | Intake, then Discovery     | The raw input record or its route must change before evidence is re-evaluated.    |
| Current-state evidence is missing, stale, or contradicted                        | Discovery                  | Discovery owns evidence-backed understanding of current state.                    |
| Clarified product or technical fact changes the understanding of the work        | Discovery                  | Specification may only consume facts already represented by upstream evidence.    |
| Requirement wording needs tightening but upstream understanding is unchanged     | Specification              | The spec can be revised directly if it does not assert a new upstream fact.       |
| Clarification fails to answer the blocker                                        | Same blocked Specification | Readiness stays `needs-clarification` or `blocked`; no requirements are invented. |

The semantic rule is:

```text
clarification
  -> upstream understanding updated when needed
  -> Specification revised
  -> ready or still blocked
```

Do not edit a downstream Specification to claim certainty that the source
Discovery does not support.

This repository does not yet have a formal revision artifact type. Rework
therefore uses the smallest existing convention:

- update the same artifact in place when it is still the same work item;
- add `updated: YYYY-MM-DD`;
- preserve the earlier outcome in a "Rework History" or
  "Initial Outcome" section;
- record who/what supplied the clarification and which artifact changed in
  the relevant `TRACE-*`;
- create a replacement artifact and mark the old one `superseded` only
  when the clarification changes the work item's identity.

## Readiness Gate

Decomposition may consume only a work-item Specification that is:

- `status: active`;
- `Specification Readiness: ready-for-decomposition`;
- traceable to source Intake and Discovery;
- not contradicted by unresolved decisions that affect the selected scope.

`draft`, `needs-clarification`, and `blocked` Specifications are not valid
Decomposition input, even if they contain candidate requirements or useful
analysis.

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
