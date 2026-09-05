---
id: SPEC-020
type: spec
title: Architecture lifecycle phase
status: active
created: 2026-09-05
related:
  [
    SPEC-007,
    SPEC-008,
    SPEC-010,
    SPEC-013,
    SPEC-017,
    SPEC-019,
    SPEC-018,
    DECOMP-001,
    ADR-012,
    ADR-013,
    ADR-014,
    ADR-016,
  ]
---

# SPEC-020: Architecture Lifecycle Phase

Operational entry point: `.agent/workflows/architecture.md`.
Behavioral proof: `tooling/tests/architecture.test.mjs`.

## Purpose

Architecture is the fifth governed lifecycle phase:

```text
DISC-* evidence
  + SPEC-* requirements
  + DECOMP-* product Features
  -> ARCHITECTURE
  -> ARCH-* artifact
  -> IMPLEMENTATION PLANNING
```

Architecture decides how the system should realize approved product
Features given discovered technical reality and existing repository
boundaries. It is a design-decision phase, not a blank-page rediscovery
phase and not implementation planning.

## Input Gate

Architecture may begin only when:

- the source Specification is `active`;
- the source Specification remains ready for downstream lifecycle use;
- the source Decomposition is `complete`;
- `Decomposition Readiness` is `ready-for-architecture`;
- decomposed Feature rows exist in the existing backlog when the work is
  product/feature scoped;
- required Discovery evidence can be inspected.

If any gate fails, Architecture is blocked and must route upstream through
the existing clarification/rework path. Do not invent architecture to hide
missing requirements, missing Feature traceability, or unresolved
Decomposition.

## Artifact Model

Architecture produces one `ARCH-*` markdown artifact under
`.project/architecture/`. The prefix exists because Phase 5 needs a real
phase output. It is not a replacement for `architecture.yaml`, ADRs,
backlog rows, contracts, diagrams, or implementation plans.

Required content:

```text
id                         ARCH-###
type                       architecture
title                      non-empty title
status                     complete, blocked, or needs-clarification
created                    YYYY-MM-DD
Inputs                     DISC/SPEC/DECOMP/backlog inputs consumed
Architecture Readiness     ready-for-implementation-planning, blocked, or needs-clarification
Context                    product outcome and Features being architected
Current State              existing technical architecture and evidence
Target State               selected architectural structure
Boundaries                 relevant system/domain/data/security/integration/runtime boundaries
Feature Mapping            Features -> architectural responsibilities
Decisions                  meaningful architecture decisions with evidence/rationale
Trade-Offs                 relevant trade-offs, not generic boilerplate
Constraints                requirements and boundaries the architecture preserves
Risks / Open Decisions     unresolved matters kept explicit
Downstream Handoff         information available to Implementation Planning
Traceability               DISC -> SPEC -> DECOMP -> ARCH
Lifecycle State            architecture status and next allowed phase
Boundary Check             downstream work explicitly not performed
```

Do not fill categories mechanically. Empty categories are named only when
their absence matters to the phase result.

## Relationship to ADRs and `architecture.yaml`

`architecture.yaml` remains the current repository architecture and
boundary source of truth. ADRs remain the durable record for significant
architectural decisions that outlive one Architecture artifact or change
repository/project rules. `ARCH-*` records the architecture phase result
for a specific work item: inputs, current state, target state, Feature
mapping, decisions, trade-offs, risks, and handoff.

Create an ADR only when the Architecture phase makes a material new
decision between real alternatives. Do not create ADRs mechanically for
every architectural sentence. If existing ADRs already govern the relevant
boundary, reference them.

## Evidence-First Architecture

Architecture must reason from upstream artifacts:

```text
Discovery finding
  -> architectural implication
  -> architectural decision
```

Targeted source inspection may confirm Discovery evidence. Architecture
must not rerun broad Discovery or ignore Discovery in favor of a fresh
guess.

## Feature Mapping

Architecture maps product Features to technical responsibilities and
boundaries:

```text
Feature
  -> architectural boundary
  -> existing/new technical responsibility
```

This mapping is not one-to-one. Multiple Features may use one
architectural boundary, and one Feature may cross multiple boundaries.
Do not create a technical component merely to mirror a product Feature.

## Decision Quality

For each meaningful architecture decision, record:

- decision;
- context;
- evidence;
- options considered, where useful;
- selected approach;
- rationale;
- consequences;
- affected Features;
- affected boundaries;
- unresolved risks/questions, if any.

Relevant trade-offs may include reuse vs. new construction, coupling vs.
isolation, simplicity vs. extensibility, security vs. convenience,
synchronous vs. asynchronous communication, centralization vs.
distribution, consistency vs. availability, or performance vs. complexity.
Discuss only trade-offs that matter to the actual case.

## Boundary

Architecture may specify required technical structure:

- existing boundaries to reuse;
- new or changed boundaries if justified;
- ownership and dependency direction;
- data ownership and integration responsibility;
- security/trust boundaries;
- runtime/deployment assumptions and unresolved topology questions;
- architectural constraints and risks.

Architecture must not create:

- Implementation Planning
- Implementation work
- engineering tasks or jobs
- API implementation checklists
- database implementation changes
- UI implementation steps
- source-code changes
- role-scoped agents
- jobs, skills, CLIs, engines, registries, managers, or state machines
- duplicate ADR, backlog, contract, graph, or traceability systems

## Failure Handling

Architecture may end in:

- `complete` / `ready-for-implementation-planning` when architecture is
  established enough for the next phase;
- `needs-clarification` when a material architectural ambiguity prevents
  responsible handoff;
- `blocked` when required upstream inputs or evidence cannot be inspected.

Unresolved questions that do not block the selected scope remain explicit
risks/open decisions rather than guessed away.

## Validation

`node --test tooling/tests/architecture.test.mjs` checks the actual
Architecture workflow, artifact convention, `ARCH-001` execution from
`DISC-001` / `SPEC-018` / `DECOMP-001`, upstream gates, Feature coverage,
current-state grounding, evidence-backed decisions, reuse behavior,
product-vs-technical boundary separation, non-one-to-one mapping, open
decision handling, downstream handoff, and implementation boundary.

## Status

`active` - governs Architecture from M26 onward. Implementation Planning
and later phases are not implemented by this spec.
