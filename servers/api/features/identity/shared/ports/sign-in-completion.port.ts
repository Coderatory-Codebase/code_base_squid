import type { VerifiedIdentity } from "../models/oidc.js";

export type SignInCompletionResult =
  | Readonly<{ kind: "signed-in"; sessionToken: string; workspaceId: string | null }>
  | Readonly<{ kind: "account-closed" }>;

export type SignInCompletionPort = Readonly<{
  complete: (identity: VerifiedIdentity) => Promise<SignInCompletionResult>;
}>;
