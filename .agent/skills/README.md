# Skills

**A skill is a discoverable, reusable capability that tells an agent how
to perform a bounded kind of work**, invoked intentionally when that work
comes up — not executable software. See
[`../instructions/capability-model.md`](../instructions/capability-model.md)
for how this differs from an instruction, workflow, tool, package, or
agent; see `../../.project/specs/SPEC-005-capability-model.md` for the
durable "must be true" version of everything below.

A skill's `SKILL.md` should let an agent answer, without executing
anything: what capability this provides, when to use it, what it
requires, what it produces, what its limitations/failure behavior are,
and what side effects it has.

A skill may be procedural knowledge, a repeatable analysis method, a
repository operation, a validation capability, or a tool-assisted
capability — whatever form the capability actually takes. It is never a
program to run; it's instructions an agent follows.

## Metadata

```yaml
---
name: kebab-case-name
type: skill
description: One line — what this skill does.
when_to_use: One or two sentences — the trigger condition(s).
requires: [what must already be true/available for this skill to apply]
produces: [what running this skill yields]
---
```

Six fields, each kept because it answers a real discovery question:
`name`/`type` identify it without depending on file path; `description`/
`when_to_use` let an agent decide relevance without reading the body;
`requires`/`produces` state its conceptual inputs and outputs (see
below). No separate manifest file — this frontmatter _is_ the manifest.

**Deliberately not included**, absent a demonstrated need: `author`,
`owner`, `priority`, `dependencies`, `version`, `lifecycle`,
`permissions`, `runtime`, `implementation`, `provider`. Each would add
ceremony (`AGENTS.md` → "Metadata / manifests") without a concrete,
current discovery/validation benefit — e.g. `version`/`lifecycle` presume
skills change often enough to need tracking, which hasn't happened; git
history already covers provenance the way it does for every other file
in this repository.

## Structure

```text
.agent/skills/<skill-name>/
└── SKILL.md
```

That's a complete, valid skill. Additional files (a script, a longer
reference doc) are added only when the capability genuinely needs them —
never by default. A skill is **not** required to have `manifest.yaml`,
`config.json`, `index.ts`, `package.json`, its own `README.md`, a
`tests/` directory, or a `scripts/` directory. Creating a new skill is
`mkdir .agent/skills/<name>` and writing `SKILL.md` — nothing else.

## Discovery

Filesystem discovery only — no registry, database, or generated index.
Skills sit in the standard progressive-disclosure chain (`AGENTS.md` →
"Progressive disclosure"): an agent lists `.agent/skills/`, reads a
candidate's frontmatter (`description`/`when_to_use`) to judge relevance
without opening the body, then reads the full `SKILL.md` only once it
looks applicable.

## Selection

Use a skill when the task matches its capability, it provides a real
reusable procedure, and invoking it removes ambiguity or repeated
reasoning. Don't use — or create — one merely because it exists, its name
sounds relevant, or it adds ceremony to a task simple enough to do
directly. "Run the tests" doesn't need a skill lookup when a skill
happens to also run them as one step of something larger
(`validate-repository` earns its place because it's the _repository
quality gate_, not because "running commands" is skill-shaped).

## Composition

See `capability-model.md` → "Composition, without an engine." Skills
reference each other in prose; nothing resolves that reference
automatically.

## Inputs and outputs are conceptual

`requires`/`produces` describe a skill's inputs and outputs in prose —
e.g. `validate-repository`'s input is "repository state," its output is
"a pass/fail result per gate stage." This is not a typed runtime
interface: no schema or contract formalizes it (consistent with
`SPEC-003` — a contract is created only once a real provider/consumer
boundary needs one; a skill's own doc reading it is not that boundary).

## Failure behavior and side effects

State both in the skill body when relevant:

- **Failure behavior** — what the skill does when it can't complete
  cleanly. At minimum: report what failed, don't suppress or work around
  it, hand control back to the calling workflow's failure-handling loop
  (`development-lifecycle.md`) rather than deciding on its own how to
  proceed.
- **Side effects** — classify plainly: **read-only** (inspects, reports
  nothing changes), **validation** (reports pass/fail, doesn't modify
  files being validated), or **modifying** (changes repository state —
  say what, precisely). A skill never modifies unrelated repository state
  and never bypasses `change-management.md`.

## Technology skills

A technology skill is an ordinary skill — same frontmatter, same
`.agent/skills/<name>/SKILL.md` structure, no special schema — whose
capability is "how to apply this repository's engineering principles
(`../../.project/specs/SPEC-008-engineering-standards-design-and-practice.md`)
using one specific technology." It captures purpose, supported
version context, idiomatic structure, patterns/anti-patterns,
configuration/testing/security/performance/integration/dependency
guidance, and references to that technology's current authoritative
documentation — concisely, not a mirror of vendor docs.

It never applies globally: an agent loads it only once a task actually
involves that technology (a PostgreSQL skill has no bearing on a task with
no PostgreSQL involvement; a React skill isn't a standing instruction for
backend-only work). A universal principle stays in `SPEC-008`; a technology
skill explains how that principle is best realized in one
technology/version, and can change independently as the technology evolves
without touching the universal principle.

**None exist yet** — this repository has no `apps/`/`servers/`/`agents/`/
`packages/` technology in use (`architecture.yaml` → `boundaries`;
`.project/state/PROJECT-STATE.md` → "Technology profile"). Create the
first one only once a real technology is actually being used, following
the same "Creating a new skill" bar below. A nested `technologies/`
grouping under `.agent/skills/` is optional, decided then based on how
many technology skills actually exist — not reserved in advance.

Creating or materially changing a technology skill is a durable
operating-ecosystem change, not a routine implementation decision — it
needs explicit human approval, and most technologies don't clear the bar
for having one at all. Full governance (creation criteria, when _not_ to
create one, ecosystem-vs-project boundary, approval process, conflict
handling, maintenance): `../../.project/specs/SPEC-012-technology-ecosystem-and-guidance-governance.md`,
agent-facing entry point: `../instructions/technology-guidance.md`.

## Implementation-area skills (added M23)

Distinct from a technology skill: guidance for **how to build a kind of
thing well**, largely independent of which technology implements it —
API design, component design, testing strategy, security review
practice, and similar. Same ordinary skill structure and frontmatter as
any other skill; same creation/approval governance as a technology
skill, generalized in
`../../.project/specs/SPEC-012-technology-ecosystem-and-guidance-governance.md`
→ "Implementation-area skills." A technology skill says how to use
Next.js well; an implementation-area skill would say how to design an
API well, regardless of whether it's built in Express, Fastify, or
something else — the two compose (a Next.js skill applying an API-design
skill's principles inside Next.js's own conventions) rather than
duplicate each other.

**None exist yet.** M22's Authentication feature was this repository's
first opportunity to need one and didn't clear the bar — its
architecture stayed proportionally simple enough that `SPEC-008`'s
existing technology-neutral principles were sufficient on their own.
Create the first one only once a genuinely recurring implementation
pattern demonstrates it's needed, following the same "Creating a new
skill" bar below.

## Creating a new skill

Only when a genuine, already-demonstrated, reusable capability exists —
not speculatively, and not because a category of skill "sounds useful."
Use [`../templates/skill.template.md`](../templates/skill.template.md).
