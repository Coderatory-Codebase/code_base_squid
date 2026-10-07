import * as openidClient from "openid-client";
import type { Configuration } from "openid-client";
import { z } from "zod";
import type { IdentityProvider } from "../../features/identity/index.js";
import type {
  OidcAuthorizationRequestResult,
  OidcCallbackResult,
  OidcProviderPort
} from "../../features/authentication/index.js";

export type OidcProviderConfiguration = Readonly<{
  issuer: URL;
  clientId: string;
  clientSecret: string;
}>;

type OidcClient = Readonly<{
  discovery: typeof openidClient.discovery;
  randomPKCECodeVerifier: typeof openidClient.randomPKCECodeVerifier;
  calculatePKCECodeChallenge: typeof openidClient.calculatePKCECodeChallenge;
  randomState: typeof openidClient.randomState;
  randomNonce: typeof openidClient.randomNonce;
  buildAuthorizationUrl: typeof openidClient.buildAuthorizationUrl;
  authorizationCodeGrant: (
    configuration: Configuration,
    callbackUrl: URL,
    checks: Readonly<{ expectedState: string; expectedNonce: string; pkceCodeVerifier: string }>,
    parameters: Readonly<{ redirect_uri: string }>
  ) => Promise<Readonly<{ claims: () => unknown }>>;
}>;

type OidcProviderDependencies = Readonly<{
  providers: Readonly<Partial<Record<IdentityProvider, OidcProviderConfiguration>>>;
  client?: OidcClient;
}>;

const verifiedClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  email_verified: z.literal(true),
  name: z.string().min(1)
});

const isProviderUnavailable = (error: unknown): boolean => {
  if (error instanceof TypeError) return true;
  if (typeof error !== "object" || error === null) return false;

  const status = "status" in error && typeof error.status === "number"
    ? error.status
    : "response" in error && typeof error.response === "object" && error.response !== null
      && "status" in error.response && typeof error.response.status === "number"
      ? error.response.status
      : undefined;

  return status === 429 || (status !== undefined && status >= 500);
};

export const createOidcProvider = ({
  providers,
  client = openidClient
}: OidcProviderDependencies): OidcProviderPort => {
  const configurationPromises = new Map<IdentityProvider, Promise<Configuration>>();

  const getConfiguration = (provider: IdentityProvider): Promise<Configuration> => {
    const cached = configurationPromises.get(provider);
    if (cached) return cached;

    const providerSettings = providers[provider];
    if (!providerSettings) throw new Error(`The ${provider} OIDC provider is not configured.`);
    const pending = client.discovery(
      providerSettings.issuer,
      providerSettings.clientId,
      providerSettings.clientSecret
    ).catch((error: unknown) => {
      configurationPromises.delete(provider);
      throw error;
    });
    configurationPromises.set(provider, pending);
    return pending;
  };

  return Object.freeze({
    createAuthorizationRequest: async (provider, redirectUri): Promise<OidcAuthorizationRequestResult> => {
      let configuration: Configuration;
      try {
        configuration = await getConfiguration(provider);
      } catch {
        return { kind: "provider-unavailable" };
      }
      const codeVerifier = client.randomPKCECodeVerifier();
      const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
      const state = client.randomState();
      const nonce = client.randomNonce();
      const authorizationUrl = client.buildAuthorizationUrl(configuration, {
        redirect_uri: redirectUri,
        scope: "openid email profile",
        response_type: "code",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
        nonce
      });

      return {
        kind: "ready",
        authorizationUrl: authorizationUrl.href,
        context: { provider, state, nonce, codeVerifier }
      };
    },
    verifyCallback: async (provider, callbackUrl, redirectUri, context): Promise<OidcCallbackResult> => {
      if (context.provider !== provider) return { kind: "invalid-sign-in" };

      let configuration: Configuration;
      try {
        configuration = await getConfiguration(provider);
      } catch {
        return { kind: "provider-unavailable" };
      }

      let tokens: Awaited<ReturnType<typeof client.authorizationCodeGrant>>;
      try {
        tokens = await client.authorizationCodeGrant(configuration, new URL(callbackUrl), {
          expectedState: context.state,
          expectedNonce: context.nonce,
          pkceCodeVerifier: context.codeVerifier
        }, { redirect_uri: redirectUri });
      } catch (error: unknown) {
        return isProviderUnavailable(error)
          ? { kind: "provider-unavailable" }
          : { kind: "invalid-sign-in" };
      }

      const claims = verifiedClaimsSchema.safeParse(tokens.claims());
      if (!claims.success) return { kind: "invalid-sign-in" };

      return {
        kind: "verified",
        identity: {
          provider,
          subject: claims.data.sub,
          email: claims.data.email,
          displayName: claims.data.name
        }
      };
    }
  });
};
