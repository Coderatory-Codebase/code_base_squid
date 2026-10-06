export type ManagedInvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type ManagedInvitation = Readonly<{
  status: ManagedInvitationStatus;
  expiresAt: Date;
}>;

export type InvitationManagementResult =
  | Readonly<{ kind: "revoke" }>
  | Readonly<{ kind: "resend"; expiresAt: Date }>
  | Readonly<{ kind: "refused"; reason: "forbidden" | "invitation-not-pending" }>;

const plusSevenDays = (now: Date): Date => {
  const expiry = new Date(now);
  expiry.setUTCDate(expiry.getUTCDate() + 7);
  return expiry;
};

export const decideInvitationRevocation = (
  invitation: ManagedInvitation,
  canManageInvitations: boolean
): InvitationManagementResult => {
  if (!canManageInvitations) return Object.freeze({ kind: "refused", reason: "forbidden" });
  if (invitation.status !== "pending") return Object.freeze({ kind: "refused", reason: "invitation-not-pending" });
  return Object.freeze({ kind: "revoke" });
};

export const decideInvitationResend = (
  invitation: ManagedInvitation,
  canManageInvitations: boolean,
  now: Date
): InvitationManagementResult => {
  if (!canManageInvitations) return Object.freeze({ kind: "refused", reason: "forbidden" });
  if (invitation.status !== "pending") return Object.freeze({ kind: "refused", reason: "invitation-not-pending" });
  return Object.freeze({ kind: "resend", expiresAt: plusSevenDays(now) });
};
