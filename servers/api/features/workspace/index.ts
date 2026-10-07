export * from "./integrations/organization.model.js";
export { createWorkspaceRepository } from "./workspace.repository.js";
export { planOrganizationOwnerTransfer } from "./domain/organization-owner-transfer.js";
export { resolveOrganizationOwnership } from "./domain/organization-ownership.js";
export { createWorkspaceRoutes } from "./routes/index.js";
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
  OrganizationLifecycle,
  PurgeConfirmation,
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
