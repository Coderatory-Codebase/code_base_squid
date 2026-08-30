---
id: ADR-007
type: adr
title: Contract model foundation — unified primitive, location-based ownership, Zod
status: superseded
created: 2026-08-30
related: [ADR-001, ADR-002, SPEC-002, ADR-008]
---

# ADR-007: Contract Model Foundation

> **Superseded by [ADR-008](ADR-008-contract-and-package-model-correction.md).**
> After implementing this decision, a review found the `defineContract()`
> primitive itself to be exactly the kind of "universal Contract runtime
> abstraction" this repository's own anti-speculation principles argue
> against, and found `packages/contracts` had no real second consumer to
> justify centralizing it. Kept below unedited as the historical record of
> what was originally decided and why; do not follow it going forward.

## Context

M05 asked for a foundation for agreements between provider and consumer
deployables (data/API/command/event/message/agent/workflow "contracts"),
without building a contract platform. Several sub-decisions had to be made
together: whether these are genuinely distinct concepts, how design-time
and runtime guarantees relate, how ownership is represented without a
registry, what identity metadata a contract needs, and which validation
mechanism to adopt.

## Decision

1. **One Contract concept, not seven.** Data/API/command/event/message/
   agent/workflow contracts are the same primitive — identity + a schema +
   `.parse`/`.safeParse` — distinguished only by a `kind` tag. No separate
   class or module per kind.
2. **Design-time and runtime are paired, not separate.** A contract is
   defined from a single Zod schema; the TypeScript type is inferred from
   it (`InferContract<...>`) and the runtime check (`.parse`/`.safeParse`)
   validates against the same schema — they cannot drift apart the way a
   hand-written type and a hand-written validator can.
3. **Ownership by physical location, no registry.** A contract's owner is,
   by default, whichever package/deployable's source tree contains its
   definition — extending the locality principle in ADR-002 to contracts.
   An optional `owner` metadata field overrides this only when the
   default would be misleading. Consumers are identified structurally (who
   imports the contract), governed by the existing `dependency_direction`
   rules — no consumer registry.
4. **Identity is source-code metadata, not `.project/` artifact
   metadata.** `id`, `name`, `kind`, `version`, `status`, optional `owner`
   — no `created`/`updated`/`related` (git history serves that role for
   code); no ADR-style zero-padded numeric ids (ids are kebab-case,
   author-chosen).
5. **Zod is the validation mechanism.** It's TypeScript-first, already
   fits the existing strict-TS toolchain, and provides both the inferred
   type and the runtime check from one schema — no separate JSON
   Schema/OpenAPI/Protobuf layer is justified yet. Revisit only if a
   concrete cross-language or external-API-documentation need appears.
6. **The first package, `packages/contracts`, implements only the
   primitive** (`defineContract`) — no registry, no compatibility engine,
   no code generation.

Full operational detail: `.agent/instructions/contracts.md`. Required
properties: `SPEC-002`.

## Consequences

- `packages/` gains its first real package ahead of M11 ("Core
  Packages") — a deliberate, narrow exception: M05 explicitly required an
  initial implementation proving the contract model (not a broader
  business-capability package set, which is M11's actual scope). Flagged
  for review in the M05 report.
- A contract's shape can only express structural constraints (types,
  ranges, formats) — business rules stay in the provider's/consumer's own
  code, never inside the contract (see `SPEC-002`).
- Adding a second contracts package, or a contract validation mechanism
  beyond Zod, requires the same justification bar as any new package
  (ADR-001) — a concrete, current need, not a category that sounds useful.

## Status

Accepted at M05. Superseded at M05 (same milestone, after review) by
`ADR-008`.
