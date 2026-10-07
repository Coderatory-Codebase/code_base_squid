import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateOrganizationPurge,
  isDeletionOverdue,
  type OrganizationLifecycle,
  type PurgeConfirmation
} from "../index.js";

const requestedAt = new Date("2026-11-02T02:00:00.000Z");
const deletionDate = new Date("2026-12-02T02:00:00.000Z");
const dueAt = deletionDate;
const lifecycle: OrganizationLifecycle = Object.freeze({
  organizationId: "org-001",
  state: "DELETION_SCHEDULED",
  deletionRequestedAt: requestedAt,
  deletionDate,
  workspaceIds: Object.freeze(["ws-studio", "ws-ops"]),
  requiredModules: Object.freeze(["workspace", "identity", "access"])
});

const confirmationsForAllModules = (confirmedAt: Date): readonly PurgeConfirmation[] => Object.freeze(
  lifecycle.workspaceIds.flatMap((workspaceId) => lifecycle.requiredModules.map((moduleId) => Object.freeze({
    workspaceId,
    moduleId,
    confirmedAt
  })))
);

void test("AC-1 starts on the due date and emits one WorkspaceDeleted event per workspace", () => {
  const result = evaluateOrganizationPurge({ lifecycle, now: dueAt });
  assert.ok(result.ok);
  assert.ok(result.value.kind === "in-progress");
  assert.equal(result.value.state, "DELETION_SCHEDULED");
  assert.equal(result.value.readOnly, true);
  assert.equal(result.value.listedForMembers, false);
  assert.deepEqual(result.value.retryConfirmations, result.value.missingConfirmations);
  assert.deepEqual(result.value.eventsToPublish.map(({ workspaceId }) => workspaceId), ["ws-studio", "ws-ops"]);
  assert.equal(result.value.missingConfirmations.length, 6);
  assert.equal(result.value.startWithin24Hours, true);
});

void test("AC-2 deletion trace contains only identifiers and confirmation time", () => {
  const result = evaluateOrganizationPurge({
    lifecycle,
    now: new Date(dueAt.getTime() + 5_000),
    startedAt: dueAt,
    publishedWorkspaceIds: lifecycle.workspaceIds,
    confirmations: [Object.freeze({ workspaceId: "ws-studio", moduleId: "identity", confirmedAt: dueAt })]
  });
  assert.ok(result.ok);
  assert.ok(result.value.kind === "in-progress");
  assert.deepEqual(Object.keys(result.value.trace[0] ?? {}).sort(), ["confirmedAt", "moduleId", "organizationId", "workspaceId"]);
  assert.equal(JSON.stringify(result.value.trace).includes("Studio"), false);
  assert.equal(JSON.stringify(result.value.trace).includes("Acme"), false);
});

void test("AC-3 does not complete until Identity, Access and every other module confirm each workspace", () => {
  const onlyWorkspaceModule = lifecycle.workspaceIds.map((workspaceId) => Object.freeze({
    workspaceId,
    moduleId: "workspace",
    confirmedAt: dueAt
  }));
  const pending = evaluateOrganizationPurge({
    lifecycle,
    now: dueAt,
    startedAt: dueAt,
    publishedWorkspaceIds: lifecycle.workspaceIds,
    confirmations: onlyWorkspaceModule
  });
  assert.ok(pending.ok);
  assert.ok(pending.value.kind === "in-progress");
  {
    assert.equal(pending.value.state, "DELETION_SCHEDULED");
    assert.deepEqual(pending.value.retryConfirmations.map(({ workspaceId, moduleId }) => `${workspaceId}:${moduleId}`), [
      "ws-studio:identity", "ws-studio:access", "ws-ops:identity", "ws-ops:access"
    ]);
  }

  const complete = evaluateOrganizationPurge({
    lifecycle,
    now: new Date(dueAt.getTime() + 60_000),
    startedAt: dueAt,
    publishedWorkspaceIds: lifecycle.workspaceIds,
    confirmations: confirmationsForAllModules(dueAt)
  });
  assert.ok(complete.ok);
  assert.ok(complete.value.kind === "complete");
});

void test("AC-4 reports the 24-hour start and completion budgets accurately", () => {
  const lateStart = evaluateOrganizationPurge({
    lifecycle,
    now: new Date("2026-12-03T00:00:00.000Z")
  });
  assert.ok(lateStart.ok);
  assert.ok(lateStart.value.kind === "in-progress");
  assert.equal(lateStart.value.startWithin24Hours, false);

  const withinWindow = evaluateOrganizationPurge({
    lifecycle,
    now: new Date(dueAt.getTime() + 23 * 60 * 60 * 1000),
    startedAt: dueAt,
    publishedWorkspaceIds: lifecycle.workspaceIds,
    confirmations: confirmationsForAllModules(dueAt)
  });
  assert.ok(withinWindow.ok);
  assert.ok(withinWindow.value.kind === "complete");
  assert.equal(withinWindow.value.completedWithin24Hours, true);

  const lateCompletion = evaluateOrganizationPurge({
    lifecycle,
    now: new Date(dueAt.getTime() + 24 * 60 * 60 * 1000 + 1),
    startedAt: dueAt,
    publishedWorkspaceIds: lifecycle.workspaceIds,
    confirmations: confirmationsForAllModules(dueAt)
  });
  assert.ok(lateCompletion.ok);
  assert.ok(lateCompletion.value.kind === "complete");
  assert.equal(lateCompletion.value.completedWithin24Hours, false);
});

void test("AC-5 replaying a run emits no duplicate events and a completed lifecycle remains complete", () => {
  const replay = evaluateOrganizationPurge({
    lifecycle,
    now: dueAt,
    startedAt: dueAt,
    publishedWorkspaceIds: lifecycle.workspaceIds
  });
  assert.ok(replay.ok);
  assert.ok(replay.value.kind === "in-progress");
  assert.equal(replay.value.eventsToPublish.length, 0);

  const deleted = evaluateOrganizationPurge({
    lifecycle: Object.freeze({ ...lifecycle, state: "DELETED" }),
    now: dueAt
  });
  assert.deepEqual(deleted, { ok: true, value: { kind: "already-deleted", state: "DELETED" } });
});

void test("scheduled deletion becomes unhealthy after the 31-day threshold", () => {
  const result = isDeletionOverdue({
    state: "DELETION_SCHEDULED",
    deletionRequestedAt: requestedAt,
    now: new Date(requestedAt.getTime() + 31 * 24 * 60 * 60 * 1000 + 1)
  });
  assert.deepEqual(result, { ok: true, value: true });
});

void test("lifecycle rule refuses an early date, missing modules and active organizations", () => {
  const tooEarly = evaluateOrganizationPurge({
    lifecycle: Object.freeze({ ...lifecycle, deletionDate: new Date(requestedAt.getTime() + 29 * 24 * 60 * 60 * 1000) }),
    now: dueAt
  });
  assert.deepEqual(tooEarly, { ok: false, error: { code: "InvalidLifecycle", reason: "deletion-before-request" } });

  const noModules = evaluateOrganizationPurge({
    lifecycle: Object.freeze({ ...lifecycle, requiredModules: Object.freeze([]) }),
    now: dueAt
  });
  assert.deepEqual(noModules, { ok: false, error: { code: "InvalidLifecycle", reason: "empty-modules" } });

  const active = evaluateOrganizationPurge({
    lifecycle: Object.freeze({ ...lifecycle, state: "ACTIVE" }),
    now: dueAt
  });
  assert.deepEqual(active, { ok: false, error: { code: "InvalidLifecycle", reason: "deletion-not-scheduled" } });

  const unknownPublication = evaluateOrganizationPurge({
    lifecycle,
    now: dueAt,
    publishedWorkspaceIds: ["unrelated-workspace"]
  });
  assert.deepEqual(unknownPublication, { ok: false, error: { code: "InvalidLifecycle", reason: "invalid-publication" } });
});
