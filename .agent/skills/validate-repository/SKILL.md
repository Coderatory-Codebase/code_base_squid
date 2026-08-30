---
name: validate-repository
type: skill
description: Run the repository's quality gate and report pass/fail per stage.
when_to_use: >
  Before considering any change to config, tooling, or source complete —
  see .agent/instructions/validation.md. Also useful standalone to check
  the repository is currently in a valid state.
requires: [pnpm install has been run, Node >=22.13.0]
produces: [
    pass/fail result for lint,
    typecheck,
    test,
    build,
    architecture
    boundaries,
    secret scan,
    and format:check,
  ]
---

# Validate Repository

1. Run `pnpm run validate` — chains `lint → typecheck → test → build →
validate:architecture → secrets:scan` (see `package.json` scripts;
   the last two were added at M13 — `.agent/instructions/git-governance.md`).
2. Run `pnpm run format:check` separately (not part of `validate`).
3. Report per-stage result, not just the final exit code — if something
   fails, name which stage and show the actual error output.
4. A failure blocks the change it's validating. Fix the root cause; don't
   weaken a rule or skip a stage to reach green (`change-management.md`).
   Hand control back to the calling workflow's failure-handling loop
   (`development-lifecycle.md`) rather than deciding independently how to
   proceed.
5. Zero tests currently existing is expected, not a failure — `test` uses
   `--passWithNoTests`.

## Side effects

**Validation** — reports pass/fail per stage; never modifies the files it
checks. `format:check` specifically reports formatting mismatches without
rewriting anything (that's `pnpm run format`, a different script this
skill does not invoke).
