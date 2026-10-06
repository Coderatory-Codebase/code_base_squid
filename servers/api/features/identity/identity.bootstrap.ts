export type VerifiedIdentity = Readonly<{
  issuer: string;
  subject: string;
  email: string;
  displayName?: string;
}>;

export type IdentityBootstrapDependencies<Transaction> = Readonly<{
  createUser: (
    input: Readonly<{ identity: VerifiedIdentity; idempotencyKey?: string }>,
    transaction: Transaction
  ) => Promise<Readonly<{ id: string }>>;
  resolveInvitation: (
    token: string,
    email: string,
    transaction: Transaction
  ) => Promise<
    | Readonly<{ status: "valid"; workspaceId: string; role: string }>
    | Readonly<{ status: "expired"; senderName: string }>
    | Readonly<{ status: "missing" }>
  >;
  acceptInvitation: (
    input: Readonly<{ userId: string; workspaceId: string; role: string; idempotencyKey: string }>,
    transaction: Transaction
  ) => Promise<void>;
}>;
