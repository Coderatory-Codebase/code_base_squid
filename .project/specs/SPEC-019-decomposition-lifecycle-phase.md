---
id: SPEC-019
type: spec
title: Decomposition lifecycle phase
status: active
created: 2026-09-05
related: [SPEC-007, SPEC-010, SPEC-013, SPEC-017, SPEC-018, ADR-016]
---

# SPEC-019: Decomposition Lifecycle Phase

Operational entry point: `.agent/workflows/decomposition.md`.
Behavioral proof: `tooling/tests/decomposition.test.mjs`.

## Purpose

Decomposition is the fourth governed lifecycle phase:

```text
SPEC-* artifact
  -> DECOMPOSITION
  -> DECOMP-* artifact
  -> ARCHITECTURE
```

Decomposition transforms a ready Specification into coherent,
progressively decomposed product/system scope units. It establishes what
scope Architecture must later reason about. It does not perform
Architecture, Implementation Planning, Implementation, Verification,
Review, Delivery, or Operate.

## Input Gate

Decomposition may begin only when the source work-item Specification is:

- `status: active`;
- `Specification Readiness: ready-for-decomposition`.

If the source Specification is `draft`, inactive, `needs-clarification`,
or `blocked`, Decomposition is blocked. The agent must route the issue
upstream through the existing Specification/Discovery clarification and
rework path instead of inventing scope.

## Artifact Model

Decomposition produces one `DECOMP-*` markdown artifact under
`.project/decomposition/`. The prefix exists because Phase 4 now has a
real artifact, not because the repository is creating a second backlog,
feature registry, job-contract system, or lifecycle engine.

Required content:

```text
id                        DECOMP-###
type                      decomposition
title                     non-empty title
status                    complete, blocked, or needs-clarification
created                   YYYY-MM-DD
Source Specification      SPEC-### reference and readiness
Source Discovery          DISC-### reference when relevant
Outcome                   specified outcome being decomposed
Decomposition Readiness   ready-for-architecture, needs-clarification, or blocked
Hierarchy                 only meaningful levels and units
Units                     unit ID, type, purpose, scope, boundaries
Requirement Coverage      every active SPEC requirement accounted for
Relationships             parent/child, depends-on, related-to where meaningful
Architecture Handoff      what Architecture must reason about later
Assumptions               labeled, if any
Unresolved Questions      blockers or future questions
Non-Goals                 inactive/speculative scope excluded
Traceability              Requirement -> Decomposition Unit and Spec -> Decomp
Lifecycle State           decomposition status and next allowed phase
Boundary Check            downstream work explicitly not performed
```

Do not fill categories mechanically. Empty categories are named only when
their absence is important to the phase outcome.

## Unit Semantics

A decomposition unit is product/system scope, not an engineering task.

Each unit has:

- stable identity inside the artifact, e.g. `DECOMP-001-U001`;
- type, chosen only when useful: `outcome`, `initiative`, `epic`,
  `feature`, `capability`, or `story`;
- purpose;
- in-scope boundaries;
- out-of-scope boundaries;
- Specification requirement mappings;
- relationship semantics, when meaningful;
- readiness notes for Architecture.

Use only as many levels as the work needs. The stopping rule is:

```text
Stop decomposing when the resulting units are coherent, bounded,
understandable, and independently reasoned about enough for Architecture.
```

## Requirement Coverage

Every active Specification requirement must be accounted for. For each
requirement, Decomposition records whether it:

- maps directly to one or more units;
- is inherently represented by another unit;
- requires no separate decomposition unit, with rationale;
- cannot yet be decomposed and therefore blocks Decomposition.

Every decomposition unit must be justified by at least one active
Specification requirement. Candidate requirements and non-goals may define
boundaries, but they do not create units by themselves.

## Relationship Semantics

Use existing graph semantics from `SPEC-007`:

- `parent/child`: hierarchy inside the decomposed scope;
- `depends-on`: a unit cannot be reasoned about or realized without
  another unit;
- `related-to`: ordinary contextual relationship with no dependency.

Do not create dependencies for polish. Do not turn `related:` frontmatter
into typed graph edges unless a real semantic edge is needed.

## Product vs. Engineering Decomposition

Product decomposition answers:

```text
What coherent capabilities/scope make up the requested outcome?
```

Engineering decomposition answers:

```text
What implementation work must engineers perform?
```

Phase 4 performs product/system decomposition only. It must not produce
endpoint lists, schema lists, component lists, migrations, test files,
coding tasks, tickets, or implementation plans.

## Architecture Handoff

The output of Decomposition gives Architecture a scope map:

```text
DECOMPOSITION
  -> What capabilities/scope exist?
ARCHITECTURE
  -> What technical structure realizes them?
```

Architecture may later use Discovery evidence about current architecture,
system boundaries, dependencies, reusable capabilities, integrations, and
technical constraints. Decomposition may reference that evidence as
context, but it must not make final architectural decisions.

## Failure Handling

Decomposition may end in:

- `complete` / `ready-for-architecture` when the scope is decomposed
  enough for Architecture;
- `needs-clarification` when Specification is ready on paper but a
  material scope ambiguity prevents responsible decomposition;
- `blocked` when the source Specification is not active/ready or required
  source evidence cannot be inspected.

Do not advance to Architecture unless Decomposition is
`ready-for-architecture`.

## Boundary

Decomposition must not create:

- Architecture / Phase 5 artifacts
- Implementation Planning
- Implementation work
- TASK artifacts or engineering task lists
- API contracts
- database schemas
- UI component designs
- technology/library/framework choices
- source-code changes
- role-scoped agents
- jobs, skills, CLIs, engines, or state machines
- a second backlog/work-item/job-contract system

## Validation

`node --test tooling/tests/decomposition.test.mjs` checks the actual
Decomposition workflow, artifact convention, `DECOMP-001` execution from
`SPEC-018`, readiness gates, requirement coverage, orphan-unit detection,
architecture and implementation leakage, hierarchy validity, traceability,
and upstream blocking behavior.

## Status

`active` - governs Decomposition from M26 onward. Architecture and later
phases are not implemented by this spec.
