---
id: SPEC-009
type: spec
title: Repository structure, Git governance & quality enforcement
status: active
created: 2026-08-30
related: [SPEC-003, SPEC-005, SPEC-008, ADR-001, ADR-002, ADR-008, ADR-009]
---

# SPEC-009: Repository Structure, Git Governance & Quality Enforcement

Operational entry point: `.agent/instructions/git-governance.md`. This spec
is the comprehensive, durable definition; that file is the shorter
agent-facing pointer into it.

## Purpose

`architecture.yaml` defines structural boundaries; `SPEC-008` defines
engineering judgment inside them. Neither says how change actually moves
through Git, or what catches a mistake before it lands. This spec is that
layer: repository organization/hygiene, branch and commit discipline, PR
and review policy, and the enforcement machinery (hooks, quality commands,
CI) that makes those durable instead of aspirational — built now, not
merely documented, wherever building it doesn't require a technology this
repository hasn't adopted yet.

## Scope

Repository-wide Git and quality-enforcement policy plus its
technology-neutral implementation. Does not add technology-specific
tooling (a linter/analyzer for a framework not yet in use), does not
change `architecture.yaml`'s boundaries, the package model (`SPEC-003`),
or the engineering model (`SPEC-008`) — it operationalizes "validation" as
already scoped by `SPEC-008` → "Validation and enforcement".

## Enforcement model

```text
.agent/            tells agents (and, by extension, humans reading it)
                    how to behave
Git hooks           fast local feedback — bypassable, not a boundary
quality commands     reusable, centrally-defined validation
CI                  authoritative automated validation
repository settings  enforce branch/review rules, where actually configured
human review         contextual judgment
```

Each layer has one job. Hooks give speed; CI gives authority; repository
settings (branch protection) enforce the integration boundary; nothing
below CI is trusted to be the real gate.

## Repository structure and ownership

Unchanged from `architecture.yaml` → `boundaries`: `.agent/` (how agents
operate), `.project/` (what the project knows), `apps/`, `servers/`,
`agents/`, `packages/`, `infra/`, `tooling/`, `docs/`. A documented
boundary does not require the directory to exist — this spec adds no
exception. `tooling/` gains its first real content this milestone
(`tooling/git-hooks/`, `tooling/scripts/`) — the first boundary in
`architecture.yaml` to move from `not-yet-created` to populated.

### Root-level hygiene

Root holds only genuinely repository-wide artifacts: `README.md`,
`CLAUDE.md`, `AGENTS.md`, `package.json`, `pnpm-workspace.yaml`,
`tsconfig.json`, `.gitignore`, `.gitattributes`, `.prettierrc.json`,
`.prettierignore`, `eslint.config.js`, `architecture.yaml`, plus `.agent/`,
`.project/`, and the declared boundaries. No root-level dumping ground
(`utils/`, `common/`, `shared/`, `misc/`, `temp/`) — same rule
`packages.md` already applies one level down, applied at the root.

### Repository cleanliness

`.gitignore` excludes: `node_modules/`, `dist/`, `coverage/`,
`*.tsbuildinfo`, logs (`*.log`, `npm-debug.log*`, `pnpm-debug.log*`), OS
files (`.DS_Store`, `Thumbs.db`), editor-specific IDE state (`.vscode/*`
other than a shared `extensions.json`, `.idea/`), and all environment
files (`.env`, `.env.*`) except a committed `.env.example` template (none
exists yet — no source code has environment variables to template; add one
the first time real config needs it, not speculatively). Real secrets
(credentials, private keys, tokens, API secrets) must never be committed;
see "Secret detection" below for the automated backstop, and note its
limits.

## Git is part of engineering quality

Clean code, clean architecture, and clean history are the same discipline
applied at different scales. This spec optimizes for traceable, reviewable
change — not only "the code works."

## Branch model

**Policy (documented, not yet enforced by a hosting setting — see
"Enforcement status")**: `main` is the protected integration branch.
Working branches are short-lived: `feat/*`, `fix/*`, `refactor/*`,
`chore/*`, `docs/*`, `test/*`, `ci/*` — examples, not an exhaustive closed
list; the category should match the commit-message `type` for the
branch's primary change. No GitFlow (`develop`, `release/*`, `hotfix/*`)
is imposed — this repository has no release/deployment model yet
(`architecture.yaml` → `non_goals_current_phase`) to justify one; revisit
when one exists.

### Branch naming validation

**Implemented, advisory** — `tooling/scripts/commit-message-rules.mjs`'s
`TYPES` list is the same vocabulary a branch prefix should use. No
separate branch-name-validating hook exists: branch names aren't visible
to a `commit-msg`/`pre-commit` hook the same deterministic way a commit
message is (a hook can't force a rename mid-work), and inventing a
`post-checkout` nag was judged disproportionate to the actual risk. If a
concrete case of drift shows up, add deterministic validation then — this
is a documented baseline, not a gap being ignored.

## Protected branches

**Policy, not yet an enforced repository setting.** `main` should require:
a PR (no direct pushes once real collaborators exist), the CI `validate`
job passing, and review for anything beyond a trivial/solo change. As of
M13, this repository has one contributor and branch protection has not
been configured on the GitHub host — configuring it is a repository-host
action outside what a coding agent should do unilaterally (see "Agent Git
safety"). Recorded here so the gap is explicit, not silently assumed away.

## Commit discipline

A commit represents one coherent logical change — not
feature+refactor+dependency-bump+formatting bundled because they happened
in the same sitting, unless they genuinely are one change. Focused,
reviewable, reversible commits are preferred; this is judgment
(`SPEC-008` → "Agent engineering judgment"), not a mechanical
one-file-per-commit rule.

### Commit message convention

```text
type(scope): description
```

`type` ∈ `feat, fix, refactor, docs, test, chore, build, ci, perf`. `scope`
is optional, lowercase. `description` ≤ 72 characters. Full rule set:
`tooling/scripts/commit-message-rules.mjs` (the single source both the
local hook and CI import — see "Local and CI parity"). `Merge ...` and
`Revert ...` subjects are exempt (Git generates their shape; this
convention doesn't fight it).

**Not retroactive** — commits before M13 predate this convention and are
not rewritten (`change-management.md` → "never force-push, hard-reset, or
otherwise discard history without explicit instruction"); it governs new
commits from M13 onward.

## Pre-commit vs pre-push

- **`commit-msg`** (fast, always): validates the commit subject against
  the convention above.
- **`pre-commit`** (fast, staged-scope): `format:check`, then
  `secrets:scan --staged`. Deliberately excludes `lint`/`typecheck`/
  `test`/`build` — those run repository-wide and are not "fast" at this
  repository's eventual scale; that's `pre-push`'s job.
- **`pre-push`** (broader): `pnpm run validate` (lint, typecheck, test,
  build, `validate:architecture`, `secrets:scan`) plus `format:check`.

All three call this repository's own central `pnpm` commands — no
validation logic is duplicated in the hook scripts themselves (see
"Avoid duplicated shell logic").

## Hooks are not the final authority

`git commit --no-verify` / `git push --no-verify` bypass local hooks —
documented, not fought. The real enforcement boundary is `hooks + CI +
protected branches` (where configured), never hooks alone. See
`.project/decisions/ADR-009-git-hook-enforcement-mechanism.md` for why
hooks are implemented as native `core.hooksPath` scripts rather than a
third-party hook manager, and for two concrete portability issues found
and fixed while building this (Windows `pnpm` shell resolution, CRLF
breaking a hook's shebang).

## Unified quality commands

| Command                          | What it does                                                                  | Status                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `pnpm run format`                | Rewrites files to Prettier style.                                             | Implemented                                                            |
| `pnpm run format:check`          | Reports formatting mismatches; never rewrites.                                | Implemented                                                            |
| `pnpm run lint`                  | ESLint (flat config, typescript-eslint, Prettier-compatible).                 | Implemented                                                            |
| `pnpm run typecheck`             | `tsc -b`, strict mode.                                                        | Implemented                                                            |
| `pnpm run test`                  | Vitest; `--passWithNoTests` — zero tests is a valid current state.            | Implemented                                                            |
| `pnpm run build`                 | `tsc -b`.                                                                     | Implemented                                                            |
| `pnpm run validate:architecture` | Forbidden/undeclared top-level directory check (see below).                   | **New at M13**                                                         |
| `pnpm run secrets:scan`          | Baseline secret-pattern scan (see below).                                     | **New at M13**                                                         |
| `pnpm run commit-msg:check`      | Manually run the commit-message rule against a message file.                  | **New at M13**                                                         |
| `pnpm run validate`              | `lint && typecheck && test && build && validate:architecture && secrets:scan` | **Expanded at M13** — previously `lint && typecheck && test && build`. |
| `pnpm run hooks:install`         | (Re)point `core.hooksPath` at `tooling/git-hooks/`.                           | **New at M13**                                                         |

`format:check` stays a separate command from `validate` — an intentional,
pre-existing distinction (`.agent/instructions/validation.md`), not
changed here: CI must use `format:check`, never `format`, so it reports
rather than silently rewrites source.

## Architecture validation

**Implemented, scoped to what's checkable without source**:
`tooling/scripts/validate-architecture-boundaries.mjs` reads
`architecture.yaml` and checks (a) no `forbidden_top_level_dirs` entry
exists as an actual directory, (b) every actual top-level directory is a
declared boundary. It does **not** check dependency direction or ownership
— nothing exists yet under `apps/`/`servers/`/`agents/`/`packages/` to
import anything, so there is nothing to check. Extend this script (or add
a sibling) once real source creates real imports to verify — not before.

## Secret detection

**Implemented, explicitly a baseline**: `tooling/scripts/secret-scan.mjs`
matches a small set of distinctive secret _shapes_ (AWS access key IDs,
PEM private-key headers, GitHub/Slack/Stripe token prefixes, a generic
`key/secret/token/password = "<opaque 20+ chars>"` assignment) against
either all Git-tracked files, staged files (`--staged`, used by
pre-commit), or an explicit file list (`--files`, used for local
testing/CI diffs). It is **not** a comprehensive secret scanner — no
entropy analysis, no historical-commit scanning, no allowlisting workflow.
Graduate to a dedicated tool (e.g. gitleaks, trufflehog) once real
credentials in real configuration make the false-negative risk concrete;
premature today, since no application/service configuration exists to
leak.

## Dependency hygiene

**Policy only — no dependency exists yet to scan beyond development
tooling** (`package.json` → `devDependencies`; no runtime dependency
exists). Before adding any dependency: is it necessary, does existing
tooling already solve it, is it maintained, is it reasonably secure and
license-compatible, is the complexity it adds proportional
(`.agent/instructions/implementation.md` → "Extend before adding"). No
automated dependency-vulnerability scan is wired into CI yet — `pnpm
audit` (or GitHub's own Dependabot alerts, available without any
repository code change) is the natural fit once real dependencies exist;
not configured today because there is nothing meaningful for it to scan.

## Security scanning

Baseline today = secret detection above. Framework/container/IaC/runtime
security scanning are technology-skill-scoped additions (`SPEC-008` →
"Technology skill model"), introduced when that technology is real — not
built speculatively now.

## Test and build enforcement

Unchanged from `.agent/instructions/validation.md`: zero tests passing via
`--passWithNoTests` remains a valid, expected state; `build` (`tsc -b`)
succeeding against zero application source is likewise valid. CI runs both
on every push/PR; a real test/build failure once source exists blocks the
same way a lint failure already does.

## CI quality gate

**Implemented** — `.github/workflows/ci.yaml`, GitHub Actions, on every
push to `main` and every PR: `pnpm install --frozen-lockfile`, then
`lint`, `typecheck`, `test`, `build`, `validate:architecture`,
`secrets:scan`, `format:check`, and — PR events only —
`validate-commit-messages-in-range.mjs` (every commit in the PR's range,
so a locally bypassed `commit-msg` hook still gets caught before merge).

## Local and CI parity

Every CI step runs a command that also exists locally
(`pnpm run <same-script>`), so `pnpm run validate && pnpm run format:check`
locally is the same correctness model CI enforces — no second, divergent
definition of "valid." CI additionally runs the PR commit-range check,
which has no local equivalent by nature (there is no "range" until commits
exist to diff).

## PR model

A PR is the review/integration boundary for `main`. Proportional to the
change: what changed, why, scope, architecture impact, testing/validation
performed, risk, and any breaking/migration notes — trivial changes don't
need a lengthy template filled out for its own sake. **Not implemented as
a repository-host template** (`.github/PULL_REQUEST_TEMPLATE.md`) at M13 —
this repository has had exactly one contributor and no PR history to learn
a template's shape from; add one once a real PR shows what's actually
missing, rather than guessing a shape now.

## PR quality gates and review

A PR is not ready to merge into `main` when a required CI check fails —
deterministic checks are never overridden by "AI review says it's fine."
Agents may perform code/architecture/security/test/dependency/
documentation review as an advisory input; this is **not** a required,
blocking check unless a human explicitly configures it as one (not done
at M13 — no autonomous AI-approves-merge mechanism is built here).

## Merge policy

Once branch protection is configured (see "Enforcement status"): merge to
`main` requires the PR's required checks passing and, beyond a trivial
solo change, review. No merge policy is enforced today beyond what Git
itself allows (nothing) — recorded as a gap, not claimed as done.

## Force-push and destructive operations

Never force-push a protected/shared branch. On an agent- or
developer-owned working branch, force-push is acceptable only when the
branch is genuinely owned solely by that work, the rewrite is intentional,
and no one else's commits would be lost — if uncertain, don't. The same
"stop if uncertain" rule applies to `reset`, `rebase`, `clean`,
`checkout --force`, `stash`, and branch deletion — see
`.agent/instructions/git-governance.md` → "Before a destructive Git
operation".

## Conflict handling

An agent resolving a merge conflict inspects both sides, understands
intent and ownership, resolves deliberately, and re-runs validation
afterward — never guesses a resolution to make the conflict marker
disappear. If intent can't be established safely (e.g. genuinely competing
changes to the same logic with no clear "correct" merge), stop and surface
it rather than picking one side.

## Change traceability

```text
SPEC/decision → branch → commit(s) → PR → review → CI → merge
```

No issue tracker is wired to this repository yet (`.project/`'s own
artifact IDs — `SPEC-*`, `ADR-*`, `PLAN-*` — are the traceability anchor
where one is needed, via a commit's `scope` or body, or a PR description).
No `TASK-*`/`RFC-*` ID is fabricated when none exists
(`.project/ARTIFACT-TYPES.md` already establishes this — most work here
hasn't needed a `TASK`).

## Agent Git behavior

Before any Git state change: `git status`, `git branch`, recent
`git log --oneline --decorate -n 20`, `git remote -v` where relevant —
understand current branch, working-tree state, staged/untracked changes,
upstream, and recent history first. **Commit only when explicitly asked**
(pre-existing rule, `change-management.md` — unchanged by this spec).
**Never assume all working-tree changes belong to the current task** — if
unattributable changes are present, don't commit, reset, stash, delete,
overwrite, or repository-wide-reformat them without explicit
authorization; isolate what the current task actually touched, and if
isolation isn't safely possible, stop and surface the conflict instead of
guessing.

While building this milestone's own tooling, exactly this situation came
up in miniature: verifying hooks fired through real `git commit` calls
required creating throwaway scratch commits, and one `git stash -u` step
briefly hid this milestone's own not-yet-committed work from the working
tree. Every scratch commit was undone with a **mixed** `git reset`
(preserves working-tree content) rather than `--hard` (which would have
discarded it), and the stash was restored before continuing — see
"Destructive Git operations" above; this is that rule applied to the
agent's own mid-task state, not just to a hypothetical other developer's
work.

## Human and agent parity

Humans and agents operate under the same quality gates. No agent bypass,
CI exemption, merge exemption, or secret-detection exemption exists or is
introduced because a change originated from an agent.

## Technology skill integration

This spec's enforcement layer is generic. A future technology skill
(`SPEC-008` → "Technology skill model") plugs _into_ it rather than
replacing it — e.g. once TypeScript source exists beyond the tooling
scripts, `typecheck` gains real work to do; once a framework is adopted,
its skill may add a step to `pnpm run validate` or a CI job, not a
parallel quality system. No such extension exists yet — this spec adds
none speculatively.

## Enforcement status

| Layer                                     | Status                                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Repository structure/hygiene rules        | Documented (this spec, `AGENTS.md`, `boundaries.md`) — no enforcement script beyond `validate:architecture`'s narrow check. |
| Branch/commit conventions                 | Documented; commit-message shape is enforced (hook + CI), branch naming is not (advisory only).                             |
| `commit-msg` hook                         | **Implemented and tested** — `tooling/git-hooks/commit-msg`, installed via `core.hooksPath`.                                |
| `pre-commit` hook                         | **Implemented and tested** — format + staged-secret checks.                                                                 |
| `pre-push` hook                           | **Implemented and tested** — full `validate` + `format:check`.                                                              |
| Central quality commands                  | **Implemented** — `package.json` → `scripts` (see table above).                                                             |
| Secret detection                          | **Implemented**, baseline only (see limits above).                                                                          |
| Architecture boundary check               | **Implemented**, scoped to what's checkable without source.                                                                 |
| CI quality gate                           | **Implemented** — `.github/workflows/ci.yaml`.                                                                              |
| Local/CI parity                           | **Implemented** — same underlying commands both places.                                                                     |
| Branch protection (GitHub setting)        | **Not configured** — a repository-host action; documented as a gap, not simulated as done.                                  |
| PR template                               | **Not created** — no real PR history yet to shape one from; deferred.                                                       |
| Dependency vulnerability scanning         | **Deferred** — no real dependency exists yet beyond dev tooling.                                                            |
| Framework/container/IaC security scanning | **Deferred** — technology-skill-scoped, no such technology adopted yet.                                                     |

## Explicit non-goals

A custom Git server, a self-hosted CI runner fleet, complex release
orchestration, a multi-environment deployment platform, an autonomous
AI-merge bot, a distributed build platform — none of this is proportional
to a repository with zero deployables. Also out of scope: any
technology-specific linter/scanner (React, Next.js, PostgreSQL, Docker,
Terraform, Kubernetes, an E2E framework) for a technology not actually in
use; a new architectural decision beyond `ADR-009` (this spec
operationalizes existing decisions plus that one narrow tooling choice);
runtime, orchestration, graph implementation, MCP infrastructure, or any
application/server/agent/package implementation.

## Status

`active` — governs repository structure hygiene, Git conventions, and the
implemented enforcement layer from M13 onward.
