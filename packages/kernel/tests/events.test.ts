import assert from "node:assert/strict";
import test from "node:test";
import {
  createVersionedEnvelopes,
  EVENT_CONTRACT_SCHEMAS,
  EVENT_CONTRACT_REGISTRY,
  WAVE_1_EVENT_TYPES
} from "../src/index.js";

void test("registers every Wave 1 event family at version 1", () => {
  const waveOneRegistry = Object.fromEntries(
    Object.entries(EVENT_CONTRACT_REGISTRY).filter(([eventType]) => eventType !== "TaskUpdated")
  );
  assert.deepEqual(Object.keys(waveOneRegistry), WAVE_1_EVENT_TYPES);
  for (const versions of Object.values(waveOneRegistry)) {
    assert.deepEqual(versions, [1]);
    assert.ok(Object.isFrozen(versions));
  }
  assert.deepEqual(EVENT_CONTRACT_REGISTRY.TaskUpdated, [1, 2]);
  const taskUpdatedSchemas = EVENT_CONTRACT_SCHEMAS.TaskUpdated;
  assert.ok(taskUpdatedSchemas);
  assert.deepEqual(Object.keys(taskUpdatedSchemas), ["1", "2"]);
  for (const versions of Object.values(EVENT_CONTRACT_SCHEMAS)) {
    for (const schema of Object.values(versions)) {
      assert.deepEqual(schema.required, ["id", "type", "version", "workspaceId", "actor", "occurredAt", "payload"]);
    }
  }
  assert.ok(Object.isFrozen(EVENT_CONTRACT_REGISTRY));
  assert.ok(Object.isFrozen(WAVE_1_EVENT_TYPES));
});

void test("publishes both overlap versions while the v1 consumer keeps receiving v1", () => {
  const events = createVersionedEnvelopes({
    id: "01J9TASKUPDATED",
    type: "TaskUpdated",
    workspaceId: "workspace-1",
    actor: { userId: "user-1" },
    occurredAt: "2026-10-03T08:00:00.000Z"
  }, [
    { version: 1, payload: { title: "Old title" } },
    { version: 2, payload: { title: "New title", priority: "high" } }
  ]);

  assert.ok(EVENT_CONTRACT_REGISTRY.TaskUpdated.includes(events[0].version));
  assert.ok(EVENT_CONTRACT_REGISTRY.TaskUpdated.includes(events[1].version));
  assert.deepEqual(events.map(({ version }) => version), [1, 2]);
  assert.equal(events[0].id, events[1].id);
  assert.equal(events[0].type, "TaskUpdated");

  const publishedEvents: Array<(typeof events)[number]> = [];
  const producerPublish = (event: (typeof events)[number]): void => {
    publishedEvents.push(event);
  };
  for (const event of events) {
    producerPublish(event);
  }
  assert.deepEqual(publishedEvents.map(({ version }) => version), [1, 2]);

  const version1ConsumerEvents = publishedEvents.filter((event) => event.version === 1);

  assert.equal(version1ConsumerEvents.length, 1);
  const version1ConsumerEvent = version1ConsumerEvents[0];
  assert.ok(version1ConsumerEvent);
  assert.deepEqual(version1ConsumerEvent.payload, { title: "Old title" });
  assert.ok(Object.isFrozen(events));
  assert.ok(Object.isFrozen(events[0]));
});

void test("keeps caller-specified version order for an overlap release", () => {
  const events = createVersionedEnvelopes({
    id: "event-ordered",
    type: "TaskUpdated",
    workspaceId: "workspace-1",
    actor: "system",
    occurredAt: "2026-10-03T08:00:00.000Z"
  }, [
    { version: 2, payload: { label: "new" } },
    { version: 1, payload: { label: "old" } }
  ]);

  assert.deepEqual(events.map(({ version }) => version), [2, 1]);
});

void test("rejects duplicate versions in an overlap at runtime", () => {
  assert.throws(() => createVersionedEnvelopes({
    id: "event-duplicate",
    type: "TaskUpdated",
    workspaceId: "workspace-1",
    actor: "system",
    occurredAt: "2026-10-03T08:00:00.000Z"
  }, [
    { version: 1, payload: { title: "old" } },
    { version: 1, payload: { title: "duplicate" } }
  ]), /TaskUpdated version 1 appears more than once/);
});
