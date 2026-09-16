# Claude Operating Notes

This repository is an agent-native monorepo foundation.

Follow `AGENTS.md` and `architecture.yaml`. Do not introduce an external monorepo orchestration framework as the control plane. Keep the distinction between these planes clear:

```text
Code plane: apps/, servers/, packages/, prebuilt/
Control plane: codebase/
Enabler plane: enablers/
Agent plane: .agent/, .project/, AGENTS.md, CLAUDE.md, architecture.yaml
```

Use the repository CLI for discovery and validation instead of inventing ad hoc commands.

The repository is the workspace. Do not insert a project namespace between the root and
workspace units. Document `apps/web` and `servers/api` as defaults, but create them only
for an actual product/runtime requirement. Organize business behavior by feature. Server
features use optional role-named files in the feature directory; only domain complexity
justifies a `domain/` subdirectory. Prefer pure functions, immutable data, composition,
and explicit dependency objects over classes, inheritance, global state, or DI containers.
