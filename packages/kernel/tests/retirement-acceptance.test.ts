import assert from "node:assert/strict";
import test from "node:test";
import {
  findEventSchemaCompatibilityIssues,
  formatEventSchemaCompatibilityIssue,
  type EventSchemaSnapshot,
  type EventVersionLifecycleRegistry,
  type JsonSchema
} from "../src/index.js";

const memberAdded = (version: 1 | 2): JsonSchema => ({
  type: "object",
  required: ["id", "type", "version", "workspaceId", "actor", "occurredAt", "payload"],
  properties: {
    id: { type: "string" },
    type: { const: "MemberAdded" },
    version: { const: version },
    workspaceId: { type: "string" },
    actor: {},
    occurredAt: { type: "string", format: "date-time" },
    payload: { type: "object", properties: { memberId: { type: "string" } } }
  },
  additionalProperties: false
});

const snapshot = (versions: Record<string, JsonSchema>): EventSchemaSnapshot => ({
  schemaVersion: 1,
  release: 1,
  events: { MemberAdded: versions }
});

const baseline = snapshot({ "1": memberAdded(1), "2": memberAdded(2) });
const currentWithV2Only = snapshot({ "2": memberAdded(2) });

const lifecycle = (consumers: readonly string[] = []): EventVersionLifecycleRegistry => ({
  MemberAdded: {
    "1": { supersededInRelease: "R1.2", consumers }
  }
});

void test("AC-1: refuses removing v1 in the same release v2 is introduced", () => {
  const issues = findEventSchemaCompatibilityIssues(baseline, currentWithV2Only, {
    currentRelease: "R1.2",
    lifecycleRegistry: lifecycle()
  });
  const diagnostic = issues.map(formatEventSchemaCompatibilityIssue).join("\n");

  assert.equal(issues.length, 1);
  assert.match(diagnostic, /MemberAdded version 1/);
  assert.match(diagnostic, /version 2/);
  assert.match(diagnostic, /first allowed in R1\.3/);
});

void test("AC-2: allows removal in R1.3 when no consumer remains and keeps only v2", () => {
  const issues = findEventSchemaCompatibilityIssues(baseline, currentWithV2Only, {
    currentRelease: "R1.3",
    lifecycleRegistry: lifecycle()
  });

  assert.deepEqual(issues, []);
  assert.deepEqual(Object.keys(currentWithV2Only.events.MemberAdded ?? {}), ["2"]);
});

void test("AC-3: refuses removal after overlap while Access still consumes v1", () => {
  const issues = findEventSchemaCompatibilityIssues(baseline, currentWithV2Only, {
    currentRelease: "R1.3",
    lifecycleRegistry: lifecycle(["Access"])
  });
  const diagnostic = issues.map(formatEventSchemaCompatibilityIssue).join("\n");

  assert.equal(issues.length, 1);
  assert.match(diagnostic, /MemberAdded version 1/);
  assert.match(diagnostic, /Access/);
});
