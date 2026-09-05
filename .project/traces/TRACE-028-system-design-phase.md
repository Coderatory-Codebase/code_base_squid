---
id: TRACE-028
type: trace
title: Feature-scoped system design lifecycle phase
status: completed
created: 2026-09-05
related:
  [PLAN-017, SPEC-021, SD-001, ARCH-001, BACKLOG-014, DECOMP-001, SPEC-018, DISC-001, REQ-001]
---

# TRACE-028: Feature-Scoped System Design Lifecycle Phase

## Request

Implement and prove Phase 6 - Feature-Scoped System Design - as an
operating-model milestone after high-level Architecture. Use
`BACKLOG-014` as the real selected Feature. Do not design sibling
Features, create Engineering Decomposition, or modify application source.

## Classification

`FOUNDATION` for the lifecycle implementation.

The real System Design execution also uses `PROJECT / test` context
because the selected Feature is `BACKLOG-014`, a project/product Feature
owned by the `test` seed application.

## Existing Mechanisms Inspected

- `AGENTS.md`, `.agent/README.md`, `.project/README.md`, README, and
  `.agent/instructions/agent-operating-contract.md`.
- Existing workflows under `.agent/workflows/`, especially
  `architecture.md`.
- Existing `.agent/instructions/` relevant to lifecycle, backlog,
  engineering standards, traceability, technology guidance, packages, and
  contracts.
- `.agent/skills/`; no new technology skill was warranted.
- `architecture.yaml` and `.project/state/PROJECT-STATE.md`.
- `.project/ARTIFACT-TYPES.md`.
- `SPEC-010` for the M15 backlog and feature model.
- Searches for `M34` and Job Contract model references. No instantiated
  M34 milestone or active Job Contract artifact model exists in this
  repository; existing references treat job contracts as non-goals for
  these lifecycle phases.
- `DISC-001`, `SPEC-018`, `DECOMP-001`, `BACKLOG-013` through
  `BACKLOG-016`, and `ARCH-001`.
- `ADR-012`, `ADR-013`, `ADR-014`, and `ADR-016`.
- Targeted source evidence in `apps/test/web` and `servers/test/api` for
  the current notes behavior.
- Existing lifecycle tests and validation/tooling conventions.

## Decisions

- Add `SD-*` as the ordinary artifact type for Feature-scoped System
  Design because the phase needs a durable selected-Feature design output.
- Keep System Design as an agent-operated workflow, not a CLI, engine,
  registry, manager, state machine, role, job, skill, feature registry,
  graph system, or duplicate backlog/traceability system.
- Treat `ARCH-*` as the high-level baseline and `SD-*` as one-Feature
  behavioral/interaction design against that baseline.
- Select exactly `BACKLOG-014` for the real execution case.
- Reference `BACKLOG-015` only as an ownership invariant and do not design
  `BACKLOG-015` or `BACKLOG-016`.

## Actual System Design

```text
REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-014 -> ARCH-001 -> SD-001
```

`SD-001` designs the concrete behavior for managing owned notes through
the existing architecture:

```text
apps/test/web
  -> same-origin /api/notes
  -> servers/test/api notes API
  -> notes service/domain
  -> owner-scoped notes persistence
```

Architectural assessment: compatible.

Architectural Impact: none.

No Architecture re-evaluation is required for `BACKLOG-014`.

## Boundary

No product-wide System Design, sibling Feature design, Engineering
Decomposition, Implementation Planning, Implementation, Verification,
Review, Delivery, Operate, `TASK-*`, coding job, source-code change,
role, job, skill, CLI, engine, registry, manager, state machine, Feature
registry, graph engine, duplicate backlog, duplicate contract system, or
duplicate traceability system was created.

## Validation

Passed:

- `pnpm run test:intake`
- `pnpm run test:discovery`
- `pnpm run test:specification`
- `pnpm run test:decomposition`
- `pnpm run test:architecture`
- `pnpm run test:system-design`
- `pnpm run validate`

Formatting initially needed Prettier updates for new/changed Markdown and
test files. After `pnpm run format`, final formatting and diff checks
were rerun separately.

`pnpm run validate` covered lint, typecheck, the Vitest suite, all
lifecycle tests including System Design, production builds for
`apps/test/web` and `servers/test/api`, architecture-boundary validation,
and secret scanning.
