import type { IdentityProvider } from "../../../identity/services/index.js";
import type {
  OidcAuthorizationRequestResult,
  OidcCallbackResult,
  OidcFlowContext
} from "../models/oidc-flow.js";

export type OidcProviderPort = Readonly<{
  createAuthorizationRequest: (
    provider: IdentityProvider,
    redirectUri: string
  ) => Promise<OidcAuthorizationRequestResult>;
  verifyCallback: (
    provider: IdentityProvider,
    callbackUrl: string,
    redirectUri: string,
    context: OidcFlowContext
  ) => Promise<OidcCallbackResult>;
}>;
