---
id: SPEC-001
type: spec
title: Foundation definition — required properties of the repository
status: active
created: 2026-08-29
related: [ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, PLAN-001]
---

# SPEC-001: Foundation Definition

## What should exist

A reusable software foundation, not an application, from which future
projects are scaffolded. It must be:

- modular, composable, agent-agnostic at the architectural level
  (ADR-006), Claude-friendly, progressively discoverable (ADR-005),
  testable, versionable, extensible, and explicit about boundaries.
- structured so `packages/` is the only reuse boundary (ADR-001), and
  business/domain logic lives inside the deployable that owns it
  (ADR-002).
- architecturally unopinionated about any single methodology per
  deployable (ADR-003).
- split into an agent operating system (`.agent/`) and project memory
  (`.project/`) that never overlap in responsibility (ADR-004).

## Required top-level boundaries

`.agent/`, `.project/`, `apps/`, `servers/`, `agents/`, `packages/`,
`infra/`, `tooling/`, `docs/`, plus the four root definition documents
(`README.md`, `architecture.yaml`, `AGENTS.md`, `CLAUDE.md`) and standard
workspace tooling (`package.json`, `pnpm-workspace.yaml`, `tsconfig.json`).
Full definitions: `architecture.yaml` → `boundaries`.

A boundary is populated only when a concrete capability requires it — an
empty, not-yet-created boundary satisfies this spec; a populated one with
speculative content does not.

## Required repository behavior

- A clean clone can run `pnpm install` followed by the quality gate
  (`lint → typecheck → test → build`) successfully at all times.
- The active phase remains discoverable from `architecture.yaml` →
  `roadmap`; detailed milestone history lives in
  `.project/roadmap/MILESTONES.yaml`, and `README.md`'s maturity section
  doesn't drift from live state.
- No milestone is implemented ahead of its position in the roadmap without
  an explicit decision to do so.

## Non-goals (this spec does not require, at this stage)

A full agent runtime, an orchestration engine, MCP infrastructure, a
populated package set, a project generator, a graph database, a control
panel, business domain implementations, authentication, or a working
web/mobile application. See `architecture.yaml` → `non_goals_current_phase`
for the authoritative, milestone-scoped list — it changes as milestones
advance; this spec's higher-level requirements do not.

## Status

`active` — these requirements currently govern the repository and are not
expected to be superseded by ordinary milestone progress, only by a
deliberate architectural change (which would be recorded as a new ADR and
would supersede this spec via a follow-up `SPEC-00N`).
