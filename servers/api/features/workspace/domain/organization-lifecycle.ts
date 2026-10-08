export type OrganizationLifecycleStatus = "active" | "archived" | "deleted";
export type OrganizationLifecycleAction = "archive" | "restore" | "delete";
export type OrganizationLifecycle = Readonly<{
  status: OrganizationLifecycleStatus;
  version: number;
  archivedAt: Date | null;
  archivedBy: string | null;
  deletedAt: Date | null;
}>;
export type OrganizationLifecycleFailure =
  | Readonly<{ code: "invalid"; message: string }>
  | Readonly<{ code: "conflict"; message: string; current: OrganizationLifecycle }>;
export type OrganizationLifecycleResult =
  | Readonly<{ ok: true; value: OrganizationLifecycle }>
  | Readonly<{ ok: false; error: OrganizationLifecycleFailure }>;

export const resolveOrganizationLifecycle = ({
  version = 0,
  archivedAt = null,
  archivedBy = null,
  deletedAt = null
}: Readonly<{
  version?: number;
  archivedAt?: Date | null;
  archivedBy?: string | null;
  deletedAt?: Date | null;
}>): OrganizationLifecycle => ({
  status: deletedAt ? "deleted" : archivedAt ? "archived" : "active",
  version,
  archivedAt,
  archivedBy,
  deletedAt
});

export const transitionOrganizationLifecycle = (
  current: OrganizationLifecycle,
  action: OrganizationLifecycleAction,
  expectedVersion: number,
  actorId: string,
  now: Date
): OrganizationLifecycleResult => {
  if (current.version !== expectedVersion) {
    return {
      ok: false,
      error: { code: "conflict", message: "The organization changed. Review its current state before trying again.", current }
    };
  }
  if (current.status === "deleted") {
    return { ok: false, error: { code: "invalid", message: "This organization has been deleted." } };
  }
  if (action === "archive" && current.status === "archived") {
    return { ok: false, error: { code: "invalid", message: "The organization is already archived." } };
  }
  if (action === "restore" && current.status !== "archived") {
    return { ok: false, error: { code: "invalid", message: "Only an archived organization can be restored." } };
  }
  if (action === "delete" && current.status !== "archived") {
    return { ok: false, error: { code: "invalid", message: "Archive the organization before deleting it." } };
  }

  const version = current.version + 1;
  if (action === "archive") {
    return { ok: true, value: { status: "archived", version, archivedAt: now, archivedBy: actorId, deletedAt: null } };
  }
  if (action === "restore") {
    return { ok: true, value: { status: "active", version, archivedAt: null, archivedBy: null, deletedAt: null } };
  }
  return { ok: true, value: { status: "deleted", version, archivedAt: current.archivedAt, archivedBy: current.archivedBy, deletedAt: now } };
};
