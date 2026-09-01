---
id: SPEC-012
type: spec
title: Technology ecosystem & guidance governance
status: active
created: 2026-08-31
updated: 2026-08-31
related: [SPEC-005, SPEC-008, SPEC-010, SPEC-011, SPEC-013]
---

# SPEC-012: Technology Ecosystem & Guidance Governance

> **M23 amendment**: one new section, "Implementation-area skills" —
> this spec's entire governance machinery (creation criteria, missing-
> guidance flow, human approval, conflict handling, maintenance) already
> applies word-for-word to durable guidance about _how to build things_
> (API design, component design, testing strategy, ...), not only
> guidance about a specific technology. M22 never needed one (nothing
> recurring enough existed yet), but the boundary was worth naming
> explicitly rather than leaving "is this a technology skill?" as the
> only question an agent knows to ask. No new governance model — the
> existing one, generalized to the shape of skill it was already
> equipped to govern.

Operational entry point: `.agent/instructions/technology-guidance.md`. This
spec is the comprehensive, durable definition; that file is the shorter
agent-facing pointer into it.

## Purpose

M12 (`SPEC-008`) established that technology-specific guidance lives in
ordinary skills (`.agent/skills/README.md` → "Technology skills"), loaded
only when a task actually involves that technology. It did not say **who
decides a skill should exist**, **what a skill may and may not claim**,
or **when creating one is consequential enough to need a human**. This
spec answers those three questions so the operating ecosystem can grow
deliberately as real technologies are adopted, without an agent silently
rewriting the repository's permanent rules along the way.

## Scope

Governance for how technology-specific guidance enters, composes with,
and is maintained inside this repository's existing skill mechanism. Does
**not** redefine what a skill is (`SPEC-005`), does not change the
engineering-principle content of `SPEC-008`, and does not itself create
any technology skill. Zero technology skills exist before or after this
milestone (`architecture.yaml` → `boundaries`; no `apps/`/`servers/`/
`agents/`/`packages/` technology is in use).

## Ecosystem vs. project

The distinction this spec exists to make explicit:

```text
Operating ecosystem                    Project
  ↓                                       ↓
Reusable knowledge/rules for agents     Technology choices/decisions
across projects/repositories            made for one particular project
```

| Example                                                                                  | Kind                                                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| "Recommended Next.js structure, server/client boundary practices, testing guidance"      | Ecosystem (a technology skill)                                                                                |
| "This application uses Next.js App Router and deploys as a static site to S3/CloudFront" | Project (a decision recorded where the project records decisions — an ADR/SPEC for that project, not a skill) |
| "Use React Query for server state" (in one project)                                      | Project, unless and until generalized deliberately                                                            |
| "All projects should use React Query"                                                    | Ecosystem — requires the process below, never assumed from one project's choice                               |

**An implementation choice never silently becomes ecosystem policy.**
Generalizing "how we did it here" into "how the ecosystem does it" is
itself the durable change this spec gates (see "Human approval").

## Technology skills, restated precisely

A technology skill is technology-specific **engineering guidance** — not
project configuration, not a package, not a runtime, not a framework
wrapper, not a generator, not a tool installer, not a dependency manager,
not application code, not an agent, not a workflow engine
(`capability-model.md` already draws every one of these lines; this spec
adds none). It remains an ordinary skill: same frontmatter, same
`.agent/skills/<name>/SKILL.md` structure, no second schema
(`SPEC-005`, `skills/README.md` → "Technology skills"). This spec governs
_when and how_ one comes to exist, not _what it looks like_.

## Scope of "technology"

Applies proportionally to language, framework, library, database,
runtime, platform, cloud service, infrastructure technology, testing
technology, build technology, and developer tooling alike. The category
doesn't determine whether a skill is warranted — the criteria below do.
**A technology's mere presence never justifies a skill**: a tiny utility
library, a one-off dependency, trivial configuration glue, or a
technology already fully covered by an existing higher-level skill
(see "Composition") typically doesn't earn one.

## Skill creation criteria

Consider a skill when the technology:

```text
is significant to the repository's development
has meaningful engineering-specific practices (not just an API surface)
will likely see repeated use, not a one-off
carries meaningful consequences for mistakes
has real architectural/security/performance/testing considerations
would benefit future agents from consistent guidance
cannot be adequately expressed by SPEC-008's existing technology-neutral principles
```

## Skill non-creation criteria

Do **not** create a skill merely because:

```text
a package was installed
a dependency appears in package.json
the agent happens to know the technology
the user mentioned a library in passing
a one-off implementation uses it
the technology is popular
the agent wants somewhere to record its own preferences
```

Skill proliferation is a real cost (maintenance burden, staleness risk,
more places guidance can silently drift) — treat "should this exist" as a
real question every time, not a formality on the way to "yes."

## Missing-guidance decision flow

```text
Technology identified
        ↓
Existing skill?
   ┌────┴────┐
  YES        NO
   ↓          ↓
 load    Do existing technology-neutral principles (SPEC-008) already
          answer the question?
             ┌────┴────┐
            YES        NO
             ↓          ↓
          proceed   Is this genuinely reusable beyond the current
                     work, version-sensitive in a way worth recording,
                     and does it clear the creation criteria above?
                        ┌────┴────┐
                     project-local  ecosystem-worthy
                        │                │
                     proceed         propose a durable skill
                     (record locally      (see "Human approval")
                      if it has real
                      durable value,
                      same as any
                      other decision —
                      development-
                      lifecycle.md ->
                      "Recording")
```

An agent must not create a permanent skill merely because none exists —
"no guidance yet" is the normal state for most technologies, not a gap to
close reflexively.

## Implementation-area skills (added M23)

Distinct from a technology skill, but governed by exactly the same
machinery in this spec:

```text
Technology skill          -> "how to use technology X well"
Implementation-area skill -> "how to build a kind of thing well,"
                              largely independent of which technology
                              implements it (API design, component
                              design, testing strategy, security review
                              practice, ...)
Project convention        -> a decision this project made, not durable
                              ecosystem guidance (see "Ecosystem vs.
                              project")
Library documentation     -> the dependency's own docs, not this
                              repository's guidance
Tooling configuration     -> how a specific tool is configured/invoked
                              here, not engineering judgment about how
                              to build something
```

These are not interchangeable, and confusing one for another produces
guidance in the wrong place: a technology skill that tries to also teach
general API design duplicates what an implementation-area skill should
hold instead; an implementation-area skill that hard-codes one
technology's specifics belongs partly in a technology skill instead.
Everything this spec already says about technology skills — "Skill
creation criteria"/"non-creation criteria," the "Missing-guidance
decision flow," "Human approval," "Conflict handling," "Maintenance" —
applies to an implementation-area skill identically; nothing here is
reproved for the second case. Structure and mechanics:
`.agent/skills/README.md` → "Implementation-area skills." **None exist
yet** — M22's Authentication feature didn't surface a genuinely recurring
implementation pattern distinct from ordinary `SPEC-008` judgment; this
section exists so the distinction is available the first time one does,
not to manufacture one now.

## Guidance precedence

Unchanged — `SPEC-008` → "Guidance precedence" remains the single source
of truth, not reinvented here:

```text
1. Hard safety/security constraints
2. architecture.yaml
3. Accepted ADRs / active SPECs
4. Project-specific engineering standards (SPEC-008, this spec)
5. Technology-specific skill guidance
6. Library/framework's own documented guidance
7. Current authoritative external documentation
8. General engineering principles
9. Agent judgment
```

This spec's only addition: a technology skill never overrides an explicit
project or repository constraint without that constraint itself being
changed through its own proper process (an ADR/SPEC update) — the skill
informs, it does not author policy by existing.

## Skill composition

A skill references other applicable guidance rather than duplicating it —
the existing mechanism (`capability-model.md` → "Composition, without an
engine"; `skills/README.md` → "Composition"), extended by exactly one
observation: technology skills will often chain (a Next.js skill points
at a React skill, which points at a TypeScript skill, which points at
`SPEC-008`) rather than each restating the technology below it. No
dependency resolver reads that chain automatically — a human or agent
does, by reading the referenced skill. Avoid manufacturing a chain deeper
than the actual technology stack requires.

## Version sensitivity

Distinguish **technology identity** from **technology version**. A skill
states its version assumptions explicitly whenever they materially
change the guidance ("this applies to Next.js's App Router, not the
Pages Router" is meaningfully different guidance, not a detail).
No dynamic version-management system, dependency-tracking infrastructure,
or automated staleness detector is built — this is a documentation
discipline the skill's author applies at write time and revisits at
review time (see "Maintenance"), not tooling.

## Authoritative-source behavior

Unchanged — `SPEC-008` → "Current/authoritative guidance" already states
this: for a fast-moving technology, prefer current official
documentation/specifications/release notes/security advisories/maintainer
sources over stale remembered knowledge; community guidance may inform
judgment but never automatically overrides a primary source or a
repository constraint. Not a mandatory research process for every
technology — proportional to how much the guidance actually matters and
how fast the technology moves.

## Maintenance

A technology skill is maintained ecosystem knowledge, not permanent
truth. Reconsider it when: a major version change occurs, an API it
relies on is deprecated, official recommendations change, a security
advisory affects it, implementation repeatedly fails in a way the skill
didn't anticipate, or repeated real discoveries contradict it. No skill
registry, staleness dashboard, or automated update service — the existing
repository structure (the skill is one file, git history shows when it
last changed) remains the entire discoverability/maintenance mechanism.

## Conflict handling

- **Skill vs. project decision** → the project decision wins (it's
  higher in `SPEC-008`'s precedence; it was made with the specific
  project's actual constraints in view).
- **Skill vs. explicit repository engineering standard** → the standard
  wins, unless the standard itself is deliberately changed through its
  own process — a skill never earns a change to `SPEC-008` merely by
  disagreeing with it.
- **Skill is demonstrably stale** → don't blindly follow it. Surface the
  conflict, research current authoritative guidance
  ("Authoritative-source behavior"), and propose an update through the
  same human-approval path as creating a new skill (see below) — a stale
  skill is still ecosystem knowledge; fixing it is still a durable change.
- Never silently rewrite a historical decision to resolve a conflict —
  `ARTIFACT-TYPES.md`'s lifecycle states (`superseded`, etc.) and
  `SPEC-011` → "Historical decisions are not silently rewritten" govern
  this unchanged.

## Human approval

**Hard rule.** An agent may discover missing guidance, research it,
analyze alternatives, prepare a proposed skill, identify risks, and
recommend whether it belongs in the ecosystem — entirely autonomously.
It must not **create or materially change** a technology skill that
becomes shared, durable repository guidance without human approval, the
same way it must not silently expand a feature's scope
(`SPEC-010`) or silently rewrite an ADR (`SPEC-011`). This is a durable
operating-ecosystem decision, not a routine implementation choice.

A proposal states:

```text
Technology
Why guidance is needed
Why existing guidance (SPEC-008, an existing skill) is insufficient
Scope of the skill
What it will standardize
What it deliberately will not standardize
Sources/current guidance considered
Version assumptions
Alternatives considered
Maintenance implications
Project impact
Ecosystem impact
Proposed artifact/change
```

Proportional to the actual decision — this is the full shape for a
genuinely new, significant skill; a small, low-risk update to an existing
skill (a version-assumption correction, a newly-deprecated API note)
still needs a human to say yes, but the proposal itself can be a few
sentences, not the full template. After approval, the skill (or its
change) becomes part of the durable ecosystem the same way any approved
change does — committed, discoverable, and governed going forward by this
spec.

**Routine implementation autonomy is unaffected.** Choosing how to use an
already-adopted technology inside one project, applying an existing
skill's guidance, or making an ordinary local implementation decision
never requires this approval — only the act of adding to or changing
_shared, durable_ guidance does.

## Escalation triggers

Beyond skill creation itself, a technology decision escalates to a human
when it affects: architecture, security, privacy, data ownership,
infrastructure, deployment, significant cost, an external vendor, a major
dependency, a repository-wide standard, or a permanent technology
convention. This is `SPEC-010` → "Human feedback points" and `SPEC-011`
→ "Instruction precedence" applied specifically to technology decisions —
not a new escalation model. Routine implementation choices (which helper
function, which local variable name, which of two equivalent idioms)
remain fully autonomous.

## Skill creation is an operating-model change

Creating or materially updating a durable technology skill follows the
existing development lifecycle and loop unchanged —
`development-lifecycle.md` (`UNDERSTAND → PLAN → IMPLEMENT → VALIDATE →
REVIEW → RECORD → COMPLETE`) and `development-loop.md`'s reasoning inside
IMPLEMENT. No separate "skill development lifecycle" is created; a skill
is simply what gets recorded at that lifecycle's RECORD stage when the
work was "produce durable technology guidance."

## Agent decision flow

Integrates with, does not duplicate, `SPEC-011`'s bootstrap sequence:

```text
User request
      ↓
Identify technologies involved         (SPEC-011 -> "Layered discovery")
      ↓
Check project constraints / architecture / decisions   (SPEC-008 precedence)
      ↓
Check engineering standards            (SPEC-008)
      ↓
Check technology skills
      ↓
Skill exists? --yes--> load, apply, proceed
      │
      no
      ↓
Assess guidance need (this spec -> "Missing-guidance decision flow")
      ↓
Needed and ecosystem-worthy? --no--> proceed with local judgment,
      │                              record locally if durable
      yes
      ↓
Propose durable skill --> human approval --> create/update skill
      ↓
Implement -> Validate -> Review -> Record discoveries (SPEC-010, SPEC-011)
```

## Relationship to the backlog

A discovery like "we need better guidance for technology X" is captured
the same way any discovery is (`SPEC-010` → "Discovery capture") — it
does **not** mean "create the skill now." Capture → assess against the
criteria above → if it clears them, propose → human approval → then
create/update. One backlog (`ADR-010`), not a second one for technology
discoveries specifically.

## Relationship to the project technology profile

`PROJECT-STATE.md` → "Technology profile" records what a project has
actually **adopted** — a fact about this repository's current state. A
technology **skill** records reusable ecosystem **guidance** — knowledge
that could apply to any project using that technology, including ones
this repository hasn't built yet. Adopting a technology doesn't
automatically produce a skill (most adoptions won't clear the creation
criteria above), and a skill existing doesn't imply the technology is
adopted here (a skill could, in principle, be approved in anticipation of
known upcoming work — though creating one before any real use remains
the speculative-skill anti-pattern this spec argues against by default).
As of M17, both remain empty: no technology adopted, no technology skill.

## Non-goals

No technology registry, skill generator, skill-discovery runtime, dynamic
plugin system, automated version-tracking infrastructure, or skill
staleness dashboard. No MCP, agent runtime, or orchestrator. No
Next.js/React/TypeScript/Rust/Python/PostgreSQL/Docker/AWS/etc. skill —
none is created by this milestone, and none should be created later
without clearing "Skill creation criteria" and "Human approval" above.
No new artifact type, ID scheme, or backlog. No change to `SPEC-005`'s
skill definition or `SPEC-008`'s engineering principles/precedence — this
spec governs the _process_ around technology skills, not their content or
mechanism.

## Status

`active` — governs how technology-specific guidance is assessed,
proposed, approved, composed, versioned, maintained, and conflict-
resolved, from M17 onward.
