export * from "./gateways/index.js";
export type { UserInvitation } from "./models/index.js";
export type { InvitationCommandInput, InvitationQueryOptions, PendingInvitationInput, Principal as InvitationPrincipal } from "./types/index.js";
export { createUserProfileGateway } from "./shared/index.js";
export {
  SESSION_COLLECTION,
  SESSION_LIFETIME_MS,
  USER_COLLECTION
} from "./shared/index.js";
export { createIdentityUserBootstrap } from "./sign-in.js";
export { createUserProfileRoutes } from "./routes/index.js";
export { createUserSessionsRoutes } from "./routes/index.js";
export { createIdentitySessionManager } from "./sessions.js";
export type { IdentitySessionManager, ManagedSession, SessionAudit } from "./sessions.js";
export type { UserSessionsRouteDependencies } from "./routes/index.js";
export type { UserProfileRouteDependencies, UserProfileSignal } from "./routes/index.js";
export type {
  ActiveSession,
  IdentitySignal,
  Principal,
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
} from "./shared/index.js";
export type {
  UserProfile,
  UserProfileDocument,
  UserProfileGateway,
  UserProfileGatewayDependencies,
  UserProfilePrincipal,
  UserProfileQuery,
  UserProfileQueryPort,
  UserProfileUpdateResult
} from "./shared/index.js";
export {
  createIdentityMongoDependencies,
  hashInvitationToken,
  initializeIdentityMongoCollections
} from "./integrations/index.js";
export type { IdentityMongoDependencies } from "./integrations/index.js";
export type { IdentityBootstrapDependencies } from "./identity.bootstrap.js";
