# Skill Format

A skill is a self-contained, discoverable capability: `<skill-name>/SKILL.md`.

Minimum required frontmatter — enough for an agent to decide relevance
without reading the body:

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

Body: the actual instructions/steps. No separate manifest file — the
frontmatter above the body is the manifest. Add fields beyond the minimum
only when they provide a concrete discovery/validation benefit (per
`AGENTS.md` → Metadata / manifests); don't add fields for symmetry with
some future catalog.

New skills go in their own `<skill-name>/` directory (room for supporting
files later) using `../templates/skill.template.md` as the starting point.
