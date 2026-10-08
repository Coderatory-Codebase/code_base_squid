export type { Principal } from "../../types/index.js";

export type OrganizationSummary = Readonly<{ id: string; name: string }>;
export type OrganizationListSummary = OrganizationSummary & Readonly<{
  status: "active" | "archived";
  archivedAt: Date | null;
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

export type OrganizationPage<T> = Readonly<{
  organizations: readonly T[];
  nextOffset: number | null;
}>;
export type OrganizationRole = "admin" | "member";
