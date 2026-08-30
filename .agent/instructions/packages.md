---
id: packages
type: instruction
applies_to: extracting-or-placing-reusable-source-code
---

# Packages

`packages/` is a reusable **source** boundary — not a nested monorepo,
not an independently-managed package set by default. Established at M05
(`ADR-008`), amended at M10 to spell out the parts that weren't explicit
yet. Durable properties: `.project/specs/SPEC-003-contract-and-package-model.md`
(sections "What must be true of `packages/`", "Package definition and
boundary distinction", "Package-to-package consumption"). This file is
the "how do I decide" layer; it doesn't restate that spec's rules.

## What a package is

Reusable source code, consumed by import, owned by no single deployable —
see `SPEC-003` → "Package definition and boundary distinction" for the
full comparison against application code, server/agent-owned business
logic, tooling, an external npm dependency, and an (optional, later)
independently distributable package.

## When code belongs in `packages/`

**Ownership first, reuse second.** Code stays with the deployable that
owns it (`ADR-002`) until reuse across ≥2 _independent_ deployables is
**demonstrated**, not anticipated. "This might be useful elsewhere later"
is not extraction criteria. See `contracts.md` → "Where it lives" for the
identical rule already applied to contracts specifically — this is the
same rule generalized to any reusable source.

## What can consume a package

```text
apps      ─┐
servers   ─┤
agents    ─┼──→ packages
tooling   ─┘
```

Package-to-package consumption is also permitted, same reuse bar and no
cycles — see `SPEC-003` → "Package-to-package consumption". `packages/`
must never depend on `apps/`, `servers/`, or `agents/`
(`architecture.yaml` → `dependency_direction`); if that seems necessary,
the boundary is wrong, not the rule (`boundaries.md`).

A package is not a place to accumulate each consumer's own business
rules just because they happen to share an import — see `SPEC-003`'s
"dumping ground" rule before adding a second capability to an existing
package "while you're in there."

## Structure

No fixed template. `packages/<name>/index.ts` alone is a complete, valid
package if that's all the capability needs. Not required by default:
`package.json`, `tsconfig.json`, a `README`, build config, test config,
a manifest, or any other metadata file — add one only when a concrete
need creates it (same principle as `.agent/skills/` — `capability-model.md`).

## Workspace behavior

`pnpm-workspace.yaml` does **not** glob `packages/*` — confirmed current
as of M10. A package directory is not a pnpm workspace member, gets no
independent `package.json` resolution, and isn't installed as a
dependency of anything. If one specific package later needs genuine
independent versioning/publishing, add a scoped glob entry for _that_
package only (`ADR-008`) — never re-add `packages/*` wholesale.

## TypeScript / source consumption

**Currently deferred — no configuration exists, and none should be added
speculatively.** There is no path mapping, no TypeScript project
reference, and no build tooling wired up for `packages/`, because no
consumer (`apps/`, `servers/`, `agents/`, `tooling/`) exists yet to need
one. When a real consumer needs to import a real package, configure
consumption on **that consumer's own `tsconfig.json`** (a relative
import or a scoped path alias, decided then, against the actual
directory layout that exists at that point) — don't pre-build the
plumbing now for an import that doesn't exist.

## Distribution

Default: `source → direct consumption`, inside this repository, always.
Optional, only once a specific package has a demonstrated external
distribution need: that package (and only that package) gains its own
`package.json`/build configuration, with build output at a
repository-level `dist/<name>/` — never `packages/<name>/dist/`. Not
implemented for any package today; the convention is documented, not
built (`SPEC-003`).

## Relationship to other boundaries

- **Contract ≠ package.** A contract is a concept/representation
  (`contracts.md`); it may happen to live inside a package once reuse is
  demonstrated, but a package is not required to hold a contract, and a
  contract is never itself a required package. No `defineContract()` or
  equivalent wrapper — that was corrected away at M05 and stays corrected.
- **Skill ≠ package.** A skill is agent-facing capability knowledge; a
  package is reusable source code consumed by import. Neither implies
  the other (`capability-model.md` — this rule is unchanged, just
  restated here for this boundary specifically).
- **A package is not automatically a graph node.** A `PACKAGE` node
  (`SPEC-007`) is recorded only when a real package exists and there's a
  real engineering reason to model its relationships — the directory
  existing is not sufficient on its own.

## Current state

No package exists in this repository as of M10. Nothing currently
duplicates logic across ≥2 independent deployables (none exist yet), so
nothing meets the extraction bar. This file and `SPEC-003` govern the
first one when a real need creates it.
