export interface UserInvitation {
  readonly id: string;
  readonly workspaceId: string;
  readonly email: string;
  readonly invitedBy: string;
  readonly tokenHash: string;
  readonly status: "pending" | "accepted" | "expired" | "revoked";
  readonly role: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly acceptedAt?: Date;
  readonly deletedAt?: Date;
}
