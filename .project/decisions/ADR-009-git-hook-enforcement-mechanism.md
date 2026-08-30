---
id: ADR-009
type: adr
title: Git hook enforcement mechanism
status: accepted
created: 2026-08-30
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

## Status

Accepted at M13. Governs `tooling/git-hooks/` and its installation.
