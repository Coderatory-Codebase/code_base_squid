export { createIdentityUserBootstrap } from "./sign-in.js";
export { createUserProfileGateway } from "../shared/repositories/user-profile.gateway.js";
export type {
  UserProfile,
  UserProfileDocument,
  UserProfileGateway,
  UserProfileGatewayDependencies,
  UserProfilePrincipal,
  UserProfileQuery,
  UserProfileQueryPort,
  UserProfileUpdateResult
} from "../shared/index.js";
export { SESSION_COLLECTION, SESSION_LIFETIME_MS } from "../shared/models/session.js";
export type { ActiveSession, SessionRecord, UserSession } from "../shared/models/session.js";
export type { IdentityUserRecord } from "../shared/models/user.js";
export { USER_COLLECTION } from "../shared/models/user.js";
export type { IdentityProvider, VerifiedIdentity } from "../shared/models/oidc.js";
export type { Principal } from "../shared/models/principal.js";
export type { IdentitySignal } from "../shared/models/identity-signal.js";
export type { SessionQueryPort } from "../shared/ports/session.port.js";
export type { SignInCompletionPort, SignInCompletionResult } from "../shared/ports/sign-in-completion.port.js";
export type {
  IdentityUserBootstrapResult,
  IdentitySessionInsert,
  IdentityUserBootstrapPort,
  IdentityUserProvisioningPort,
  IdentityUserTransaction
} from "../shared/ports/user-bootstrap.port.js";
export type { IdentityBootstrapDependencies } from "./identity.bootstrap.js";
export {
  createIdentityMongoDependencies,
  hashInvitationToken,
  initializeIdentityMongoCollections
} from "../integrations/index.js";
export type { IdentityMongoDependencies } from "../integrations/index.js";
