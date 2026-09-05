---
name: app-analysis
type: workflow
version: 1
when_to_use: >
  Analyzing a seed application or proposed product direction before
  selecting a feature to implement, especially when the user asks what
  should be built, how to divide work into features, or what the app
  needs from multiple lenses.
---

# App Analysis Workflow

Use this on the discovery track for either the repository foundation or a
project/product inside it. It does not implement features by itself.

## Route

Confirm whether the request is:

- `FOUNDATION`: operating model, architecture, workflows, skills,
  validation, artifact/backlog/state conventions.
- `PROJECT` / `SEED_APP`: product behavior inside a project-owned
  app/server/agent. Load `.project/projects/<project>/PROJECT.md` when
  it exists.
- `CROSS_CUTTING`: both, with foundation and project portions separated.

If the route is unclear and the distinction changes what files would be
edited, ask before proceeding.

## Lenses

Select only relevant lenses, but consider the app from more than code
shape:

```text
Product value
User workflows
Domain model
Information architecture
UX/UI and accessibility
API and integration boundaries
Data model and persistence
Security and privacy
Performance and reliability
Observability and operations
Testing and QA
Dependency and vendor choices
Architecture and package boundaries
Developer experience
Risks and constraints
```

## Outputs

Produce one or more of:

- backlog updates, with level/parent relationships when the backlog model
  supports them
- scope/owner classification for backlog updates
- feature slices with acceptance criteria
- SPEC for durable requirements or behavior
- ADR for material architecture or technology decisions
- PLAN for selected implementation work
- explicit non-goals and rejected ideas when useful

Do not turn discoveries into implementation scope unless they are required
for the selected feature.

## Exit

Analysis is done when the agent can name the recommended next feature
slice, the evidence for it, what is out of scope, and which artifacts
should be created or updated before implementation.
