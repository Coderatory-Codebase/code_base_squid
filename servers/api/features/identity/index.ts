export * from "./gateways/index.js";
export * from "./models/index.js";
export type { InvitationCommandInput, InvitationQueryOptions, PendingInvitationInput, Principal } from "./types/index.js";

export {
  createIdentityMongoDependencies,
  createIdentitySessionManager,
  createIdentityUserBootstrap,
  createUserProfileGateway,
  hashInvitationToken,
  initializeIdentityMongoCollections,
  SESSION_LIFETIME_MS,
  USER_COLLECTION,
  SESSION_COLLECTION
} from "./services/index.js";
export { createUserProfileRoutes, createUserSessionsRoutes } from "./routes/index.js";
export type { IdentitySessionManager, ManagedSession, SessionAudit } from "./services/index.js";
export type { UserSessionsRouteDependencies, UserProfileRouteDependencies, UserProfileSignal } from "./routes/index.js";
export type {
  ActiveSession,
  IdentitySignal,
  SessionQueryPort,
  SessionRecord,
  UserSession,
  IdentityProvider,
  IdentityUserRecord,
  IdentitySessionInsert,
  IdentityUserBootstrapPort,
  IdentityUserBootstrapResult,
  IdentityUserProvisioningPort,
  IdentityUserTransaction,
  SignInCompletionPort,
  SignInCompletionResult,
  VerifiedIdentity
} from "./services/index.js";
export type { Principal as IdentityPrincipal } from "./services/index.js";
export type {
  UserProfile,
  UserProfileDocument,
  UserProfileGateway,
  UserProfileGatewayDependencies,
  UserProfilePrincipal,
  UserProfileQuery,
  UserProfileQueryPort,
  UserProfileUpdateResult
} from "./services/index.js";
export type { IdentityMongoDependencies, IdentityBootstrapDependencies } from "./services/index.js";
