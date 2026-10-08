import assert from "node:assert/strict";
import test from "node:test";
import {
  observeOrganizationBrandingRead,
  ORGANIZATION_BRANDING_READ_BUDGET_MS,
  ORGANIZATION_BRANDING_READ_SIGNAL_NAME
} from "../telemetry.js";

void test("emits a successful bounded read signal with result count and budget status", async () => {
  const signals: unknown[] = [];
  const timestamps = [100, 780];
  const result = await observeOrganizationBrandingRead(
    () => Promise.resolve(["org-1", "org-2"]),
    { emit: (signal) => { signals.push(signal); }, now: () => timestamps.shift() ?? 780 }
  );

  assert.deepEqual(result, ["org-1", "org-2"]);
  assert.deepEqual(signals, [{
    event: ORGANIZATION_BRANDING_READ_SIGNAL_NAME,
    outcome: "success",
    durationMs: 680,
    resultCount: 2,
    budgetMs: ORGANIZATION_BRANDING_READ_BUDGET_MS,
    withinBudget: true
  }]);
});

void test("emits an over-budget error signal without exposing workspace or organization identifiers", async () => {
  const signals: unknown[] = [];
  const timestamps = [0, 701];
  await assert.rejects(observeOrganizationBrandingRead(
    () => Promise.reject(new Error("reader failed")),
    { emit: (signal) => { signals.push(signal); }, now: () => timestamps.shift() ?? 701 }
  ), /reader failed/);

  assert.deepEqual(signals, [{
    event: ORGANIZATION_BRANDING_READ_SIGNAL_NAME,
    outcome: "error",
    durationMs: 701,
    resultCount: 0,
    budgetMs: ORGANIZATION_BRANDING_READ_BUDGET_MS,
    withinBudget: false
  }]);
  assert.equal(JSON.stringify(signals).includes("workspaceId"), false);
  assert.equal(JSON.stringify(signals).includes("organizationId"), false);
});
