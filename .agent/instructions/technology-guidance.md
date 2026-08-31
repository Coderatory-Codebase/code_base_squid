---
id: technology-guidance
type: instruction
applies_to: encountering-or-adopting-a-technology
---

# Technology Guidance

What to do when a task involves a specific technology (a language,
framework, library, database, platform, or tool). Durable, comprehensive
definition:
`.project/specs/SPEC-012-technology-ecosystem-and-guidance-governance.md`.
This file doesn't restate it — read that spec once, return to it before
proposing a new or changed skill.

## When a technology is involved

1. Identify it. Check `.agent/skills/` for a matching technology skill.
2. Skill exists → load it, apply it alongside `engineering-standards.md`
   and this project's own constraints (`SPEC-008` → "Guidance
   precedence" governs conflicts).
3. No skill → ask whether `SPEC-008`'s existing technology-neutral
   principles already answer the question. Usually they do — proceed.
4. If they genuinely don't: assess against `SPEC-012` → "Skill creation
   criteria" (and its non-criteria) before assuming a skill is warranted.
   Most gaps don't need one.

## Local guidance vs. ecosystem guidance

"How we're using this technology in this project" is a project decision,
not automatically a rule for every future project. Don't generalize one
implementation choice into a skill without going through the process
below — see `SPEC-012` → "Ecosystem vs. project".

## Avoid skill proliferation

A package being installed, a dependency in `package.json`, or the agent
knowing a technology is never sufficient reason to create a skill.

## Durable ecosystem changes need a human

Creating a new technology skill, or materially changing an existing one,
is a durable operating-model change — propose it (`SPEC-012` → "Human
approval" has the proposal shape) and get explicit human approval before
it becomes part of the shared ecosystem. Routine implementation choices
inside an already-adopted technology remain fully autonomous; only
_adding to or changing shared guidance_ needs a human.

## Escalate consequential decisions

A technology choice that touches architecture, security, privacy, data
ownership, infrastructure, deployment, significant cost, an external
vendor, a major dependency, or a repository-wide standard escalates to
the human (`SPEC-012` → "Escalation triggers"). Ordinary implementation
decisions don't.

## Before adopting guidance

Validate it's current — prefer official docs/specs/release notes/security
advisories over remembered knowledge for anything fast-moving
(`SPEC-012` → "Authoritative-source behavior"). If a skill you're about
to rely on looks stale, don't blindly follow it — surface the conflict
(`SPEC-012` → "Conflict handling").

## Discovered guidance needs, mid-feature

Capture as a backlog item (`backlog-and-feature-development.md`,
`SPEC-010`) — "we need better guidance for X" is a discovery, not
authorization to create the skill immediately.
