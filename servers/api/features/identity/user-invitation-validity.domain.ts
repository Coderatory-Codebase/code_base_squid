export const invalidInvitationMessage = "This invitation is no longer valid. Ask the person who sent it for a new one.";

export type InvitationValidityStatus = "pending" | "accepted" | "expired" | "revoked";

export type InvitationLinkDecision = Readonly<{
  kind: "invalid";
  message: typeof invalidInvitationMessage;
}>;

export const refuseInvalidInvitationLink = (
  invitation: Readonly<{ status: InvitationValidityStatus; expiresAt: Date }> | null,
  now: Date
): InvitationLinkDecision => {
  if (!invitation || invitation.status !== "pending" || invitation.expiresAt.getTime() <= now.getTime()) {
    return Object.freeze({ kind: "invalid", message: invalidInvitationMessage });
  }
  return Object.freeze({ kind: "invalid", message: invalidInvitationMessage });
};
