---
name: validate-repository
type: skill
description: Run the repository's quality gate and report pass/fail per stage.
when_to_use: >
  Before considering any change to config, tooling, or source complete —
  see .agent/instructions/validation.md. Also useful standalone to check
  the repository is currently in a valid state.
requires: [pnpm install has been run, Node >=22.13.0]
produces: [pass/fail result for lint, typecheck, test, build, and format:check]
---

# Validate Repository

1. Run `pnpm run validate` — chains `lint → typecheck → test → build`
   (see `package.json` scripts).
2. Run `pnpm run format:check` separately (not part of `validate`).
3. Report per-stage result, not just the final exit code — if something
   fails, name which stage and show the actual error output.
4. A failure blocks the change it's validating. Fix the root cause; don't
   weaken a rule or skip a stage to reach green (`change-management.md`).
5. Zero tests currently existing is expected, not a failure — `test` uses
   `--passWithNoTests`.
