export type InvitationAcceptanceStatus = "pending" | "accepted" | "expired" | "revoked";

export type InvitationForAcceptance = Readonly<{
  email: string;
  expiresAt: Date;
  status: InvitationAcceptanceStatus;
}>;

export type InvitationAcceptanceResult =
  | Readonly<{ kind: "accept" }>
  | Readonly<{ kind: "already-accepted" }>
  | Readonly<{ kind: "refused"; reason: "invitation-for-a-different-email" | "invitation-no-longer-valid" }>;

export const decideInvitationAcceptance = (
  invitation: InvitationForAcceptance,
  principalEmail: string,
  now: Date
): InvitationAcceptanceResult => {
  if (invitation.status === "accepted") return Object.freeze({ kind: "already-accepted" });
  if (invitation.status !== "pending" || invitation.expiresAt.getTime() <= now.getTime()) {
    return Object.freeze({ kind: "refused", reason: "invitation-no-longer-valid" });
  }
  if (invitation.email.trim().toLowerCase() !== principalEmail.trim().toLowerCase()) {
    return Object.freeze({ kind: "refused", reason: "invitation-for-a-different-email" });
  }
  return Object.freeze({ kind: "accept" });
};
