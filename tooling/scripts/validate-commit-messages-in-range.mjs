#!/usr/bin/env node
// CI-side commit-message check — validates every commit introduced by a
// push/PR, using the exact same rules as the local commit-msg hook
// (tooling/scripts/commit-message-rules.mjs), so a bypassed local hook
// (`git commit --no-verify`) still gets caught before merge. See
// .agent/instructions/git-governance.md -> "Local and CI parity".
//
// Usage: node tooling/scripts/validate-commit-messages-in-range.mjs <base> <head>
// In GitHub Actions: <base> = ${{ github.event.pull_request.base.sha }},
// <head> = ${{ github.event.pull_request.head.sha }}. Falls back to
// checking only HEAD's message when no range is given (e.g. a direct
// push), since there is then no meaningful "range" to diff.
import { execFileSync } from "node:child_process";
import { validateCommitMessage } from "./commit-message-rules.mjs";

const [base, head] = process.argv.slice(2);

function commitMessages() {
  if (base && head) {
    const out = execFileSync("git", ["log", "--format=%H%x00%B%x03", `${base}..${head}`], {
      encoding: "utf8",
    });
    return out
      .split("\x03")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [sha, ...rest] = entry.split("\x00");
        return { sha, message: rest.join("\x00") };
      });
  }
  const message = execFileSync("git", ["log", "-1", "--format=%B"], {
    encoding: "utf8",
  });
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  return [{ sha, message }];
}

const commits = commitMessages();
let failed = false;

for (const { sha, message } of commits) {
  const result = validateCommitMessage(message);
  if (!result.ok) {
    failed = true;
    console.error(`\n${sha.slice(0, 7)}: rejected\n\n${result.reason}\n`);
  }
}

if (failed) process.exit(1);
console.log(`validate:commit-messages — ${commits.length} commit(s) checked, all valid.`);
