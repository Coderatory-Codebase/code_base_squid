# Agent Operating Guide

Agents working in this repository must treat the monorepo foundation as the product being implemented.

Before changing code:

1. Read this file and `architecture.yaml`.
2. Inspect the relevant project through the repository control plane.
3. Keep dependencies explicit and boundaries clear.
4. Prefer functional modules, pure functions, immutable data, and explicit dependency passing.
5. Run the smallest useful validation command after changes.

Classify the scope before editing: application, reusable package, infrastructure/enabler,
project knowledge, foundation, or control plane. Application work does not authorize
foundation or control-plane changes.

Implementation follows `UNDERSTAND -> PLAN -> IMPLEMENT -> VALIDATE -> REVIEW -> RECORD -> COMPLETE`.
Create feature-owned code first, add layers only when a concrete boundary requires them,
and extract packages only after ownership and genuine cross-boundary reuse are established.

The control plane lives in `codebase/`. It must not use Turborepo, Nx, Lerna, or another third-party monorepo orchestrator as its foundation.
`architecture.yaml` uses the JSON-compatible subset of YAML so Node.js can load the
authoritative policy without adding a parser dependency to the control plane.

Project code under `apps/`, `servers/`, `packages/`, and `prebuilt/` may use appropriate external libraries. The control plane should stay dependency-light and prefer Node.js built-ins plus repository-owned code.

Useful commands:

```text
npm run projects
npm run graph
npm run tasks
npm run check
npm run scan
npm test
```

Project tasks run through `node codebase/cli/repo.mjs run <task>`. Use `--dry-run` to
inspect ordering and `--json` when another tool needs stable output.
