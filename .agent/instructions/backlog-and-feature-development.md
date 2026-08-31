---
id: backlog-and-feature-development
type: instruction
applies_to: receiving-and-scoping-implementation-work
---

# Backlog & Feature-Driven Development

How to behave when given implementation work, before any code is
written. Durable, comprehensive definition:
`.project/specs/SPEC-010-agent-backlog-and-feature-driven-development.md`.
This file doesn't restate it — read that spec once, return to it when a
scoping decision feels ambiguous. Does not replace
`development-lifecycle.md`/`development-loop.md`; this is the
work-management layer around them.

## Central rule

**Discovery does not automatically become implementation scope.**
Analysis will surface more than the feature needs — capture the rest,
don't build it (`SPEC-010` → central principle).

## Before writing any code

1. Understand the request — don't start implementing from a first
   guess at intent.
2. Check whether it already exists (search the repository, `.project/`,
   and — once real items exist — `.project/backlog/`).
3. Identify the smallest coherent feature this request actually needs
   (`SPEC-010` → "Feature slicing").
4. Analyze through the lenses that are actually relevant — not all of
   them (`SPEC-010` → "Analysis lenses").
5. Identify constraints, dependencies, and edge cases.
6. Resolve ambiguity from existing architecture/ADRs/SPECs/convention
   where possible; ask the human only when it materially affects
   behavior, architecture, scope, or security (`SPEC-010` → "Ambiguity
   handling").
7. Escalate to an RFC or SPEC only when the question or the knowledge
   genuinely warrants one (`SPEC-010` → "RFC/SPEC escalation") — most
   work doesn't.

## Defining scope

Explicitly separate **needed now** from **discovered**
(`SPEC-010` → "'Needed now' vs. discovered"). For anything discovered but
out of scope: capture it as a `BACKLOG-<NNN>` item once
`.project/backlog/` conventions apply (see `SPEC-010` → "Persistence"),
don't implement it "while already here" — that's the scope-expansion
anti-pattern `SPEC-010` names explicitly. If discovered work is a real
_dependency_ of the current feature, don't auto-implement it either;
determine whether it already exists, deserves its own feature, or should
reshape the current one (`SPEC-010` → "Dependency handling").

## Planning and implementing

Produce a plan proportional to the feature's size
(`development-lifecycle.md` → "Proportionality"; `SPEC-010` → "Feature
planning"). Write acceptance criteria as observable behavior, not task
lists (`SPEC-010` → "Acceptance criteria"). Then follow the existing
lifecycle/loop unchanged: `UNDERSTAND → PLAN → IMPLEMENT → VALIDATE →
REVIEW → RECORD → COMPLETE`, with `development-loop.md`'s reasoning inside
IMPLEMENT. Load a technology skill only for technologies the feature
actually involves (`engineering-standards.md`).

## When something goes wrong or gets blocked

Don't silently work around a blocker by changing the requirement.
Capture the blocker, its impact, and what resolution is required
(`SPEC-010` → "Blocked work"), then return the item to `blocked` rather
than guessing past it.

## Before calling a feature complete

Evaluate: what was completed, what remains, what was discovered, what
was deferred, what decisions were made, what follow-up work is now known
(`SPEC-010` → "Backlog updates after a feature"). Update
`.project/backlog/` accordingly — new `captured` items for real
discoveries, status changes for anything selected/in-progress. Then
finish `development-lifecycle.md`'s RECORD/COMPLETE as usual.

## What this instruction does not change

Git mechanics (`git-governance.md`), the quality gate (`validation.md`),
the capability model (`capability-model.md`), and the package/contract
model (`packages.md`/`contracts.md`) are all unchanged and unrestated
here — this file is only about deciding what belongs in the current
feature.
