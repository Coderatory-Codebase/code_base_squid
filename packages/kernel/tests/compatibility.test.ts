import assert from "node:assert/strict";
import test from "node:test";
import {
  findEventSchemaCompatibilityIssues,
  formatEventSchemaCompatibilityIssue,
  type EventSchemaSnapshot,
  type JsonSchema
} from "../src/index.js";

const taskUpdated = (payload: JsonSchema): JsonSchema => ({
  type: "object",
  required: ["id", "type", "version", "workspaceId", "actor", "occurredAt", "payload"],
  properties: {
    id: { type: "string" },
    type: { const: "TaskUpdated" },
    version: { const: 1 },
    workspaceId: { type: "string" },
    actor: {},
    occurredAt: { type: "string", format: "date-time" },
    payload
  },
  additionalProperties: false
});

const snapshot = (schema: JsonSchema, versions: Record<string, JsonSchema> = { "1": schema }): EventSchemaSnapshot => ({
  schemaVersion: 1,
  release: 1,
  events: { TaskUpdated: versions }
});

void test("accepts an unchanged published contract", () => {
  const baseline = snapshot(taskUpdated({ type: "object", properties: { title: { type: "string" } } }));

  assert.deepEqual(findEventSchemaCompatibilityIssues(baseline, baseline), []);
});

void test("rejects adding a field to an existing version and names that field", () => {
  const baseline = snapshot(taskUpdated({ type: "object", properties: { title: { type: "string" } } }));
  const current = snapshot(taskUpdated({
    type: "object",
    properties: { title: { type: "string" }, priority: { type: "string" } }
  }));
  const issues = findEventSchemaCompatibilityIssues(baseline, current);

  assert.ok(issues.some((issue) =>
    formatEventSchemaCompatibilityIssue(issue)
      === 'Event TaskUpdated version 1 field "payload.priority" was changed from its published schema.'
  ));
});

void test("reports a removed payload field with event, version, and field", () => {
  const baseline = snapshot(taskUpdated({ type: "object", properties: { title: { type: "string" } } }));
  const current = snapshot(taskUpdated({ type: "object", properties: {} }));
  const issues = findEventSchemaCompatibilityIssues(baseline, current);

  assert.ok(issues.some((issue) =>
    formatEventSchemaCompatibilityIssue(issue)
      === 'Event TaskUpdated version 1 field "payload.title" was removed from its published schema.'
  ));
});

void test("reports a changed payload field type with event, version, and field", () => {
  const baseline = snapshot(taskUpdated({ type: "object", properties: { title: { type: "string" } } }));
  const current = snapshot(taskUpdated({ type: "object", properties: { title: { type: "number" } } }));
  const issues = findEventSchemaCompatibilityIssues(baseline, current);

  assert.ok(issues.some((issue) =>
    formatEventSchemaCompatibilityIssue(issue)
      === 'Event TaskUpdated version 1 field "payload.title" was changed from its published schema.'
  ));
});

void test("allows a new event version beside the published version", () => {
  const version1 = taskUpdated({ type: "object", properties: { title: { type: "string" } } });
  const version2 = taskUpdated({
    type: "object",
    properties: { title: { type: "string" }, priority: { type: "string" } }
  });
  const version2WithNewVersion = {
    ...version2,
    properties: { ...version2.properties, version: { const: 2 } }
  };

  assert.deepEqual(findEventSchemaCompatibilityIssues(
    snapshot(version1),
    snapshot(version1, { "1": version1, "2": version2WithNewVersion })
  ), []);
});

void test("rejects removing a required field or an already-published version", () => {
  const baselineSchema = taskUpdated({ type: "object", properties: { title: { type: "string" } } });
  const remainingProperties = Object.fromEntries(
    Object.entries(baselineSchema.properties ?? {}).filter(([name]) => name !== "payload")
  );
  const changedSchema: JsonSchema = {
    ...baselineSchema,
    required: ["id", "type", "version", "workspaceId", "actor", "occurredAt"],
    properties: remainingProperties
  };
  const fieldIssues = findEventSchemaCompatibilityIssues(snapshot(baselineSchema), snapshot(changedSchema));
  const versionIssues = findEventSchemaCompatibilityIssues(snapshot(baselineSchema), snapshot(baselineSchema, {}));

  assert.ok(fieldIssues.some((issue) => issue.field === "payload" && issue.change === "changed"));
  assert.ok(versionIssues.some((issue) => issue.version === "1" && issue.field === "version"));
});

void test("rejects making a previously optional field required or removing an event", () => {
  const baselineSchema = taskUpdated({ type: "object", properties: { title: { type: "string" } } });
  const currentSchema: JsonSchema = {
    ...baselineSchema,
    properties: {
      ...baselineSchema.properties,
      payload: { type: "object", required: ["title"], properties: { title: { type: "string" } } }
    }
  };
  const requiredIssues = findEventSchemaCompatibilityIssues(snapshot(baselineSchema), snapshot(currentSchema));
  const eventIssues = findEventSchemaCompatibilityIssues(snapshot(baselineSchema), {
    schemaVersion: 1,
    release: 1,
    events: {}
  });

  assert.ok(requiredIssues.some((issue) => issue.field === "payload.title" && issue.change === "changed"));
  assert.ok(eventIssues.some((issue) => issue.event === "TaskUpdated" && issue.field === "event"));
});
