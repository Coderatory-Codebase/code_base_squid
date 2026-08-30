// Shared commit-message convention, imported by the commit-msg hook
// (tooling/git-hooks/commit-msg) and the CI range check
// (tooling/scripts/validate-commit-messages-in-range.mjs). One rule set,
// two call sites — see .agent/instructions/git-governance.md ->
// "Avoid duplicated shell logic".

const TYPES = ["feat", "fix", "refactor", "docs", "test", "chore", "build", "ci", "perf"];

const SUBJECT_PATTERN = new RegExp(`^(${TYPES.join("|")})(\\([a-z0-9./-]+\\))?!?: .{1,72}$`);

// Git-generated messages this repository doesn't ask a human/agent to
// reshape — merges and reverts already carry their own meaningful form.
const EXEMPT_PATTERNS = [/^Merge /, /^Revert /];

/**
 * @param {string} rawMessage full commit message text
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function validateCommitMessage(rawMessage) {
  const lines = rawMessage.split("\n").filter((line) => !line.startsWith("#")); // strip Git's comment lines

  const subject = (lines[0] ?? "").trim();

  if (subject.length === 0) {
    return { ok: false, reason: "Commit message is empty." };
  }

  if (EXEMPT_PATTERNS.some((pattern) => pattern.test(subject))) {
    return { ok: true };
  }

  if (SUBJECT_PATTERN.test(subject)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: [
      `Commit subject does not match the required convention:`,
      "",
      `  type(scope): description`,
      "",
      `  type  one of: ${TYPES.join(", ")}`,
      `  scope optional, lowercase, e.g. (agent), (packages), (ci)`,
      `  description <= 72 chars, present tense`,
      "",
      `Got: "${subject}"`,
      "",
      `Example: feat(agent): add engineering standards instruction`,
      "See .project/specs/SPEC-009-repository-structure-git-governance-and-quality-enforcement.md",
      `-> "Commit message convention" for the full rationale.`,
    ].join("\n"),
  };
}

export { TYPES };
