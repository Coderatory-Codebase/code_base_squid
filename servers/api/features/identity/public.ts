export { createIdentityUserBootstrap } from "./sign-in.js";
export { createUserProfileGateway } from "./shared/repositories/user-profile.gateway.js";
export type {
  UserProfile,
  UserProfileGateway,
  UserProfileGatewayDependencies,
  UserProfilePrincipal,
  UserProfileQuery,
  UserProfileQueryPort,
  UserProfileUpdateResult
} from "./shared/index.js";
export { SESSION_LIFETIME_MS } from "./shared/models/session.js";
export type { ActiveSession } from "./shared/models/session.js";
export type { IdentityProvider, VerifiedIdentity } from "./shared/models/oidc.js";
export type { Principal } from "./shared/models/principal.js";
export type { IdentitySignal } from "./shared/models/identity-signal.js";
export type { SessionQueryPort } from "./shared/ports/session.port.js";
export type { SignInCompletionPort, SignInCompletionResult } from "./shared/ports/sign-in-completion.port.js";
export type {
  IdentityUserBootstrapResult,
  IdentityUserProvisioningPort,
  IdentityUserTransaction
} from "./shared/ports/user-bootstrap.port.js";
