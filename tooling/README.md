# tooling/ — Repository Engineering Infrastructure

This directory is the repository's own automation: how Git enforcement and
quality validation actually run, as opposed to `.agent/`, which describes
how agents should _behave_. Full model:
[`../.project/specs/SPEC-009-repository-structure-git-governance-and-quality-enforcement.md`](../.project/specs/SPEC-009-repository-structure-git-governance-and-quality-enforcement.md).
Agent-facing entry point:
[`../.agent/instructions/git-governance.md`](../.agent/instructions/git-governance.md).

```text
tooling/
├── git-hooks/   Git hooks, installed via `core.hooksPath` (no third-party
│                hook manager — see ../.project/decisions/ADR-009).
│                commit-msg, pre-commit, pre-push.
└── scripts/     The validation logic those hooks (and CI) call into —
                 secret scanning, architecture boundary checks, commit-
                 message rules, the hook installer.
```

## Getting working hooks

```bash
pnpm install          # installs hooks automatically (package.json -> prepare)
pnpm run hooks:install # re-run manually if needed (safe, idempotent)
```

Verify: `git config --get core.hooksPath` should print `tooling/git-hooks`.

## What runs when

| When                | What                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `git commit`        | `pre-commit` (format + secrets, staged files only), then `commit-msg`.                                                                     |
| `git push`          | `pre-push` (`pnpm run validate` + `format:check`, repository-wide).                                                                        |
| PR / push to `main` | CI (`.github/workflows/ci.yaml`) — same commands, plus a PR commit-message-range check. Authoritative; hooks are fast local feedback only. |

All three call this repository's own `pnpm run <script>` commands — no
validation logic is duplicated between a hook and CI. `git commit
--no-verify` / `git push --no-verify` bypass the local hooks; they do not
bypass CI.

## Adding a new check

Add the script under `scripts/`, wire it into `package.json`'s `scripts`
(and into `validate` if it belongs in the repository-wide gate), then call
it from whichever hook's scope actually fits — staged/fast for
`pre-commit`, repository-wide for `pre-push`. Don't duplicate the check's
logic inside the hook file itself.

## Troubleshooting

See `SPEC-009` → "Troubleshooting (M14)" for failure modes actually
encountered while building this (hooks not installed, Windows `pnpm`
spawning, CRLF breaking a hook's shebang, and others).

## Non-goals

Not a nested monorepo (no `package.json` per subdirectory), not a place
for application/business logic, not a technology-specific tool
installation (nothing here assumes React/TypeScript-beyond-tooling/
Docker/etc. — none of that exists in this repository yet).
