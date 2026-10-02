export interface Principal {
  readonly userId: string;
  readonly workspaceId: string;
  readonly role: string;
  readonly permissions: readonly string[];
}

export interface InvitationQueryOptions {
  readonly status?: "pending" | "accepted" | "expired" | "revoked";
  readonly limit?: number;
  readonly skip?: number;
}

export interface PendingInvitationInput {
  readonly email: string;
  readonly role: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

export interface InvitationCommandInput {
  readonly email: string;
  readonly role: string;
}
