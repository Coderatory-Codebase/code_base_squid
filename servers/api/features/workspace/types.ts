export type Principal = Readonly<{
  userId: string;
  workspaceIds?: readonly string[];
}>;

export type OrganizationState =
  | Readonly<{ kind: "ACTIVE" }>
  | Readonly<{ kind: "ARCHIVED" }>
  | Readonly<{ kind: "DELETION_SCHEDULED"; effectiveOn: Date }>;

export type OrganizationProfile = Readonly<{
  id: string;
  name: string;
  ownerId: string;
  ownerDisplayName?: string | null;
  ownerName?: string | null;
  ownerUnavailable?: boolean;
  createdAt: Date;
  state: OrganizationState;
  workspaces: readonly Readonly<{
    id: string;
    name: string;
    state: "ACTIVE" | "ARCHIVED";
    activeMemberCount: number;
  }>[];
}>;
