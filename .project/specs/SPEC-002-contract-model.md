---
id: SPEC-002
type: spec
title: Contract model — required properties
status: superseded
created: 2026-08-30
related: [ADR-007, SPEC-001, SPEC-003]
---

# SPEC-002: Contract Model

> **Superseded by [SPEC-003](SPEC-003-contract-and-package-model.md).**
> This spec described a required `defineContract()` runtime primitive and
> `packages/`-centralized contracts; both were corrected away. Kept
> unedited as the historical record; do not follow it going forward.

## What must be true of any contract in this repository

- **Identity.** Every contract has `id` (unique, kebab-case), `name`,
  `kind` (`data | api | command | event | message | agent | workflow`),
  `version` (semver), `status` (`draft | stable | deprecated`), and
  optionally `owner` and `description`. It does not carry
  `.project/`-artifact metadata (`created`, `updated`, `related`,
  ADR-style numeric ids) — see `ADR-007`.
- **Design-time and runtime agree by construction.** A contract's
  TypeScript type is inferred from the same schema its `.parse`/
  `.safeParse` validates against — never hand-maintained separately.
  A TypeScript type alone, without an actual `.parse`/`.safeParse` call at
  the point data crosses a real boundary, provides no runtime guarantee.
- **No business logic.** A contract's shape expresses structural
  constraints only (types, ranges, formats, required-vs-optional). Rules
  like authorization, workflow state, or side effects belong in the
  provider's or consumer's own code:

  ```text
                   CONTRACT
                   /       \
                  /         \
             PROVIDER       CONSUMER
                │              │
           business          business
           behavior          behavior
  ```

- **Ownership is structural.** A contract's owner is the
  package/deployable whose source tree contains its definition, unless
  the `owner` field explicitly overrides that. There is no separate
  ownership registry.
- **Location follows the existing reuse boundary.** A contract used by
  exactly one deployable lives inside it. A contract used across ≥2
  independent deployables lives in `packages/` (ADR-001) — never in a new
  top-level generic directory (e.g. `common/`).
- **Dependency direction is unchanged.** A package holding contracts is
  still a package: it must not depend on `apps/`, `servers/`, or
  `agents/` (`architecture.yaml` → `dependency_direction`).

## Versioning and evolution

Semver: **major** for a breaking change, **minor** for a compatible
addition, **patch** otherwise.

**Breaking** (major bump):

- removing a field
- renaming a field
- changing a field's type
- adding a new _required_ field
- narrowing an existing constraint (range, enum, format)
- changing an event's or command's semantics, even if its shape is
  unchanged
- changing an API's response guarantee (status/error semantics)

**Compatible** (minor bump):

- adding a new _optional_ field
- widening an existing constraint
- adding a new enum value, only when consumers are documented to
  tolerate unknown values
- documentation-only clarification with no shape/semantic change

**Deprecation**: set `status: "deprecated"` and keep the contract
validating as before — deprecation signals intent to remove in a future
major version, it is not itself a breaking change. There is no automated
compatibility checker at this stage; a human/agent applies these rules
when changing a contract, and a breaking change to a `packages/`-level
contract is recorded per `ADR-007`/`change-management.md`.

**Migration**: no automatic migration engine. The changed contract's
`description`/changelog (in the owning package) states what changed;
consumers upgrade by bumping their dependency on the owning
package/deployable, same as any other semver dependency.

## Status

`superseded` by `SPEC-003`.
