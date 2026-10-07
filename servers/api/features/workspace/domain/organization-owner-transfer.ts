export type OrganizationOwnerTransferMembership = Readonly<{
  organizationId: string;
  workspaceId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "SUSPENDED" | "REMOVED";
}>;

export type OrganizationOwnerTransferInput = Readonly<{
  organization: Readonly<{ id: string; ownerId: string }>;
  ownerIdWhenTransferWasOpened: string;
  recipient: Readonly<{ userId: string; isGuest: boolean }>;
  recipientMemberships: readonly OrganizationOwnerTransferMembership[];
}>;

export type OrganizationOwnerTransferPlan = Readonly<{
  kind: "TRANSFER";
  organizationId: string;
  previousOwnerId: string;
  nextOwnerId: string;
  expectedOwnerId: string;
}>;

export type OrganizationOwnerTransferError =
  | Readonly<{ kind: "conflict"; currentOwnerId: string }>
  | Readonly<{
      kind: "invalid";
      reason:
        | "invalid-input"
        | "recipient-is-current-owner"
        | "recipient-is-guest"
        | "recipient-is-not-workspace-admin"
        | "recipient-membership-is-suspended"
        | "recipient-membership-is-removed"
        | "recipient-has-no-organization-membership";
    }>;

export type OrganizationOwnerTransferResult =
  | Readonly<{ ok: true; value: OrganizationOwnerTransferPlan }>
  | Readonly<{ ok: false; error: OrganizationOwnerTransferError }>;

const ok = (value: OrganizationOwnerTransferPlan): OrganizationOwnerTransferResult => ({ ok: true, value });
const err = (error: OrganizationOwnerTransferError): OrganizationOwnerTransferResult => ({ ok: false, error });
const hasText = (value: string): boolean => value.trim().length > 0;

/**
 * Produces a mutation plan for an organization transfer after checking the current
 * owner snapshot and recipient eligibility. Persistence, policy decisions, and the
 * transactional outbox remain responsibilities of their owning boundaries.
 */
export const planOrganizationOwnerTransfer = ({
  organization,
  ownerIdWhenTransferWasOpened,
  recipient,
  recipientMemberships
}: OrganizationOwnerTransferInput): OrganizationOwnerTransferResult => {
  if (
    !hasText(organization.id) ||
    !hasText(organization.ownerId) ||
    !hasText(ownerIdWhenTransferWasOpened) ||
    !hasText(recipient.userId)
  ) {
    return err({ kind: "invalid", reason: "invalid-input" });
  }

  if (organization.ownerId !== ownerIdWhenTransferWasOpened) {
    return err({ kind: "conflict", currentOwnerId: organization.ownerId });
  }

  if (recipient.userId === organization.ownerId) {
    return err({ kind: "invalid", reason: "recipient-is-current-owner" });
  }

  if (recipient.isGuest) {
    return err({ kind: "invalid", reason: "recipient-is-guest" });
  }

  const organizationMemberships = recipientMemberships.filter(membership =>
    membership.organizationId === organization.id &&
    membership.workspaceId.trim().length > 0 &&
    membership.userId === recipient.userId
  );

  if (organizationMemberships.some(membership => membership.status === "ACTIVE" && membership.role === "ADMIN")) {
    return ok({
      kind: "TRANSFER",
      organizationId: organization.id,
      previousOwnerId: organization.ownerId,
      nextOwnerId: recipient.userId,
      expectedOwnerId: ownerIdWhenTransferWasOpened
    });
  }

  if (organizationMemberships.some(membership => membership.status === "SUSPENDED")) {
    return err({ kind: "invalid", reason: "recipient-membership-is-suspended" });
  }

  if (organizationMemberships.some(membership => membership.status === "REMOVED")) {
    return err({ kind: "invalid", reason: "recipient-membership-is-removed" });
  }

  if (organizationMemberships.some(membership => membership.status === "ACTIVE")) {
    return err({ kind: "invalid", reason: "recipient-is-not-workspace-admin" });
  }

  return err({ kind: "invalid", reason: "recipient-has-no-organization-membership" });
};
