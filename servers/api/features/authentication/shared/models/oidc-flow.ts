import type { IdentityProvider, VerifiedIdentity } from "../../../identity/services/index.js";

export type OidcFlowContext = Readonly<{
  provider: IdentityProvider;
  state: string;
  nonce: string;
  codeVerifier: string;
  invitationToken?: string;
}>;

export type OidcAuthorizationRequestResult =
  | Readonly<{ kind: "ready"; authorizationUrl: string; context: OidcFlowContext }>
  | Readonly<{ kind: "provider-unavailable" }>;

export type OidcCallbackResult =
  | Readonly<{ kind: "verified"; identity: VerifiedIdentity }>
  | Readonly<{ kind: "invalid-sign-in" }>
  | Readonly<{ kind: "provider-unavailable" }>;
