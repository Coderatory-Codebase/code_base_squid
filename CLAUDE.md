# Claude Operating Notes

This repository is an agent-native monorepo foundation.

Follow `AGENTS.md` and `architecture.yaml`. Do not introduce an external monorepo orchestration framework as the control plane. Keep the distinction between these planes clear:

```text
Code plane: apps/, servers/, packages/, prebuilt/
Control plane: codebase/, enablers/
Agent plane: .agent/, .project/, AGENTS.md, CLAUDE.md, architecture.yaml
```

Use the repository CLI for discovery and validation instead of inventing ad hoc commands.
