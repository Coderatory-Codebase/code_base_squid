---
id: PLAN-001
type: plan
title: Foundation bootstrap — M01 through M03
status: complete
created: 2026-08-29
updated: 2026-08-30
related: [SPEC-001, ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006]
---

# PLAN-001: Foundation Bootstrap (M01–M03)

## Goal

Accomplish the first three milestones of `SPEC-001` in strict sequence,
each one gated on the previous being complete and consistent, without
implementing anything beyond the current milestone's scope.

## Steps

1. **M01 — Foundation Definition.** Produce `README.md`, `architecture.yaml`,
   `AGENTS.md`, `CLAUDE.md`. No workspace tooling, no `.agent/`/`.project/`
   content. Exit: the four documents exist and don't contradict each
   other.
2. **M02 — Repository Bootstrap.** Initialize git; add pnpm workspace,
   root `package.json`/`tsconfig.json`, ESLint (flat config) +
   typescript-eslint + Prettier, Vitest, a `tsc -b` build gate, `.gitignore`,
   and a GitHub Actions CI workflow running the same gate. Exit: a clean
   `pnpm install` followed by `pnpm run validate` succeeds.
3. **M03 — Claude Agent Bootstrap.** Add `.agent/` with the minimum
   structure (`instructions/`, `workflows/`, `skills/`, `templates/`)
   covering repository orientation, boundary rules, implementation
   behavior, validation behavior, and change/git behavior; four workflow
   lifecycle specs (feature/bugfix/refactor/review); one concrete skill
   (`validate-repository`); and authoring templates for workflows/skills.
   Exit: quality gate still green, `.agent/` internally consistent with
   `AGENTS.md`/`CLAUDE.md`.

Each step's exit check included re-running the quality gate and a manual
cross-document consistency check — recorded in `REVIEW-001`.

## Explicitly out of scope for this plan

M04 onward (project artifact system, contract system, workflow engine,
skill catalog, MCP, packages, scaffolder, self-hosting, hardening) — each
is its own future plan, scoped when that milestone starts.

## Status

`complete`. All three steps landed, each validated before the next began.
