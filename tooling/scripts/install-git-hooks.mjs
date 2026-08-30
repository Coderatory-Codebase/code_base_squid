#!/usr/bin/env node
// Points Git at tooling/git-hooks/ via `core.hooksPath` — no third-party
// hook manager (husky, lefthook, ...) — see
// .project/decisions/ADR-009-git-hook-enforcement-mechanism.md for why.
// Runs automatically on `pnpm install` (package.json -> "prepare"); can
// also be run directly (`pnpm run hooks:install`) to (re)verify.
//
// Must not fail `pnpm install` in an environment this repository is
// merely being read in (no .git — e.g. a downloaded archive, or a
// package registry install step) — skips quietly instead.
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const hooksDir = path.join(repoRoot, "tooling", "git-hooks");

if (!existsSync(path.join(repoRoot, ".git"))) {
  console.log("install-git-hooks: no .git directory found — skipping.");
  process.exit(0);
}

for (const hook of ["commit-msg", "pre-commit", "pre-push"]) {
  const hookPath = path.join(hooksDir, hook);
  if (existsSync(hookPath)) {
    try {
      chmodSync(hookPath, 0o755); // no-op on Windows filesystems; required on POSIX
    } catch {
      // Non-fatal — core.hooksPath below is what actually matters.
    }
  }
}

execFileSync("git", ["config", "core.hooksPath", "tooling/git-hooks"], {
  cwd: repoRoot,
});

console.log(
  "install-git-hooks: core.hooksPath -> tooling/git-hooks (commit-msg, pre-commit, pre-push active).",
);
