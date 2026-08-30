---
id: boundaries
type: instruction
applies_to: structural-changes
---

# Boundary Rules

`architecture.yaml` is the source of truth. This instruction is the
operational checklist for applying it — read the file itself for the full
statements and rationale.

Before creating any new top-level directory, package, or cross-boundary
dependency:

1. **Is the name in `forbidden_top_level_dirs`?** (`modules`, `services`,
   `business-services`, `domain-services`.) If so, stop — the thing you're
   about to build belongs inside the owning `servers/`, `apps/`, or
   `agents/` deployable instead, or in `packages/` if it's genuinely
   reusable across independent systems. Full extraction criteria (when
   code actually earns a place in `packages/`, and what structure it
   needs): `.agent/instructions/packages.md`.
2. **Does the boundary already exist in `architecture.yaml.boundaries`?**
   If yes, use it as defined. If no, a new top-level boundary is an
   architectural decision — flag it explicitly rather than adding it
   silently (see `change-management.md`).
3. **Does the dependency direction hold?** Check
   `architecture.yaml.dependency_direction`. `packages/` must never import
   from `apps/`, `servers/`, or `agents/`. If avoiding that requires a new
   package, first ask whether the boundary you're crossing is actually
   correct — don't paper over a bad boundary with a package.
4. **Is this speculative?** If the directory/file isn't backed by a
   concrete, current need, don't create it. A milestone name in the roadmap
   is not, by itself, a concrete need until that milestone is active.
