import type { VerifiedIdentity } from "../models/oidc.js";

export type SignInCompletionResult =
  | Readonly<{ kind: "signed-in"; sessionToken: string; workspaceId: string | null }>
  | Readonly<{ kind: "account-closed" }>;

export type SignInCompletionPort = Readonly<{
  /**
   * `invitationToken` originates from an encrypted, short-lived OIDC flow
   * cookie.  It is deliberately not sent to the identity provider.
   */
  complete: (identity: VerifiedIdentity, invitationToken?: string) => Promise<SignInCompletionResult>;
}>;
