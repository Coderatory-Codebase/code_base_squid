export { createUserProfileGateway } from "./shared/index.js";
export {
  SESSION_COLLECTION,
  SESSION_LIFETIME_MS,
  USER_COLLECTION,
  USER_PROFILE_COLLECTION,
  USER_PROFILE_VIEW_INDEX_KEYS,
  USER_PROFILE_VIEW_INDEX_NAME
} from "./shared/index.js";
export { createIdentityUserBootstrap } from "./sign-in.js";
export { createUserProfileRoutes } from "./routes/index.js";
export type { UserProfileRouteDependencies, UserProfileSignal } from "./routes/index.js";
export type {
  ActiveSession,
  IdentitySignal,
  Principal,
  SessionQueryPort,
  SessionRecord,
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
  UserProfileRecord
} from "./shared/index.js";
