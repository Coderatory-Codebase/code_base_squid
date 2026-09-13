import path from "node:path";
import { readFile } from "node:fs/promises";
import { walkFiles } from "../utilities/fs.mjs";

const secretPatterns = [
  { name: "generic secret assignment", pattern: /\b(secret|token|api[_-]?key|password)\b\s*[:=]\s*["'][^"']{12,}["']/i },
  { name: "private key marker", pattern: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/ }
];

export const scanForCommittedSecrets = async (workspaceRoot, ignoredDirectories) => {
  const files = await walkFiles(workspaceRoot, { ignoredDirectories });
  const findings = [];

  for (const filePath of files) {
    const text = await readFile(filePath, "utf8").catch(() => "");

    for (const { name, pattern } of secretPatterns) {
      if (pattern.test(text)) {
        findings.push({
          level: "warning",
          message: `Potential ${name} in ${path.relative(workspaceRoot, filePath)}`
        });
      }
    }
  }

  return findings;
};

export const runWorkspaceScans = async (workspace) => scanForCommittedSecrets(
  workspace.root,
  new Set(workspace.architecture.foundation.ignoredDirectories ?? [])
);
