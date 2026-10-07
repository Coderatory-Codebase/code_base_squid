export type ApiOrganizationState =
  | Readonly<{ kind: "ACTIVE" }>
  | Readonly<{ kind: "ARCHIVED" }>
  | Readonly<{ kind: "DELETION_SCHEDULED"; effectiveOn: string }>;

export type ApiOrganizationWorkspaceState = "ACTIVE" | "ARCHIVED";

export type ApiOrganizationWorkspace = Readonly<{
  id: string;
  name: string;
  state: ApiOrganizationWorkspaceState;
  activeMemberCount: number;
}>;

export type ApiOrganizationProfile = Readonly<{
  id: string;
  name: string;
  ownerId: string;
  ownerDisplayName?: string | null;
  ownerName?: string | null;
  ownerUnavailable?: boolean;
  createdAt: string;
  state: ApiOrganizationState;
  workspaces?: readonly ApiOrganizationWorkspace[];
}>;

export type ApiOrganizationProfileResponse = ApiOrganizationProfile;
