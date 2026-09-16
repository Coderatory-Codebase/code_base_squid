import test from "node:test";
import assert from "node:assert/strict";
import { validateArchitectureConfiguration } from "./architecture.mjs";

test("validates architecture policy structure and workspace unit types", () => {
  const issues = validateArchitectureConfiguration({
    version: 0,
    foundation: { projectRoots: { "../outside": "service" }, requiredRoots: "apps" }
  });
  assert.ok(issues.some((issue) => issue.message.includes("positive integer version")));
  assert.ok(issues.some((issue) => issue.message.includes("Invalid workspace unit root")));
  assert.ok(issues.some((issue) => issue.message.includes("invalid type")));
  assert.ok(issues.some((issue) => issue.message.includes("requiredRoots must be an array")));
  assert.ok(issues.some((issue) => issue.message.includes("missing boundary")));
});
