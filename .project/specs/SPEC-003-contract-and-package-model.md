---
id: SPEC-003
type: spec
title: Contract & package model — required properties (corrected)
status: active
created: 2026-08-30
updated: 2026-08-30
related: [ADR-008, SPEC-001, SPEC-002]
---

# SPEC-003: Contract & Package Model

Supersedes `SPEC-002`. Rationale: `ADR-008`. Operational guidance:
`.agent/instructions/contracts.md` (contracts), `.agent/instructions/packages.md`
(packages).

> **Amended at M10** (package-source-model milestone) to add the two
> sections marked below. This operationalizes `ADR-008` — it does not
> reverse or change any decision already in this spec; nothing existing
> below was edited.

## What must be true of a contract

- **It's a concept, expressed with the smallest fitting representation** —
  a TypeScript type/interface, a schema, an API specification, or an
  event/message definition. There is no required generic wrapper, identity
  object, or metadata schema imposed on every contract.
- **A compile-time type alone guarantees nothing about real external
  data.** A runtime validator (e.g. a schema with a `.parse`-equivalent)
  is only required when data actually crosses a boundary where its shape
  can't be trusted (network, file, subprocess, external input) — not for
  internal-only types.
- **No business logic.** A contract expresses structure only (types,
  ranges, formats, required/optional). Authorization, workflow state, and
  side effects stay in the provider's/consumer's own code:

  ```text
                   CONTRACT
                   /       \
                  /         \
             PROVIDER       CONSUMER
                │              │
           business          business
           behavior          behavior
  ```

- **Ownership before reuse.** A contract lives with the boundary
  (deployable) that owns it by default. It is extracted to `packages/`
  only once reuse across ≥2 independent deployables is real, not
  anticipated — never into a new top-level generic directory (`common/`
  etc.).
- **Versioning is a judgment call, applied once it matters.** Once a
  contract has a real second consumer: removing/renaming a field,
  changing a field's type, adding a new required field, or narrowing a
  constraint is breaking; adding an optional field or widening a
  constraint is compatible. No automated compatibility engine — applied
  by reading both sides before changing a shared shape.

## What must be true of `packages/`

- **It is a reusable SOURCE boundary, not a nested monorepo.** A directory
  under `packages/<name>/` does not require its own `package.json`,
  `tsconfig.json`, or independent build/release configuration by default.
- **Direct source consumption is the default model.** Whatever depends on
  a package (`apps/`, `servers/`, `agents/`, `tooling/`, another package)
  consumes its source directly; the model is
  `source → consume`, not `source → build → publish → install → consume`
  within this repository.
- **Distribution, if it happens, is optional and external to the source
  directory.** Build output for a distributable package lives outside
  `packages/<name>/` (e.g. a repository-level `dist/<name>/`) — never
  `packages/<name>/dist/`.
- **Structure follows the capability.** No fixed template
  (`package.json`/`src/`/`tsconfig.json`/tests-directory/README) is
  required; a package is exactly as large as its capability, from a
  single file up.
- **Dependency direction is unchanged.** `apps/`, `servers/`, `agents/`,
  `tooling/` may depend on `packages/`; `packages/` must not depend on
  `apps/`, `servers/`, or `agents/` (`architecture.yaml` →
  `dependency_direction`) — a source/import direction, not a build/publish
  direction.
- **A package needing genuine independent versioning/publishing is the
  exception, not the default** — add `package.json`/build/release
  configuration to that one package when that need is real, and add it to
  `pnpm-workspace.yaml`'s globs explicitly at that point.

## Package definition and boundary distinction (added M10)

A package is **reusable source code**, consumed by import, owned by no
single deployable. Distinct from:

| Boundary                                 | What it is                                                                                                                                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application code (`apps/`)               | Owned by one user-facing app; not imported by other deployables.                                                                                                                                                       |
| Server-owned business logic (`servers/`) | Owned by one server (`ADR-002`); stays there unless reuse is demonstrated.                                                                                                                                             |
| Agent-owned logic (`agents/`)            | Owned by one deployable agent runtime; same rule as server-owned logic.                                                                                                                                                |
| Tooling (`tooling/`)                     | Repository/developer tooling — operates _on_ the repo, not imported _by_ deployables at runtime.                                                                                                                       |
| External npm dependency                  | Code this repository does not own; declared in a `package.json`, installed via `pnpm`, never placed under `packages/`.                                                                                                 |
| Independently distributable package      | An _optional_, later evolution of one specific `packages/<name>` that has earned its own `package.json`/build/publish — not the default shape of anything under `packages/` (see "Distribution, if it happens" above). |

## Package-to-package consumption (added M10)

Permitted (`architecture.yaml` → `dependency_direction`: `packages →
packages` is allowed), subject to the same rules as any other package
dependency: no circular dependencies, and the same reuse bar — one
package depends on another only for a genuinely shared capability, not
merely because both happen to be under `packages/`.

**A package must not become a business-logic dumping ground merely
because multiple consumers use it.** Multiple consumers needing
_similar_ logic is not automatically reuse — if each consumer's need is
actually its own business rule that happens to look alike today, that
logic stays with each owner (`ADR-002`); only the genuinely shared,
non-business mechanism belongs in the package, the same distinction
`contracts.md` already draws for contracts ("structural validation, not
business validation").

## Status

`active` — governs every contract and every `packages/` capability from
M05 (correction) onward.
