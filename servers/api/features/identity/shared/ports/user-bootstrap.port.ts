import type { UserCreatedV1 } from "@workspace/types";
import type { VerifiedIdentity } from "../models/oidc.js";
import type { IdentityUserRecord } from "../models/user.js";

export type IdentitySessionInsert = Readonly<{
  sessionId: string;
  tokenHash: string;
  userId: string;
  status: "ACTIVE";
  lastUsedAt: Date;
  expiresAt: Date;
  device: string;
}>;

export type IdentityUserTransaction = Readonly<{
  findUserByProviderSubject: (
    provider: VerifiedIdentity["provider"],
    subject: string
  ) => Promise<IdentityUserRecord | null>;
  insertUser: (user: IdentityUserRecord) => Promise<void>;
  insertSession: (session: IdentitySessionInsert) => Promise<void>;
  appendUserCreated: (event: UserCreatedV1) => Promise<void>;
}>;

export type IdentityUserProvisioningPort = Readonly<{
  createUser: (
    transaction: IdentityUserTransaction,
    identity: VerifiedIdentity
  ) => Promise<IdentityUserBootstrapResult>;
}>;

export type IdentityUserBootstrapResult =
  | Readonly<{ kind: "created"; user: IdentityUserRecord; sessionToken: string }>
  | Readonly<{ kind: "existing"; user: IdentityUserRecord; sessionToken: string }>
  | Readonly<{ kind: "account-closed" }>;

export type IdentityUserBootstrapPort = IdentityUserProvisioningPort;