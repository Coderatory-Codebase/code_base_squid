export { createOrganizationRoutes } from "./routes/index.js";
export { createWorkspaceRoutes } from "./routes/index.js";
export {
  buildOrganizationQueryForPrincipal,
  createOrganizationGateway,
  organizationPageSize
} from "./db/organization.gateway.js";
export * from "./integrations/organization.model.js";
export { createOrganizationRequestSignal } from "./routes/organization-signal.js";
export type { PrincipalResolver } from "./controllers/organization.controller.js";
export type { OrganizationGateway } from "./db/organization.gateway.js";
export {
  buildOrganizationSettingsQueryFor,
  explainOrganizationSettingsQueryFor,
  settingsOf
} from "./db/organization-setting.gateway.js";
export type { OrganizationSettings } from "./db/organization-setting.gateway.js";
export { createMembersGateway } from "./db/members.gateway.js";
export type { MembersGateway, OrganizationDashboard } from "./db/members.gateway.js";
export { createMembersService } from "./services/members.service.js";
export type { MembersService } from "./services/members.service.js";
export type { OrganizationSettingsReader } from "./controllers/organization-settings.controller.js";
export type { OrganizationSettingsUpdater } from "./services/organization-settings.service.js";
export type { OrganizationRole } from "./types.js";
export {
  createInvitationAcceptedConsumer,
  createWorkspaceInvitationAcceptedConsumer
} from "./consumers/index.js";
export type {
  InvitationAcceptedConsumer,
  InvitationAcceptedConsumerDependencies,
  InvitationAcceptedEvent,
  InvitationAcceptedOutcome,
  InvitationAcceptedPersistence,
  InvitationAcceptedSignal,
  InvitationWorkspace
} from "./consumers/index.js";
export { createInvitationAcceptedGateway } from "./db/invitation-accepted.gateway.js";
export { WorkspaceModel } from "./integrations/workspace.model.js";
export type { WorkspaceMember, WorkspaceNotAppliedEvent, WorkspaceRecord } from "./integrations/workspace.model.js";
export { createOrganizationLifecycleService } from "./services/organization-lifecycle.service.js";
export type { OrganizationLifecycleService, OrganizationLifecycleCommandResult } from "./services/organization-lifecycle.service.js";
export { transitionOrganizationLifecycle, resolveOrganizationLifecycle } from "./domain/organization-lifecycle.js";
export type { OrganizationLifecycle, OrganizationLifecycleAction, OrganizationLifecycleStatus } from "./domain/organization-lifecycle.js";
export { createWorkspaceRepository } from "./workspace.repository.js";
export { planOrganizationOwnerTransfer } from "./domain/organization-owner-transfer.js";
export { resolveOrganizationOwnership } from "./domain/organization-ownership.js";
export type { WorkspaceRepository, WorkspaceRepositoryDependencies } from "./workspace.repository.js";
export type {
  OrganizationOwnerTransferError,
  OrganizationOwnerTransferInput,
  OrganizationOwnerTransferMembership,
  OrganizationOwnerTransferPlan,
  OrganizationOwnerTransferResult
} from "./domain/organization-owner-transfer.js";
export type {
  OrganizationOwnership,
  OrganizationOwnershipError,
  OrganizationOwnershipEvent,
  OrganizationOwnershipInput,
  Result as WorkspaceDomainResult
} from "./domain/organization-ownership.js";
export type { Principal, OrganizationProfile, OrganizationState } from "./types.js";
export { createOrganizationBrandingGateway } from "./organization-branding.gateway.js";
export {
  evaluateOrganizationPurge,
  isDeletionOverdue
} from "./domain/organization-lifecycle.js";
export type {
  DeletionTraceEntry,
  LifecycleDecision,
  LifecycleError,
  LifecycleState,
  PurgeConfirmation,
  ScheduledOrganizationLifecycle,
  WorkspaceDeletedEvent
} from "./domain/organization-lifecycle.js";
export {
  DEFAULT_ACCENT_COLOR,
  MAXIMUM_LOGO_BYTES,
  MAXIMUM_LOGO_DIMENSION,
  MINIMUM_LOGO_DIMENSION,
  MINIMUM_WHITE_CONTRAST,
  contrastAgainstWhite,
  inspectOrganizationLogoBytes,
  evaluateAccentColor,
  proposeOrganizationBranding,
  validateOrganizationLogo
} from "./domain/organization-branding.js";
export type {
  AccentColorEvaluation,
  DetectedLogoFormat,
  InspectedLogo,
  LogoValidationError,
  OrganizationBrandingState,
  OrganizationBrandingError,
  Result
} from "./domain/organization-branding.js";
export {
  assertOrganizationBrandingIndexInUse,
  explainOrganizationBrandingQuery,
  explainUsesOrganizationBrandingIndex,
  explainUsesOrganizationBrandingListIndex,
  organizationBrandingMongoReader
} from "./organization-branding.mongo-reader.js";
export {
  ORGANIZATION_BRANDING_INDEX_NAME,
  ORGANIZATION_BRANDING_LIST_INDEX_NAME
} from "../../integrations/index.js";
export type {
  OrganizationBranding,
  OrganizationBrandingGateway,
  OrganizationBrandingQuery,
  OrganizationBrandingReader,
  WorkspacePrincipal
} from "./organization-branding.gateway.js";
