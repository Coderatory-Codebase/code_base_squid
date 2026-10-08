import { randomBytes, randomUUID } from "node:crypto";
import type { ApiConfig, OidcApiConfiguration } from "../types/index.js";
import { createIdentityUserBootstrap, createIdentitySessionManager, createUserProfileGateway } from "../features/identity/index.js";
import type { UserProfileRouteDependencies } from "../features/identity/index.js";
import type { UserSessionsRouteDependencies } from "../features/identity/index.js";
import {
  createOidcFlowCookie,
  createPrincipalResolver,
  createSessionCookieResolver
} from "../features/authentication/index.js";
import type { OidcProviderPort, OidcSignInControllerDependencies } from "../features/authentication/index.js";
import { createWorkspaceBootstrap } from "../features/workspace/index.js";
import type { MongoDbIntegration } from "../integrations/index.js";
import {
  createIdentityUserModel,
  createSessionModel,
  createSessionQueryAdapter,
  createUserProfileQueryAdapter,
  createWorkspaceMembershipQueryAdapter,
  createMongoSignInTransactionRunner
} from "../integrations/mongodb/index.js";
import { createOidcProvider } from "../integrations/identity-provider/index.js";

const createVerifiedIdentityProvider = (configuration: OidcApiConfiguration) =>
  createOidcProvider({ providers: configuration.providers });

const unavailableIdentityProvider: OidcProviderPort = Object.freeze({
  createAuthorizationRequest: () => Promise.resolve({ kind: "provider-unavailable" as const }),
  verifyCallback: () => Promise.resolve({ kind: "provider-unavailable" as const })
});

export type IdentityRuntime = Readonly<{
  profile: UserProfileRouteDependencies;
  authentication: OidcSignInControllerDependencies;
  sessionManagement: UserSessionsRouteDependencies;
}>;

export const createIdentityRuntime = (database: MongoDbIntegration, config: ApiConfig): IdentityRuntime => {
  const sessions = createSessionModel(database.connection);
  const sessionPort = createSessionQueryAdapter(sessions);
  const users = createIdentityUserModel(database.connection);
  const membershipPort = createWorkspaceMembershipQueryAdapter(database.connection);
  const transactionRunner = createMongoSignInTransactionRunner(database.connection);
  const identityProvisioning = createIdentityUserBootstrap({
    createId: randomUUID,
    createSessionToken: () => randomBytes(32).toString("base64url"),
    now: () => new Date(),
    deviceLabel: "Unknown device"
  });
  const resolveSession = createSessionCookieResolver({ sessions: sessionPort });
  const principalResolver = createPrincipalResolver({
    resolveSession,
    invalidateResolvedSession: resolveSession.invalidateSession,
    memberships: membershipPort
  });
  const profileDependencies = {
    principalResolver,
    gateway: createUserProfileGateway({ queryPort: createUserProfileQueryAdapter(users) })
  };
  const sessionManagement = {
    principalResolver,
    manager: createIdentitySessionManager(sessionPort)
  };

  const workspaceBootstrap = createWorkspaceBootstrap({
    transactionRunner,
    identity: identityProvisioning,
    createId: randomUUID
  });
  const oidcProvider = config.oidc
    ? createVerifiedIdentityProvider(config.oidc)
    : unavailableIdentityProvider;
  const flowCookie = createOidcFlowCookie({
    encryptionKey: config.oidc
      ? Buffer.from(config.oidc.flowCookieKey, "base64url")
      : randomBytes(32)
  });

  return Object.freeze({
    profile: profileDependencies,
    sessionManagement,
    authentication: Object.freeze({
      provider: oidcProvider,
      flowCookie,
      completion: workspaceBootstrap,
      callbackBaseUrl: config.oidc?.callbackBaseUrl ?? `http://${config.host}:${String(config.port)}`,
      webOrigin: config.webOrigin,
      secureCookies: config.environment === "production",
      sessions: sessionPort,
      resolveSession,
      invalidatePrincipalSession: principalResolver.invalidateSession
    })
  });
};
