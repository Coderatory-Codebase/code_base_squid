---
id: ADR-009
type: adr
title: Git hook enforcement mechanism
status: accepted
created: 2026-08-30
updated: 2026-08-30
related: [SPEC-009, ADR-005]
---

# ADR-009: Git Hook Enforcement Mechanism

## Context

M13 requires real, working local enforcement (commit-msg, pre-commit,
pre-push), not documentation of an intended one. This repository has no
implementation technology adopted yet (`SPEC-008` → "Project technology
profile"), so the mechanism chosen must not force one in — no framework's
hook manager should become a de facto technology adoption.

Common options: a third-party hook manager (husky, lefthook, pre-commit
[Python]), or Git's own native `core.hooksPath` setting pointing at
version-controlled hook scripts.

## Decision

Use Git's native `core.hooksPath`, pointed at `tooling/git-hooks/`, set by
`tooling/scripts/install-git-hooks.mjs` — run automatically via
`package.json`'s `prepare` lifecycle script on `pnpm install`, and
re-runnable manually (`pnpm run hooks:install`). Hook scripts are plain
Node (`#!/usr/bin/env node`), calling the repository's own central `pnpm`
quality commands rather than reimplementing logic in shell.

No third-party hook manager is added. Node is not a new dependency — it's
already this repository's baseline (`package.json` → `engines`); adding a
hook-manager package would be a real new dependency for a problem Git
already solves natively, and would pre-select a Node-ecosystem-flavored
workflow ahead of any actual technology decision.

## Windows shell resolution

`pnpm` resolves to a `.cmd`/`.ps1` shim on Windows. Node's
`execFileSync`/`spawnSync` cannot exec a shim directly without
`shell: true`. Hook scripts set `shell: process.platform === "win32"` when
invoking `pnpm` — a no-op, harmless on POSIX, required on Windows. Direct
`node ...` invocations don't need it (Node itself is a real executable on
every platform).

## Line endings

A hook script is executed directly via its shebang line
(`#!/usr/bin/env node`). A CRLF line ending there breaks that exec — the
interpreter name becomes `node\r`, which doesn't resolve. `.gitattributes`
forces LF for `tooling/git-hooks/*` (and, more broadly, `* text=auto
eol=lf` for the whole repository, since a Windows checkout with
`core.autocrlf=true` was independently found — during this milestone's own
hook testing — to silently disagree with Prettier's default LF output on
files nobody had touched).

## Consequences

- A fresh clone gets working hooks automatically on `pnpm install`, with
  no manual setup step, and no failure if `.git` doesn't exist (e.g. a
  package registry install of this repository as a template — see
  `install-git-hooks.mjs`).
- Hooks remain bypassable (`--no-verify`) — by design, not a gap. CI
  (`.github/workflows/ci.yaml`) is the authoritative gate; see `SPEC-009`
  → "Hooks are not the final authority".
- If a real hook-manager need ever emerges (e.g. per-language hook
  composition once multiple technologies are adopted), that's a future
  decision revisiting this one — not assumed now.

## M14 addendum: evaluated against Husky and Lefthook

M14 was explicitly asked to evaluate this decision against mature
alternatives rather than assume it — not to retroactively justify it.
Evaluated on the criteria M14 specified:

| Criterion                   | Native (`core.hooksPath`, current)                                                                              | Husky                                                                                                          | Lefthook                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Installation reliability    | Verified at M14 via a real fresh `git clone` + `pnpm install`; no manual step.                                  | Same `prepare`-script pattern this repository already uses — no reliability gain.                              | Requires a separate binary download/install step per platform; one more moving part.                                                       |
| Windows behavior            | Two real issues hit and fixed directly (CRLF shebang, `pnpm` shim spawn) — both now understood and documented.  | Designed to paper over exactly this kind of issue — but this repository no longer has the issue to paper over. | Ships a Go binary — sidesteps Node shebang/CRLF issues entirely, at the cost of a non-Node toolchain in an otherwise pure-Node repository. |
| pnpm compatibility          | Confirmed working (`shell: true` on Windows).                                                                   | Well-trodden, widely documented with pnpm.                                                                     | Works with pnpm; less commonly documented for it than Husky.                                                                               |
| CI behavior                 | Hooks don't run in CI by design (CI calls the same underlying `pnpm` scripts directly) — unaffected either way. | Same.                                                                                                          | Same.                                                                                                                                      |
| Developer/agent onboarding  | One `pnpm install`; hook logic is three short, readable Node files an agent can open and reason about directly. | One `pnpm install`; hook logic lives behind Husky's own CLI/format, one more thing to learn.                   | One `pnpm install`; hook logic lives in a Lefthook YAML config plus the Go binary's own behavior.                                          |
| Maintenance/dependency cost | Zero new dependencies — Node is already this repository's baseline.                                             | One new `devDependency`, actively maintained, small footprint.                                                 | One new `devDependency` plus a downloaded binary; heavier footprint.                                                                       |
| Debuggability               | Direct: run the hook file with `node`, read the stack trace.                                                    | One layer of indirection through Husky's own hook shim.                                                        | Two layers: Lefthook's own runner, then the configured command.                                                                            |
| Monorepo suitability        | Single `core.hooksPath` at the repo root; this repository has no per-package hook needs (no packages exist).    | Same suitability; no advantage here specifically.                                                              | Slightly stronger multi-language/parallel-hook story — irrelevant with zero technologies adopted.                                          |

**Conclusion: unchanged.** The primary reason either alternative exists —
solving cross-platform hook install/exec reliability — was already solved
directly during M13's own implementation and testing (the CRLF and `pnpm`
shim issues above), so adopting a manager now would mean rewriting
working, tested scripts to gain a benefit this repository no longer
lacks, while adding a real dependency (Husky) or a non-Node toolchain
component (Lefthook) neither of which is otherwise justified
(`SPEC-008` → "Project technology profile" — no implementation technology
exists yet to make either a natural fit). Revisit this decision if a
genuine multi-language hook-composition need appears once real
technologies are adopted — that is a concrete future trigger, not a
standing todo.

## Status

Accepted at M13, evaluated and reaffirmed at M14. Governs
`tooling/git-hooks/` and its installation.
