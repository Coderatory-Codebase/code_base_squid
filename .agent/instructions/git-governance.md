---
id: git-governance
type: instruction
applies_to: git-and-repository-quality-operations
---

# Git Governance & Quality Enforcement

Operational checklist for how change moves through Git in this
repository, and what enforces it. Durable, comprehensive definition:
`.project/specs/SPEC-009-repository-structure-git-governance-and-quality-enforcement.md`.
This file is the "what to do" layer; that spec is the "why, and what's
actually implemented vs. only documented" layer. `change-management.md`
still governs commit/architectural-decision authorization — this file
doesn't restate it, only extends it with the M13 enforcement machinery.

## Inspect before you act

Before any Git state change: `git status`, `git branch`,
`git log --oneline --decorate -n 20`, `git remote -v` where relevant.
Know the current branch, working-tree state, staged/untracked changes,
upstream, and recent history before doing anything that changes
repository state.

## Protect unrelated changes

If the working tree has changes you didn't create or can't confidently
attribute to the current task: don't commit, reset, delete, overwrite,
stash, or repository-wide-reformat them without explicit authorization.
Isolate your own changes where possible. If safe isolation isn't
possible, stop and surface the conflict instead of guessing.

## Branches and commits

Working branches are short-lived (`feat/*`, `fix/*`, `refactor/*`,
`chore/*`, `docs/*`, `test/*`, `ci/*`); `main` is the protected
integration branch (policy — branch protection is not yet configured at
the GitHub-host level, see `SPEC-009` → "Enforcement status"). A commit is
one coherent logical change. Commit messages follow
`type(scope): description` (`SPEC-009` → "Commit message convention") —
enforced by the `commit-msg` hook and, for PRs, by CI.

## Use the quality gate — it's real now

`pnpm install` installs working Git hooks automatically (`prepare`
script); `pnpm run hooks:install` re-verifies/reinstalls them manually.
`pnpm run validate` now also runs `validate:architecture` and
`secrets:scan` alongside the existing lint/typecheck/test/build
(`validation.md` still applies; `format:check` stays a separate command,
unchanged). Never weaken a check to make it pass — fix the underlying
issue, or raise a change to the check itself
(`change-management.md`).

## Hooks are fast feedback, not the boundary

`git commit --no-verify` / `git push --no-verify` bypass local hooks —
don't reach for that to make a change land faster
(`change-management.md` already says this; it applies doubly now that the
hooks actually do something). CI is authoritative. Don't disable a CI
step, weaken `validate:architecture`/`secrets:scan`, or modify branch
protection to get around a real failure.

## Before a destructive Git operation

Before `reset`, `rebase`, `clean`, `checkout --force`, `stash`, branch
deletion, or force-push: understand what could be lost. Never force-push
a protected or shared branch. On a branch you genuinely, solely own,
force-push may be acceptable when the rewrite is intentional and nothing
else's work is at risk — if uncertain, don't, and prefer a **mixed**
`git reset` (keeps working-tree content) over `--hard` (discards it) when
undoing a scratch/test commit.

## Merge conflicts

Inspect both sides, understand intent and ownership, resolve carefully,
re-run validation afterward. If intent can't be established safely, stop
and ask rather than guessing a resolution.

## PRs and review

A PR is not ready to merge when a required CI check fails — no amount of
"this looks fine" overrides a failing deterministic check. Agent-performed
review (code/architecture/security/test/documentation) is advisory unless
a human has explicitly made it a required check (not configured here).

## Humans and agents, same gate

No agent-specific bypass, CI exemption, merge exemption, or
secret-detection exemption — ever, regardless of who/what produced the
change.
