---
id: implementation
type: instruction
applies_to: writing-code-or-config
---

# Implementation Behavior

- **Stay inside the current milestone.** Check
  `architecture.yaml.roadmap.current_phase` before starting. Implementing
  ahead of it (e.g. building M06 workflow orchestration while M03 is
  active) is a structural error, not initiative — flag the gap instead and
  wait for explicit approval to advance the phase.
- **Extend before adding.** Prefer extending an existing config/tool
  already in the repo over introducing a new one. Justify any new
  dependency against what's already installed.
- **No speculative abstractions.** Don't build for a future milestone's
  hypothetical shape. Three similar files are better than a premature
  shared abstraction that guesses wrong about what M04+ will need.
- **Match existing conventions** in the file/directory you're editing
  (frontmatter shape, heading structure, script naming) before inventing a
  new one.
- **Composable architecture, not a house style.** Don't impose one
  methodology (DDD, hexagonal, CQRS, ...) repo-wide when implementing
  inside `apps/`, `servers/`, or `agents/` — that choice belongs to each
  deployable, made when it's actually created.
