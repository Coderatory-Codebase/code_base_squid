import { runToolCommand } from "../tools/command-runner.mjs";

const parseFindings = (stdout) => {
  if (!stdout.trim()) return [];
  const report = JSON.parse(stdout);
  if (!Array.isArray(report)) throw new Error("Gitleaks report must be a JSON array.");
  return report;
};

const toolFailure = (message, durationMs = 0, exitCode = 1) => ({
  result: { name: "secret-scan", engine: "gitleaks", status: "failed", exitCode, durationMs, findingCount: 0 },
  issues: [{ level: "error", rule: "security-tool-failure", tool: "gitleaks", message }]
});

export const runSecretScan = async ({ workspaceRoot, commandRunner = runToolCommand }) => {
  let execution;
  try {
    execution = await commandRunner({
      command: "gitleaks",
      args: [
        "dir",
        ".",
        "--config",
        ".gitleaks.toml",
        "--redact",
        "--no-banner",
        "--report-format",
        "json",
        "--report-path",
        "-",
        "--exit-code",
        "1"
      ],
      cwd: workspaceRoot
    });
  } catch (error) {
    return toolFailure(`Required security tool gitleaks could not start: ${error instanceof Error ? error.message : String(error)}`);
  }

  let findings;
  try {
    findings = parseFindings(execution.stdout);
  } catch (error) {
    return toolFailure(
      `Gitleaks failed without a valid report: ${error instanceof Error ? error.message : String(error)}`,
      execution.durationMs,
      execution.exitCode
    );
  }

  const issues = findings.map((finding) => ({
    level: "error",
    rule: "secret-detected",
    tool: "gitleaks",
    detector: finding.RuleID ?? "unknown",
    file: finding.File ?? "unknown",
    line: finding.StartLine ?? null,
    message: `Gitleaks detected ${finding.Description ?? finding.RuleID ?? "a potential secret"} in ${finding.File ?? "an unknown file"}${finding.StartLine ? `:${finding.StartLine}` : ""}.`
  }));

  if (execution.exitCode !== 0 && issues.length === 0) {
    return toolFailure("Gitleaks exited non-zero without a finding; scanner execution failed.", execution.durationMs, execution.exitCode);
  }

  return {
    result: {
      name: "secret-scan",
      engine: "gitleaks",
      status: issues.length === 0 ? "passed" : "failed",
      exitCode: execution.exitCode,
      durationMs: execution.durationMs,
      findingCount: issues.length
    },
    issues
  };
};
