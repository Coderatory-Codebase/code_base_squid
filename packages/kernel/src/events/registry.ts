const VERSION_1 = Object.freeze([1] as const);
const VERSION_1_AND_2 = Object.freeze([1, 2] as const);

export const WAVE_1_EVENT_TYPES = Object.freeze([
  "OrganizationCreated",
  "OrganizationUpdated",
  "OrganizationArchived",
  "OrganizationRestored",
  "OrganizationDeletionScheduled",
  "OrganizationDeletionCancelled",
  "WorkspaceCreated",
  "WorkspaceUpdated",
  "WorkspaceArchived",
  "WorkspaceRestored",
  "WorkspaceDeleted",
  "WorkspacePurged",
  "MemberAdded",
  "MemberRoleChanged",
  "MemberRemoved",
  "OwnershipTransferred",
  "UserCreated",
  "UserClosed",
  "UserRestored",
  "UserDeleted",
  "InvitationCreated",
  "InvitationAccepted",
  "SessionRevoked",
  "TeamChanged",
  "TeamMembershipChanged"
] as const);

export const EVENT_CONTRACT_REGISTRY = Object.freeze({
  OrganizationCreated: VERSION_1,
  OrganizationUpdated: VERSION_1,
  OrganizationArchived: VERSION_1,
  OrganizationRestored: VERSION_1,
  OrganizationDeletionScheduled: VERSION_1,
  OrganizationDeletionCancelled: VERSION_1,
  WorkspaceCreated: VERSION_1,
  WorkspaceUpdated: VERSION_1,
  WorkspaceArchived: VERSION_1,
  WorkspaceRestored: VERSION_1,
  WorkspaceDeleted: VERSION_1,
  WorkspacePurged: VERSION_1,
  MemberAdded: VERSION_1,
  MemberRoleChanged: VERSION_1,
  MemberRemoved: VERSION_1,
  OwnershipTransferred: VERSION_1,
  UserCreated: VERSION_1,
  UserClosed: VERSION_1,
  UserRestored: VERSION_1,
  UserDeleted: VERSION_1,
  InvitationCreated: VERSION_1,
  InvitationAccepted: VERSION_1,
  SessionRevoked: VERSION_1,
  TeamChanged: VERSION_1,
  TeamMembershipChanged: VERSION_1,
  TaskUpdated: VERSION_1_AND_2
} as const);

export type RegisteredEventType = keyof typeof EVENT_CONTRACT_REGISTRY;

export type RegisteredEventVersion<EventType extends RegisteredEventType> =
  (typeof EVENT_CONTRACT_REGISTRY)[EventType][number];
