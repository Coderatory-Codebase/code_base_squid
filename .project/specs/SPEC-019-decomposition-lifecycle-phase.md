---
id: SPEC-019
type: spec
title: Decomposition lifecycle phase
status: active
created: 2026-09-05
updated: 2026-09-05
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
progressively decomposed product scope units. Features are the primary
delivery-oriented units in this model: they are the product/value slices
that flow toward Architecture and eventual engineering execution. It
establishes what scope Architecture must later reason about. It does not
perform Architecture, Implementation Planning, Implementation,
Verification, Review, Delivery, or Operate.

`DECOMP-*` is the reasoning/evidence artifact for the phase. The product
units produced by Decomposition are represented in the existing single
backlog (`.project/backlog/BACKLOG.md`) using its `Level`, `Parent`,
`Kind`, `Status`, `Scope`, and `Owner` columns. Decomposition must not
create a second backlog, a `FEATURE-*` registry, or a work-management
state machine.

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
Product Hierarchy         only meaningful levels and product units
Backlog Representation    BACKLOG rows created/refined by decomposition
Features                  feature rows with purpose/value/evidence/boundaries
Supporting Units          non-feature capability/constraint/context units
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
  `feature`, `capability`, `story`, or `constraint`;
- backlog row mapping when the unit represents backlog-managed product
  work;
- purpose;
- product value;
- in-scope boundaries;
- out-of-scope boundaries;
- Specification requirement mappings;
- relevant Discovery evidence;
- relationship semantics, when meaningful;
- readiness notes for Architecture.

Use only as many levels as the work needs. The preferred shape is:

```text
PRODUCT OUTCOME
  -> EPIC / PRODUCT AREA
  -> FEATURE
  -> optional capability/story/requirement refinement
```

Do not equate `capability = feature`, `requirement = feature`, `backlog
item = feature`, or `engineering task = feature`. A backlog row may carry
`Level: feature`, but the row is still the repository's existing backlog
mechanism, not a new feature artifact type.

The stopping rule is:

```text
Stop when each resulting unit is coherent, bounded, understandable,
traceable to product intent, independently reasoned about, appropriately
sized for Architecture, and not merely a technical implementation task.
```

A decomposition that stops at generic capabilities when feature-level
product slices are justified is incomplete.

## Backlog Integration

Decomposition creates or refines ordinary rows in
`.project/backlog/BACKLOG.md`. It reuses the backlog model from
`SPEC-010`; it does not define a replacement model.

The backlog stores separate dimensions:

```text
Level   = hierarchy/sizing, such as epic or feature
Parent  = hierarchy/ancestry, such as BACKLOG-013
Status  = workflow state, such as captured or ready
Kind    = work kind, such as feature or technical
Scope   = FOUNDATION / PROJECT / CROSS_CUTTING
Owner   = repo or project id
```

Therefore this is valid:

```text
BACKLOG-014 | PROJECT | test | feature | BACKLOG-013 | ... | `ready`
```

and this is invalid:

```text
Feature -> ready -> in-progress -> review -> completed
```

because it confuses hierarchy with workflow state.

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

Not every requirement becomes a Feature. A requirement may deliberately
map to a Feature, an epic/product area, a capability, a constraint, a
cross-cutting concern, or artifact-level traceability. The mapping must be
explicit; no active requirement may silently disappear.

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
What user/product value units and Features make up the requested outcome?
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
`SPEC-018`, readiness gates, requirement coverage, feature presence,
existing-backlog integration, state/hierarchy separation, orphan-unit
detection, architecture and implementation leakage, hierarchy validity,
traceability, and upstream blocking behavior.

## Status

`active` - governs Decomposition from M26 onward. Architecture and later
phases are not implemented by this spec.
