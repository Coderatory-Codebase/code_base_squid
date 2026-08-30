---
id: SPEC-005
type: spec
title: Capability model — required properties
status: active
created: 2026-08-30
related: [SPEC-001, SPEC-003, SPEC-004, ADR-008]
---

# SPEC-005: Capability Model

Operational guidance: `.agent/instructions/capability-model.md` (the
six-way distinction) and `.agent/skills/README.md` (skill-specific
detail). This spec is the durable "what must be true" statement; those
files are how an agent applies it.

## What must be true

- **Six concepts stay distinct**: instruction (standing rule), workflow
  (lifecycle stages), skill (on-demand reusable capability), tool
  (something directly invoked), package (reusable source code, `ADR-008`/
  `SPEC-003`), agent (an independent runtime, not yet instantiated in this
  repository). None is redefined as another for convenience.
- **A skill is not executable software.** It is a capability description
  an agent follows — procedural knowledge, an analysis method, a
  repository operation, a validation capability, or a tool-assisted
  capability.
- **Skill metadata stays minimal**: `name`, `type`, `description`,
  `when_to_use`, `requires`, `produces`. A field is added only with a
  demonstrated discovery/validation need — not `author`, `owner`,
  `priority`, `dependencies`, `version`, `lifecycle`, `permissions`,
  `runtime`, `implementation`, or `provider` by default.
- **A skill's minimum valid structure is one file**: `SKILL.md`. No
  additional file (manifest, config, source, test, its own README) is
  required by default.
- **Discovery is filesystem-only.** No registry, database, or generated
  index — an agent lists `.agent/skills/`, reads frontmatter, then the
  body.
- **A skill is created only for a genuine, already-demonstrated,
  currently-needed capability** — never speculatively, never merely
  because a task could be described as skill-shaped.
- **Composition is human-readable prose**, not a dependency graph a
  system resolves. A skill may reference another capability in its own
  text.
- **Inputs/outputs are conceptual**, stated in `requires`/`produces` as
  prose. No schema or runtime contract is introduced to formalize them —
  consistent with `SPEC-003`'s rule that a contract exists only once a
  real provider/consumer boundary needs one.
- **Failure behavior and side effects are stated in the skill body when
  relevant.** A skill reports failure rather than suppressing or working
  around it, and hands control back to the calling workflow's
  failure-handling loop (`SPEC-004`). Side effects are classified as
  read-only, validation, or modifying, with modifying effects stated
  precisely.
- **No skill implies a package, and no package implies a skill.** A
  skill may describe how to use a package's capability; the skill and the
  package remain separate artifacts serving separate consumers (an agent,
  vs. imported code).
- **No runtime is introduced to support any of the above** — no skill
  loader, registry, executor, dependency resolver, API, database,
  marketplace, version manager, or compiler. The filesystem plus Markdown
  is the complete implementation.

## Status

`active` — governs every instruction, workflow, skill, and their
relationship to tools/packages/agents from M07 onward.
