import test from "node:test";
import assert from "node:assert/strict";
import { runSecretScan } from "./secret-scan.mjs";

test("normalizes a clean Gitleaks report", async () => {
  const scan = await runSecretScan({
    workspaceRoot: process.cwd(),
    commandRunner: async ({ command, args }) => {
      assert.equal(command, "gitleaks");
      assert.deepEqual(args.slice(0, 2), ["dir", "."]);
      return { exitCode: 0, stdout: "", stderr: "no leaks found", durationMs: 6 };
    }
  });

  assert.equal(scan.result.status, "passed");
  assert.equal(scan.result.findingCount, 0);
  assert.deepEqual(scan.issues, []);
});

test("normalizes redacted Gitleaks findings without exposing secret values", async () => {
  const scan = await runSecretScan({
    workspaceRoot: process.cwd(),
    commandRunner: async () => ({
      exitCode: 1,
      stdout: JSON.stringify([{
        Description: "Fixture credential",
        RuleID: "fixture-rule",
        File: "fixture.txt",
        StartLine: 2,
        Secret: "REDACTED"
      }]),
      stderr: "",
      durationMs: 7
    })
  });

  assert.equal(scan.result.status, "failed");
  assert.equal(scan.issues[0].rule, "secret-detected");
  assert.equal(scan.issues[0].file, "fixture.txt");
  assert.equal(JSON.stringify(scan).includes("REDACTED"), false);
});

test("fails closed when Gitleaks is unavailable", async () => {
  const scan = await runSecretScan({
    workspaceRoot: process.cwd(),
    commandRunner: async () => { throw new Error("ENOENT"); }
  });

  assert.equal(scan.result.status, "failed");
  assert.equal(scan.issues[0].rule, "security-tool-failure");
  assert.match(scan.issues[0].message, /could not start/);
});
