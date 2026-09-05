#!/usr/bin/env node
// Baseline secret-detection scan. Deliberately a small, heuristic
// regex scanner, not a comprehensive security product — see
// .project/specs/SPEC-009-repository-structure-git-governance-and-quality-enforcement.md
// -> "Secret detection" for what this does and does not catch, and when
// to graduate to a dedicated tool (e.g. gitleaks/trufflehog) instead.
//
// Usage:
//   node tooling/scripts/secret-scan.mjs               scan all git-tracked files
//   node tooling/scripts/secret-scan.mjs --staged       scan only staged files (pre-commit)
//   node tooling/scripts/secret-scan.mjs --files a b c  scan an explicit file list (CI diff, tests)
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const gitSafeDirectory = repoRoot.replace(/\\/g, "/");
const git = (args) =>
  execFileSync("git", ["-c", `safe.directory=${gitSafeDirectory}`, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });

// Each pattern is a known, distinctive secret *shape* — not a generic
// "contains the word password" match, to keep the false-positive rate
// low enough that this stays useful rather than ignored.
const PATTERNS = [
  { name: "AWS access key ID", pattern: /AKIA[0-9A-Z]{16}/ },
  {
    name: "Generic private key block",
    pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/,
  },
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: "Slack token", pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: "Stripe live secret key", pattern: /sk_live_[A-Za-z0-9]{16,}/ },
  {
    name: "Generic assigned secret",
    // key/secret/token/password = "<20+ char opaque-looking value>"
    pattern: /(?:secret|token|password|api[_-]?key)\s*[:=]\s*["'`][A-Za-z0-9/+_.=-]{20,}["'`]/i,
  },
];

const ALWAYS_IGNORED = new Set([
  "pnpm-lock.yaml", // dependency hashes, not secrets
]);

function gitTrackedFiles() {
  return git(["ls-files"]).split("\n").filter(Boolean);
}

function gitStagedFiles() {
  return git(["diff", "--cached", "--name-only", "--diff-filter=ACM"]).split("\n").filter(Boolean);
}

function resolveTargetFiles(argv) {
  if (argv.includes("--staged")) return gitStagedFiles();
  const filesFlagIndex = argv.indexOf("--files");
  if (filesFlagIndex !== -1) return argv.slice(filesFlagIndex + 1);
  return gitTrackedFiles();
}

function scanFile(path) {
  if (ALWAYS_IGNORED.has(path) || !existsSync(path)) return [];
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return []; // binary or unreadable — not this scanner's concern
  }

  const findings = [];
  for (const { name, pattern } of PATTERNS) {
    if (pattern.test(content)) findings.push(name);
  }
  return findings;
}

function main() {
  const targets = resolveTargetFiles(process.argv.slice(2));
  const hits = [];

  for (const file of targets) {
    const findings = scanFile(file);
    if (findings.length > 0) hits.push({ file, findings });
  }

  if (hits.length === 0) {
    console.log(`secrets:scan — ${targets.length} file(s) checked, no matches.`);
    process.exit(0);
  }

  console.error("\nsecrets:scan — possible secret(s) found:\n");
  for (const { file, findings } of hits) {
    console.error(`  ${file}: ${findings.join(", ")}`);
  }
  console.error(
    "\nIf this is a real secret: remove it, rotate it, and use an .env " +
      "file (gitignored) or a secret manager instead.\n" +
      "If this is a false positive: this is a small heuristic baseline, " +
      'not a comprehensive scanner — see SPEC-009 -> "Secret detection".\n',
  );
  process.exit(1);
}

main();
