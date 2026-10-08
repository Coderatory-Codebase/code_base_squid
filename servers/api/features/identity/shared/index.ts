export { createUserProfileGateway } from "./repositories/user-profile.gateway.js";
export { SESSION_COLLECTION, SESSION_LIFETIME_MS } from "./models/session.js";
export { USER_COLLECTION } from "./models/user.js";
export type {
  UserProfile,
  UserProfileDocument,
  UserProfileQuery,
  UserProfileUpdateResult
} from "./models/user-profile.js";
export type {
  UserProfileGateway,
  UserProfileGatewayDependencies,
  UserProfilePrincipal
} from "./repositories/user-profile.gateway.js";
export type { ActiveSession, SessionRecord, UserSession } from "./models/session.js";
export type { IdentityUserRecord } from "./models/user.js";
export type { IdentityProvider, VerifiedIdentity } from "./models/oidc.js";
export type { Principal } from "./models/principal.js";
export type { IdentitySignal } from "./models/identity-signal.js";
export type { SessionQueryPort } from "./ports/session.port.js";
export type { SignInCompletionPort, SignInCompletionResult } from "./ports/sign-in-completion.port.js";
export type {
  IdentitySessionInsert,
  IdentityUserBootstrapPort,
  IdentityUserBootstrapResult,
  IdentityUserProvisioningPort,
  IdentityUserTransaction
} from "./ports/user-bootstrap.port.js";
export type { UserProfileQueryPort } from "./ports/user-profile.port.js";
