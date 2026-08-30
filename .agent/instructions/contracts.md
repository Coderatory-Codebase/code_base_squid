---
id: contracts
type: instruction
applies_to: defining-or-changing-an-agreement-at-a-boundary
---

# Contract Guidance

A **contract** is an agreement at a boundary — between a provider and a
consumer that don't share source, or won't always. It is a concept, not a
framework. Rationale: `../../.project/decisions/ADR-008-contract-and-package-model-correction.md`.
Required properties: `../../.project/specs/SPEC-003-contract-and-package-model.md`.

## What a contract is, concretely

Whatever representation fits, from smallest to largest:

- a TypeScript `type`/`interface` (compile-time agreement only)
- a schema (e.g. a Zod schema) when you need the same shape to also
  validate real data at runtime
- an API specification, when the boundary is a network call
- an event/message definition, when the boundary is async

Don't reach for more than the boundary needs. Most contracts in this
repository will be a plain type or interface. Add a runtime validator only
when data actually crosses a boundary where you can't trust its shape
(network, file, subprocess, external input) — a compile-time type alone
guarantees nothing about that data.

## When a contract is required

The data crosses a real boundary between independent owners (two
deployables, or a deployable and an external caller) — not for every
internal function signature.

## When NOT to introduce one

- The data never leaves one module/function's internal use — an ordinary
  type is enough, don't formalize it.
- There's exactly one consumer and no second one planned — don't build
  ahead of an actual boundary (`implementation.md`).
- What's actually needed is business validation ("is this allowed"), not
  structural validation ("is this well-formed") — a contract only
  expresses the latter.

## Where it lives — ownership before reuse

Default: **a contract lives with the boundary/capability that owns it.**
E.g. an API response shape for one server lives in that server
(`servers/foo/contracts/` or `servers/foo/types/`, once that server
exists); an app-specific shape stays in that app.

Extract to `packages/` **only once reuse across ≥2 independent
deployables is real**, not anticipated. Don't centralize something into
`packages/` just because it's called a "contract" — ownership comes
first; centralization is the exception, earned by demonstrated reuse.
Never a new top-level generic directory (`common/` etc.) — see
`boundaries.md`.

## No business logic

A contract expresses structure only (types, ranges, formats,
required/optional). Authorization, workflow state, and side effects stay
in the provider's/consumer's own code — never inside the contract
definition itself.

## Versioning, when it matters

Once a contract has a real second consumer, treat shape changes with
semver judgment: removing/renaming a field, changing a field's type,
adding a new _required_ field, or narrowing a constraint is breaking;
adding an optional field or widening a constraint is compatible. There is
no automated compatibility checker — apply this by reading both sides
before changing a shared shape, and surface a breaking change as a
decision (`change-management.md`) if it has real external consumers.
