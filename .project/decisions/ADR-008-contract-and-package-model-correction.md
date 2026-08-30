---
id: ADR-008
type: adr
title: Contract & package model correction — ownership before reuse, packages/ as source boundary
status: accepted
created: 2026-08-30
related: [ADR-007, ADR-001, ADR-002, SPEC-002, SPEC-003]
---

# ADR-008: Contract & Package Model Correction

## Context

`ADR-007` implemented a `defineContract()` runtime primitive (identity
metadata + a Zod schema + `.parse`/`.safeParse`) in a new, independently
built `packages/contracts` workspace package, and treated `packages/` as
somewhere every reusable directory gets its own `package.json`/
`tsconfig.json`/build output.

Reviewing that implementation against this repository's own standing
principles surfaced two problems:

1. `defineContract()` is itself a small **universal Contract runtime
   abstraction** — exactly the kind of speculative framework
   `AGENTS.md`/`implementation.md` already argue against, built before any
   real provider or consumer existed to need it.
2. `packages/contracts` was **centralized speculatively** — nothing
   currently consumes it, so there is no demonstrated reuse to justify
   pulling it out of an owning boundary that doesn't exist yet. Treating
   every `packages/*` entry as an independently managed workspace package
   (own `package.json`, `tsconfig.json`, build output inside the package
   directory) also risks turning `packages/` into a nested monorepo, which
   was never the intent of `ADR-001`.

## Decision

1. **A contract is a concept, not a framework.** It's whatever
   representation the boundary needs — a TS type/interface, a schema, an
   API spec, an event/message definition — with a runtime validator added
   only when real external data needs a runtime guarantee. No generic
   `defineContract()`-style wrapper, no identity/versioning metadata
   object imposed on every contract. Full guidance:
   `.agent/instructions/contracts.md`.
2. **Ownership comes before reuse.** A contract/type/schema lives with the
   boundary (deployable) that owns it by default. It moves to `packages/`
   only once genuine reuse across ≥2 independent deployables is
   demonstrated — not anticipated. This is `ADR-002`'s locality principle
   applied to contracts specifically, correcting `ADR-007`'s premature
   centralization.
3. **`packages/` is a reusable SOURCE boundary, not a nested monorepo.** A
   directory under `packages/<name>/` does not require its own
   `package.json`, `tsconfig.json`, or independent build/release
   configuration by default. The default consumption model is direct
   source consumption by whatever imports it (`apps/`, `servers/`,
   `agents/`, `tooling/`, or another package) — not
   `source → build → publish → install → consume` inside the same
   repository.
4. **Distribution is optional and separate from the source boundary.** If
   a package is ever built for external distribution, its build output
   lives outside the package's own source directory (e.g. a
   repository-level `dist/<name>/`), never as `packages/<name>/dist/`.
   This repository does not implement that pipeline yet — establishing
   the convention is sufficient until a concrete distribution need exists.
5. **Package structure follows the capability, not a template.** No
   package is required to contain `package.json`/`src/`/`tsconfig.json`/
   build config/README/tests-directory by default; a package is as small
   as `index.ts` + one more file when that's all the capability needs.

## Consequences

- `packages/contracts` (the package) and `.agent/skills/define-contract`
  are removed — see the M05 correction report for the full
  keep/modify/remove/defer breakdown.
- `pnpm-workspace.yaml` no longer globs `packages/*`; only `apps/*`,
  `servers/*`, `agents/*`, `tooling/*` are treated as independently
  managed workspace members, since those are the boundaries expected to
  hold genuinely independent deployables with their own dependencies.
- Root `tsconfig.json` no longer project-references a package (nothing to
  reference); it reverts to `references: []`, same as after M04.
- The next time a `packages/` capability is genuinely needed by ≥2
  independent deployables, it's added as plain source first; independent
  `package.json`/build/publish infrastructure is added later, only if
  that specific package needs it (e.g. for external distribution) — not
  by default.

## Status

Accepted at M05 (correction).
