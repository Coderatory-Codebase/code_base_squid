export type Result<Value, Error> =
  | Readonly<{ ok: true; value: Value }>
  | Readonly<{ ok: false; error: Error }>;

export type OrganizationOwnershipError = Readonly<{ kind: "invalid-input" }>;

export type OrganizationOwnershipInput = Readonly<{
  organization: Readonly<{
    id: string;
    ownerId: string;
    state: "ACTIVE" | "ARCHIVED";
  }>;
  deletedOwnerId: string;
  ownerRoleHolders: readonly Readonly<{
    userId: string;
    workspaceId: string;
    role: "WORKSPACE_OWNER" | "MEMBER";
    status: "ACTIVE" | "INACTIVE";
    assignedAt: Date;
  }>[];
}>;

export type OrganizationOwnershipEvent =
  | Readonly<{
      kind: "OrganizationOwnershipTransferred";
      organizationId: string;
      previousOwnerId: string;
      newOwnerId: string;
    }>
  | Readonly<{
      kind: "OrganizationArchived";
      organizationId: string;
      previousOwnerId: string;
    }>;

export type OrganizationOwnership =
  | Readonly<{
      kind: "TRANSFERRED";
      organizationId: string;
      previousOwnerId: string;
      newOwnerId: string;
      event: Extract<OrganizationOwnershipEvent, { kind: "OrganizationOwnershipTransferred" }>;
    }>
  | Readonly<{
      kind: "ARCHIVED";
      organizationId: string;
      previousOwnerId: string;
      event: Extract<OrganizationOwnershipEvent, { kind: "OrganizationArchived" }>;
    }>
  | Readonly<{
      kind: "UNCHANGED";
      organizationId: string;
      reason: "owner-already-changed" | "organization-already-archived";
      event: null;
    }>;

const ok = <Value>(value: Value): Result<Value, never> => ({ ok: true, value });
const err = <Error>(error: Error): Result<never, Error> => ({ ok: false, error });

const hasText = (value: string): boolean => value.trim().length > 0;

const isValidRoleHolder = (
  holder: OrganizationOwnershipInput["ownerRoleHolders"][number]
): boolean =>
  hasText(holder.userId) &&
  hasText(holder.workspaceId) &&
  holder.assignedAt instanceof Date &&
  Number.isFinite(holder.assignedAt.getTime());

const compareRoleHolders = (
  left: OrganizationOwnershipInput["ownerRoleHolders"][number],
  right: OrganizationOwnershipInput["ownerRoleHolders"][number]
): number => {
  const byAssignedAt = left.assignedAt.getTime() - right.assignedAt.getTime();
  if (byAssignedAt !== 0) return byAssignedAt;
  if (left.userId !== right.userId) return left.userId < right.userId ? -1 : 1;
  if (left.workspaceId !== right.workspaceId) return left.workspaceId < right.workspaceId ? -1 : 1;
  return 0;
};

export const resolveOrganizationOwnership = ({
  organization,
  deletedOwnerId,
  ownerRoleHolders
}: OrganizationOwnershipInput): Result<OrganizationOwnership, OrganizationOwnershipError> => {
  if (
    !hasText(organization.id) ||
    !hasText(organization.ownerId) ||
    !hasText(deletedOwnerId)
  ) {
    return err({ kind: "invalid-input" });
  }

  if (organization.state === "ARCHIVED") {
    return ok({
      kind: "UNCHANGED",
      organizationId: organization.id,
      reason: "organization-already-archived",
      event: null
    });
  }

  if (organization.ownerId !== deletedOwnerId) {
    return ok({
      kind: "UNCHANGED",
      organizationId: organization.id,
      reason: "owner-already-changed",
      event: null
    });
  }

  if (!ownerRoleHolders.every(isValidRoleHolder)) {
    return err({ kind: "invalid-input" });
  }

  const nextOwner = ownerRoleHolders
    .filter(holder =>
      holder.userId !== deletedOwnerId &&
      holder.role === "WORKSPACE_OWNER" &&
      holder.status === "ACTIVE"
    )
    .sort(compareRoleHolders)[0];

  if (!nextOwner) {
    const event: Extract<OrganizationOwnershipEvent, { kind: "OrganizationArchived" }> = {
      kind: "OrganizationArchived",
      organizationId: organization.id,
      previousOwnerId: deletedOwnerId
    };
    return ok({
      kind: "ARCHIVED",
      organizationId: organization.id,
      previousOwnerId: deletedOwnerId,
      event
    });
  }

  const event: Extract<OrganizationOwnershipEvent, { kind: "OrganizationOwnershipTransferred" }> = {
    kind: "OrganizationOwnershipTransferred",
    organizationId: organization.id,
    previousOwnerId: deletedOwnerId,
    newOwnerId: nextOwner.userId
  };

  return ok({
    kind: "TRANSFERRED",
    organizationId: organization.id,
    previousOwnerId: deletedOwnerId,
    newOwnerId: nextOwner.userId,
    event
  });
};
