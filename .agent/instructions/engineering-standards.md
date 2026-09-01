---
id: engineering-standards
type: instruction
applies_to: designing-or-implementing-software
---

# Engineering Standards & Practice

`architecture.yaml` defines this repository's structural boundaries.
This instruction is the operational entry point into _how to engineer well
inside them_ — principles, reuse/generalization, decoupling, component and
system design, and the technology-skill mechanism. Durable, comprehensive
definition: `.project/specs/SPEC-008-engineering-standards-design-and-practice.md`.
Read that spec once; don't re-derive its content per task, and return to it
when a design decision feels ambiguous.

## Before implementation

Determine what applies: which technologies does this task actually
involve? Check `.agent/skills/` for a matching technology skill
(`skills/README.md` → "Technology skills"). `SPEC-008`'s universal
principles apply regardless of whether a technology skill exists.

## During design

Prefer proportional simplicity (`SPEC-008` → "Proportional architecture").
Don't add a controller/service/repository/factory/adapter/DTO/mapper/
manager layer — or any layer — unless the actual complexity, ownership, or
testing need justifies it. A simple feature may stay a single file.

## When considering reuse

Verify stable commonality across ≥2 real, independent consumers before
extracting anything — the same "ownership before reuse" bar already
applied to contracts (`contracts.md`) and packages (`packages.md`),
generalized to any code-level reuse decision (`SPEC-008` → "Reuse and
generalization"). Don't extract because code merely looks similar; don't
leave genuinely shared, stable behavior duplicated once it's real.

## Before building something new

Work down USE → ADOPT → EXTEND → BUILD before writing custom
infrastructure/utilities/components/services (`SPEC-008` → "Use vs.
build vs. adopt", added M23) — an existing repository capability or
ecosystem skill first, an established library second, a small extension
third, custom last.

## When considering abstraction or generalization

Justify it against the actual, current requirement — not a hypothetical
future one (`implementation.md` → "No speculative abstractions"). Optimize
for clarity and stable reuse, not maximum configurability
(`SPEC-008` → "Component design").

## When using a technology

Check `.agent/skills/` for a matching technology skill before applying
remembered practices from training; none exists yet for anything, because
this repository has no implementation technology in use
(`.project/state/PROJECT-STATE.md` → "Technology profile"). Create one only
once that technology is genuinely used — `skills/README.md` →
"Technology skills". For a fast-moving technology, prefer current
authoritative documentation over stale remembered knowledge
(`SPEC-008` → "Current/authoritative guidance").

## When guidance conflicts

Follow the order in `SPEC-008` → "Guidance precedence." A project-specific
architectural decision (`architecture.yaml`, an accepted ADR) wins over a
generic preference. If technology guidance suggests an existing project
decision is stale or wrong, surface it — don't silently override it — and
route it through `change-management.md`.

## Before completion

Run the engineering review questions (`SPEC-008` → "Engineering review
questions") as part of the existing REVIEW stage
(`development-lifecycle.md`), then the applicable quality gate
(`validation.md`). A documented, justified exception is acceptable
(`SPEC-008` → "Exceptions"); an unexplained deviation is not.
