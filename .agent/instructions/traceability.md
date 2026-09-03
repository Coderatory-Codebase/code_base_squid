---
id: traceability
type: instruction
applies_to: recording-how-meaningful-work-was-actually-done
---

# Traceability

When and how to keep a durable record of what you actually did — not a
second place anything gets decided. Durable, comprehensive definition:
`.project/specs/SPEC-013-agent-execution-traceability.md`. This file
doesn't restate it — read that spec once, return to it when unsure
whether a trace is warranted or what belongs in one.

## When to create a trace

Proportional to the work, same principle as artifact usage generally
(`development-lifecycle.md` → "Proportionality"):

```text
question / simple explanation        → no trace
small implementation change          → lightweight trace
feature, architecture change,
  technology adoption, ecosystem
  guidance change, operational change → full trace
```

Most interactions need none. Don't create one for its own sake.

## Identity and location

`TRACE-<NNN>`, `.project/traces/TRACE-<NNN>-<slug>.md` — same convention
as every other `.project/` artifact (`ARTIFACT-TYPES.md`).

## Write it as you go, not at the end

Create the trace file at (or before) the first meaningful checkpoint and
append to it as each subsequent checkpoint actually completes — don't do
the whole piece of work and then reconstruct the trace from memory
afterward. A checkpoint is one entry against a lifecycle/loop/governance
stage; record only the fields that actually apply (`SPEC-013` →
"Checkpoint structure" has the full field list) — most checkpoints need
only a few lines. Batching a few already-completed checkpoints into one
update is fine; reconstructing the entire trace at the end is the thing
to avoid (`SPEC-013` → "Progressive recording").

## What to record

Only what actually happened, by reference, not by restating: what was
requested and how you classified it — including whether it touched the
foundation, a project, or both (`SPEC-011` → "Foundation vs. project
classification", added M23); which instructions/workflows/skills
were genuinely applicable; what existing artifacts (ADR/SPEC/backlog
item/skill) the work drew on; which analysis lenses actually mattered;
decisions with their **source** (human / agent / existing rule / external
guidance / validation result) and **status**; what was needed now vs.
discovered vs. deferred (reference the `BACKLOG-<NNN>` it became); what
was implemented (meaningful engineering events — files/artifacts
touched, not commands run); which validations ran and their outcome,
including a failure that got fixed (don't collapse it into a bare
"passed"); review outcome; Git/PR outcome; final result.

## What not to record

Private reasoning, a command-by-command or file-read transcript, every
trivial action. Capture enough to reconstruct the engineering journey,
not a session recording.

## Human decisions

Never imply an agent made a decision that was actually the human's.
Record what was asked, why, the decision, who made it, and its status
(`awaiting-human`/`approved`/`rejected`/`clarified`/`overridden`) — the
existing human-approval rules (`SPEC-010`, `SPEC-011`, `SPEC-012`)
decide _when_ approval is needed; this file only records that it
happened.

## Integrity

Don't claim validation, approval, a skill's use, a file change, or a PR
that didn't happen. Don't silently drop a real failure from the record.
Append corrections rather than rewriting a trace's history — same rule
`SPEC-011` already applies to ADRs/SPECs, applied here to trace files.

## Conformance review vs. self-review (added M24)

A trace's own checkpoints are self-reported while the work is fresh.
When a completed, already-validated unit of work is significant or
security-sensitive enough to warrant independent re-checking, perform a
**conformance review**: re-read the actual current files/behavior, not
the trace's own narrative, and record a new trace referencing the one
being reviewed — never edit the original's history. Full model:
`SPEC-013` → "Conformance review". `TRACE-009` is the real precedent.

## Closing a trace

Move it to `completed` (or the appropriate side state — `blocked`,
`deferred`, `cancelled`, `rejected`) once it can answer what was
requested, decided, implemented, validated, reviewed, and how it ended.
Reference the artifacts it produced (RFC/SPEC/PLAN/BACKLOG/REVIEW/commits/
PR) rather than duplicating them.
