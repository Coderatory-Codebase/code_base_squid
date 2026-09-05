---
id: SPEC-022
type: spec
title: Feature-scoped engineering decomposition lifecycle phase
status: active
created: 2026-09-05
related:
  [
    SPEC-007,
    SPEC-010,
    SPEC-013,
    SPEC-018,
    SPEC-019,
    SPEC-020,
    SPEC-021,
    DECOMP-001,
    ARCH-001,
    SD-001,
    BACKLOG-014,
  ]
---

# SPEC-022: Feature-Scoped Engineering Decomposition Lifecycle Phase

Operational entry point:
`.agent/workflows/engineering-decomposition.md`.
Behavioral proof: `tooling/tests/engineering-decomposition.test.mjs`.

## Purpose

Engineering Decomposition is the seventh governed lifecycle phase:

```text
SD-* approved Feature System Design
  + selected backlog Feature
  + Architecture baseline
  -> ENGINEERING DECOMPOSITION
  -> ENG-* artifact
  -> IMPLEMENTATION
```

Engineering Decomposition turns one approved Feature System Design into
concrete, executable engineering work. It preserves enough context for an
implementation agent to begin without rediscovering the design, while
stopping before code changes and runtime execution.

## Scope

Engineering Decomposition may describe:

- engineering scope and explicit implementation boundaries;
- responsibility-level work items;
- affected existing source boundaries when needed for execution context;
- dependency and sequencing relationships;
- actual implementation delta implied by the current codebase;
- verification expectations derived from System Design behavior;
- acceptance relationship to the source Specification and System Design;
- readiness for Implementation.

Engineering Decomposition stops before source edits, code, API/database/UI
implementation changes, implementation commits, Verification, Review,
Delivery, and Operate.

## Input Gate

Engineering Decomposition may begin only when:

- exactly one backlog item is selected as the Feature being decomposed;
- the backlog row exists in `.project/backlog/BACKLOG.md`;
- the row has `Level: feature` and `Kind: feature`;
- the row is eligible by existing backlog semantics (`ready` or
  `selected`);
- the source Specification is active and ready;
- the source Decomposition is complete and maps the Feature to active
  requirements;
- the source Architecture is complete and no unresolved architectural
  contradiction applies to the Feature;
- exactly one complete `SD-*` artifact exists for the Feature;
- the source System Design has readiness
  `ready-for-engineering-decomposition`;
- the source System Design has architectural impact resolved or explicitly
  `none`.

If any gate fails, Engineering Decomposition is `blocked` and routes to
the appropriate existing rework path. It must not invent a Feature,
requirement, architecture decision, task system, job contract, or
implementation plan to proceed.

## Artifact Model

Engineering Decomposition produces one `ENG-*` markdown artifact under
`.project/engineering/`. The prefix exists because this phase needs a
durable, implementation-ready engineering work breakdown distinct from
product Decomposition, System Design, `PLAN-*`, and `TASK-*`.

Required content:

```text
id                              ENG-###
type                            engineering-decomposition
title                           non-empty title
status                          complete, blocked, or needs-clarification
created                         YYYY-MM-DD
Selected Feature                exactly one BACKLOG-* Feature
Sources                         REQ/DISC/SPEC/DECOMP/BACKLOG/ARCH/SD inputs
Engineering Scope               in/out engineering boundaries
Existing Code Evidence          targeted source facts used
Actual Delta                    change or preservation work implied
Engineering Work Items          executable work units with traceability
Dependencies / Sequencing       parallel and ordered relationships
Affected System Areas           existing project-owned boundaries
Verification Expectations       expected proof for future verification
Acceptance Relationship         Specification and System Design coverage
Architecture Consistency Check  compatible, clarification, or contradiction
Readiness                       ready-for-implementation or blocked
Boundary Check                  implementation and duplicate-system exclusions
```

Do not fill categories mechanically. Empty categories are named only when
their absence matters to readiness.

## Work Item Rule

An engineering work item is not a `TASK-*` artifact and not a backlog row.
It is an item inside one `ENG-*` artifact. Each item must identify:

- target area;
- responsibility;
- intended change or preservation requirement;
- relevant existing boundary or file set when useful;
- dependencies;
- expected outcome;
- verification expectation;
- traceability to source System Design behavior/responsibility.

Items are too vague if they only say "implement notes", "update backend",
"fix frontend", or "add tests". Items are too detailed if they prescribe
individual code statements, line edits, commands, or implementation
syntax that belongs to the implementation agent.

## Relationship to Adjacent Phases

Product Decomposition (`DECOMP-*`) decides product scope units and backlog
Feature hierarchy.

System Design (`SD-*`) decides how one Feature should behave inside the
approved Architecture.

Engineering Decomposition (`ENG-*`) decides what executable engineering
work is required to make that one approved design real.

Implementation writes the code and executes the engineering work. `TASK-*`
artifacts remain optional and are created only when existing
`ARTIFACT-TYPES.md` criteria are met.

## Feature Scope Rule

One `ENG-*` decomposes exactly one backlog Feature. Parent epics and
sibling Features may be referenced only to establish scope, constraints,
dependencies, or contradictions. They must not receive their own work
items, readiness, or implementation scope inside the selected Feature's
Engineering Decomposition.

## Traceability

Engineering Decomposition preserves the chain:

```text
Human Request
  -> REQ-*
  -> DISC-*
  -> SPEC-*
  -> DECOMP-*
  -> BACKLOG-* selected Feature
  -> ARCH-*
  -> SD-*
  -> ENG-*
```

Every engineering work item must trace to an approved System Design
behavior or responsibility and through that to active Specification
requirements. Orphan engineering work is invalid.

## Architectural Feedback Control

Engineering Decomposition cannot silently make Architecture decisions. If
work requires a new boundary, store, service, package, contract placement,
ownership model, runtime, integration pattern, or other Architecture
change not approved by `ARCH-*` and `SD-*`, the decomposition is blocked.
The next step is controlled Architecture/System Design rework, followed
by re-evaluating the Engineering Decomposition.

## Boundary

Engineering Decomposition must not create:

- product-wide engineering decomposition;
- sibling Feature decomposition;
- implementation code;
- source-code changes;
- implementation commits;
- `TASK-*`, job contracts, role-specific agent assignments, or execution
  jobs;
- new backlog, task, contract, state-machine, registry, or traceability
  systems;
- agent runtimes, role frameworks, orchestration engines, CLIs, managers,
  or schedulers.

## Failure Handling

Engineering Decomposition may end in:

- `complete` / `ready-for-implementation` when one selected Feature is
  fully decomposed into executable work, traceability is intact,
  dependencies are understood, and architectural impact is resolved;
- `needs-clarification` when a material product or design question blocks
  responsible decomposition;
- `blocked` when upstream artifacts, Feature eligibility, requirement
  coverage, System Design readiness, Architecture compatibility, work-item
  traceability, dependency correctness, or verification coverage cannot be
  validated.

## Validation

`node --test tooling/tests/engineering-decomposition.test.mjs` checks the
workflow, artifact convention, real `ENG-001` execution for
`BACKLOG-014`, upstream readiness, feature isolation, work-item
traceability, requirement coverage, orphan-work detection, architectural
consistency, dependency correctness, granularity, verification
expectations, downstream boundary preservation, and compatibility with
the existing backlog, state, Architecture, System Design, and
traceability models.

## Status

`active` - governs Feature-scoped Engineering Decomposition from M26
onward. Implementation and later phases are not implemented by this spec.
