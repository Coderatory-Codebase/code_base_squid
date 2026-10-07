export type LifecycleState = "ACTIVE" | "DELETION_SCHEDULED" | "DELETED";

export type OrganizationLifecycle = Readonly<{
  organizationId: string;
  state: LifecycleState;
  deletionRequestedAt: Date;
  deletionDate: Date;
  workspaceIds: readonly string[];
  requiredModules: readonly string[];
}>;

export type PurgeConfirmation = Readonly<{
  workspaceId: string;
  moduleId: string;
  confirmedAt: Date;
}>;

export type WorkspaceDeletedEvent = Readonly<{
  type: "WorkspaceDeleted";
  eventId: string;
  organizationId: string;
  workspaceId: string;
  occurredAt: Date;
}>;

export type DeletionTraceEntry = Readonly<{
  organizationId: string;
  workspaceId: string;
  moduleId: string;
  confirmedAt: Date;
}>;

export type LifecycleError =
  | Readonly<{ code: "InvalidLifecycle"; reason: "invalid-date" | "deletion-before-request" | "deletion-not-scheduled" | "missing-identifier" | "empty-workspaces" | "empty-modules" | "duplicate-workspace" | "duplicate-module" | "invalid-publication" | "invalid-confirmation" }>;

export type LifecycleDecision =
  | Readonly<{ kind: "not-due"; state: "DELETION_SCHEDULED" }>
  | Readonly<{ kind: "already-deleted"; state: "DELETED" }>
  | Readonly<{
      kind: "in-progress";
      state: "DELETION_SCHEDULED";
      startedAt: Date;
      readOnly: true;
      listedForMembers: false;
      startWithin24Hours: boolean;
      eventsToPublish: readonly WorkspaceDeletedEvent[];
      missingConfirmations: readonly Readonly<{ workspaceId: string; moduleId: string }>[];
      retryConfirmations: readonly Readonly<{ workspaceId: string; moduleId: string }>[];
      trace: readonly DeletionTraceEntry[];
    }>
  | Readonly<{
      kind: "complete";
      state: "DELETED";
      startedAt: Date;
      completedAt: Date;
      startWithin24Hours: boolean;
      completedWithin24Hours: boolean;
      eventsToPublish: readonly WorkspaceDeletedEvent[];
      trace: readonly DeletionTraceEntry[];
    }>;

export type Result<Value, Failure> =
  | Readonly<{ ok: true; value: Value }>
  | Readonly<{ ok: false; error: Failure }>;

const DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * DAY_MS;
const isValidDate = (date: Date): boolean => Number.isFinite(date.getTime());
const unique = (values: readonly string[]): boolean => new Set(values).size === values.length;

const invalid = (reason: Extract<LifecycleError, { code: "InvalidLifecycle" }>['reason']): Result<never, LifecycleError> =>
  Object.freeze({ ok: false, error: Object.freeze({ code: "InvalidLifecycle", reason }) });

const validateLifecycle = (lifecycle: OrganizationLifecycle, now: Date): LifecycleError | undefined => {
  if (!isValidDate(now) || !isValidDate(lifecycle.deletionRequestedAt) || !isValidDate(lifecycle.deletionDate)) return { code: "InvalidLifecycle", reason: "invalid-date" };
  if (lifecycle.deletionDate.getTime() < lifecycle.deletionRequestedAt.getTime()) return { code: "InvalidLifecycle", reason: "deletion-before-request" };
  if (lifecycle.deletionDate.getTime() < lifecycle.deletionRequestedAt.getTime() + THIRTY_DAYS_MS) return { code: "InvalidLifecycle", reason: "deletion-before-request" };
  if (!lifecycle.organizationId.trim()) return { code: "InvalidLifecycle", reason: "missing-identifier" };
  if (lifecycle.workspaceIds.length === 0) return { code: "InvalidLifecycle", reason: "empty-workspaces" };
  if (lifecycle.requiredModules.length === 0) return { code: "InvalidLifecycle", reason: "empty-modules" };
  if (lifecycle.workspaceIds.some((id) => !id.trim())) return { code: "InvalidLifecycle", reason: "missing-identifier" };
  if (lifecycle.requiredModules.some((id) => !id.trim())) return { code: "InvalidLifecycle", reason: "missing-identifier" };
  if (!unique(lifecycle.workspaceIds)) return { code: "InvalidLifecycle", reason: "duplicate-workspace" };
  if (!unique(lifecycle.requiredModules)) return { code: "InvalidLifecycle", reason: "duplicate-module" };
  return undefined;
};

/** Decide a scheduled deletion run without performing persistence, delivery, or module calls. */
export const evaluateOrganizationPurge = (input: Readonly<{
  lifecycle: OrganizationLifecycle;
  now: Date;
  startedAt?: Date;
  publishedWorkspaceIds?: readonly string[];
  confirmations?: readonly PurgeConfirmation[];
}>): Result<LifecycleDecision, LifecycleError> => {
  const { lifecycle, now } = input;
  const validationError = validateLifecycle(lifecycle, now);
  if (validationError) return invalid(validationError.reason);
  if (lifecycle.state === "DELETED") return Object.freeze({ ok: true, value: Object.freeze({ kind: "already-deleted", state: "DELETED" }) });
  if (lifecycle.state === "ACTIVE") return invalid("deletion-not-scheduled");
  if (now.getTime() < lifecycle.deletionDate.getTime()) {
    return Object.freeze({ ok: true, value: Object.freeze({ kind: "not-due", state: "DELETION_SCHEDULED" }) });
  }

  const startedAt = input.startedAt ?? now;
  if (!isValidDate(startedAt) || startedAt.getTime() < lifecycle.deletionDate.getTime()) return invalid("invalid-date");
  const publishedWorkspaceIds = input.publishedWorkspaceIds ?? [];
  if (!unique(publishedWorkspaceIds) || publishedWorkspaceIds.some((id) => !lifecycle.workspaceIds.includes(id))) return invalid("invalid-publication");
  const published = new Set(publishedWorkspaceIds);
  const eventsToPublish = lifecycle.workspaceIds
    .filter((workspaceId) => !published.has(workspaceId))
    .map((workspaceId) => Object.freeze({
      type: "WorkspaceDeleted" as const,
      eventId: JSON.stringify([lifecycle.organizationId, workspaceId, lifecycle.deletionDate.toISOString()]),
      organizationId: lifecycle.organizationId,
      workspaceId,
      occurredAt: now
    }));

  const confirmations = input.confirmations ?? [];
  if (confirmations.some((item) =>
    !lifecycle.workspaceIds.includes(item.workspaceId)
    || !lifecycle.requiredModules.includes(item.moduleId)
    || !isValidDate(item.confirmedAt)
    || item.confirmedAt.getTime() > now.getTime()
  )) return invalid("invalid-confirmation");
  if (new Set(confirmations.map(({ workspaceId, moduleId }) => `${workspaceId}\u0000${moduleId}`)).size !== confirmations.length) return invalid("invalid-confirmation");

  const confirmed = new Set(confirmations.map(({ workspaceId, moduleId }) => `${workspaceId}\u0000${moduleId}`));
  const missingConfirmations = lifecycle.workspaceIds.flatMap((workspaceId) =>
    lifecycle.requiredModules
      .filter((moduleId) => !confirmed.has(`${workspaceId}\u0000${moduleId}`))
      .map((moduleId) => Object.freeze({ workspaceId, moduleId }))
  );
  const trace = confirmations.map(({ workspaceId, moduleId, confirmedAt }) => Object.freeze({
    organizationId: lifecycle.organizationId,
    workspaceId,
    moduleId,
    confirmedAt
  }));
  const startDeadline = Date.UTC(
    lifecycle.deletionDate.getUTCFullYear(),
    lifecycle.deletionDate.getUTCMonth(),
    lifecycle.deletionDate.getUTCDate() + 1
  );
  const startWithin24Hours = startedAt.getTime() < startDeadline;

  if (missingConfirmations.length > 0) {
    return Object.freeze({ ok: true, value: Object.freeze({
      kind: "in-progress",
      state: "DELETION_SCHEDULED",
      startedAt,
      readOnly: true,
      listedForMembers: false,
      startWithin24Hours,
      eventsToPublish: Object.freeze(eventsToPublish),
      missingConfirmations: Object.freeze(missingConfirmations),
      retryConfirmations: Object.freeze(missingConfirmations),
      trace: Object.freeze(trace)
    }) });
  }

  return Object.freeze({ ok: true, value: Object.freeze({
    kind: "complete",
    state: "DELETED",
    startedAt,
    completedAt: now,
    startWithin24Hours,
    completedWithin24Hours: now.getTime() <= startedAt.getTime() + DAY_MS,
    eventsToPublish: Object.freeze(eventsToPublish),
    trace: Object.freeze(trace)
  }) });
};

export const isDeletionOverdue = (input: Readonly<{
  state: LifecycleState;
  deletionRequestedAt: Date;
  now: Date;
}>): Result<boolean, LifecycleError> => {
  if (!isValidDate(input.deletionRequestedAt) || !isValidDate(input.now)) return invalid("invalid-date");
  return Object.freeze({ ok: true, value: input.state === "DELETION_SCHEDULED"
    && input.now.getTime() > input.deletionRequestedAt.getTime() + 31 * DAY_MS });
};
