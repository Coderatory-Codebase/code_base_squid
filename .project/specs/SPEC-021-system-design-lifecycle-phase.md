---
id: SPEC-021
type: spec
title: Feature-scoped system design lifecycle phase
status: active
created: 2026-09-05
related:
  [
    SPEC-007,
    SPEC-008,
    SPEC-010,
    SPEC-013,
    SPEC-018,
    SPEC-019,
    SPEC-020,
    DECOMP-001,
    ARCH-001,
    BACKLOG-014,
  ]
---

# SPEC-021: Feature-Scoped System Design Lifecycle Phase

Operational entry point: `.agent/workflows/system-design.md`.
Behavioral proof: `tooling/tests/system-design.test.mjs`.

## Purpose

System Design is the sixth governed lifecycle phase:

```text
ARCH-* high-level architecture
  + one selected eligible backlog Feature
  -> SYSTEM DESIGN
  -> SD-* artifact
  -> ENGINEERING DECOMPOSITION
```

System Design turns one selected Feature's approved scope and high-level
Architecture constraints into concrete behavioral and interaction design
sufficient for Engineering Decomposition. It does not design the whole
product and does not implement anything.

## Scope

System Design may describe:

- user/system interactions;
- request/response flows;
- component and service responsibilities within existing boundaries;
- API interaction and integration boundaries;
- domain/service behavior;
- data flow and persistence interaction;
- authentication, authorization, and ownership behavior;
- validation and error behavior;
- state transitions where genuinely required;
- observable behavior and testable scenarios;
- relevant non-functional behavior.

System Design stops before Engineering Decomposition, implementation
plans, `TASK-*`, source changes, coding, migrations, and unrelated Feature
design.

## Input Gate

System Design may begin only when:

- exactly one backlog item is selected as the Feature being designed;
- the backlog row exists in `.project/backlog/BACKLOG.md`;
- the row has `Level: feature` and `Kind: feature`;
- the row is eligible for design by existing backlog semantics (`ready` or
  `selected`);
- the row's parent/ancestry is valid when `Parent` is not `none`;
- the row has active source requirement coverage in the source
  Decomposition;
- the source Specification remains active and ready;
- the source Decomposition is complete and ready for Architecture;
- the source Architecture is complete and ready for feature-scoped System
  Design;
- the Architecture baseline maps or constrains the selected Feature.

If any gate fails, System Design is `blocked` or `needs-clarification`.
The agent routes the issue to the existing backlog, Specification,
Decomposition, or Architecture rework path. It must not invent a Feature,
registry, hierarchy, requirement, or architecture decision to proceed.

## Artifact Model

System Design produces one `SD-*` markdown artifact under
`.project/system-design/`. The prefix exists because this phase needs a
real selected-Feature design artifact. It is not a feature registry, task
list, implementation plan, job contract, API contract, database schema,
UI design document, or architecture replacement.

Required content:

```text
id                              SD-###
type                            system-design
title                           non-empty title
status                          complete, blocked, or needs-clarification
created                         YYYY-MM-DD
Selected Feature                exactly one BACKLOG-* Feature
Sources                         REQ/DISC/SPEC/DECOMP/BACKLOG/ARCH inputs
Scope                           feature-specific in/out boundaries
Actors                          relevant participants
Behavior                        concrete user/system behavior
Interaction Flows               end-to-end behavioral flows
System Responsibilities         boundary/component/service responsibilities
Data Flow                       data movement and persistence interaction
Authorization / Ownership       relevant access behavior
Validation / Error Behavior     accepted/rejected behavior
Observability / Testability     scenarios and evidence expectations
Architecture Consistency Check  compatible, clarification, or contradiction
Architectural Impact            none, clarification required, or change required
Unresolved Questions            blocking and non-blocking questions
Readiness                       ready-for-engineering-decomposition or blocked
Traceability                    request -> requirement -> feature -> design chain
Boundary Check                  downstream work explicitly not performed
```

Do not fill categories mechanically. Empty categories are named only when
their absence matters to readiness.

## Relationship to Architecture

`ARCH-*` is the high-level baseline. `SD-*` is a feature-scoped design
against that baseline.

System Design may determine:

- `compatible` — the design fits the Architecture baseline; record
  `Architectural Impact: none`;
- `clarification required` — a material product or architectural
  assumption is ambiguous; block Engineering Decomposition until resolved;
- `contradiction / change required` — the Feature needs a boundary,
  persistence model, ownership model, integration, responsibility change,
  or other decision that conflicts with current Architecture; block
  Engineering Decomposition and route to controlled Architecture
  re-evaluation.

System Design must not silently mutate `ARCH-*`, ADRs, or
`architecture.yaml`. A real architectural change follows the existing
decision/approval mechanism and then the selected Feature design is
re-evaluated.

## Feature Scope Rule

One `SD-*` designs exactly one backlog Feature. Parent epics and sibling
Features may be referenced only to establish scope, dependencies,
constraints, or contradictions. They must not receive their own behavior
flows, responsibilities, or readiness inside the selected Feature's
System Design.

## Traceability

System Design preserves the chain:

```text
Human Request
  -> REQ-*
  -> DISC-*
  -> SPEC-*
  -> DECOMP-*
  -> BACKLOG-* selected Feature
  -> ARCH-*
  -> SD-*
```

It must identify which active Specification requirements the selected
Feature realizes and which Architecture baseline decisions constrain the
design. This uses existing `related:` references, prose, and optional
typed relationship vocabulary from `SPEC-007`; no new traceability
mechanism is created.

## Boundary

System Design must not create:

- product-wide design;
- sibling Feature designs;
- Engineering Decomposition;
- Implementation Planning;
- Implementation work;
- `TASK-*`, jobs, or role-specific agent assignments;
- source-code changes;
- API/database/UI implementation changes;
- speculative infrastructure;
- new technology skills;
- feature registries, engines, state machines, CLIs, managers, or
  duplicate backlog/traceability/contract systems.

## Failure Handling

System Design may end in:

- `complete` / `ready-for-engineering-decomposition` when one selected
  Feature is designed and architecturally compatible;
- `needs-clarification` when a material product or architectural question
  blocks responsible design;
- `blocked` when upstream artifacts, Feature eligibility, requirement
  coverage, Architecture traceability, or evidence cannot be validated.

## Validation

`node --test tooling/tests/system-design.test.mjs` checks the workflow,
artifact convention, real `SD-001` execution for `BACKLOG-014`, Feature
eligibility, requirement traceability, Architecture baseline traceability,
compatible/clarification/contradiction behavior, scope boundaries,
downstream leakage, and compatibility with existing backlog, state,
Architecture, and traceability semantics.

## Status

`active` - governs Feature-scoped System Design from M26 onward.
Engineering Decomposition and later phases are not implemented by this
spec.
