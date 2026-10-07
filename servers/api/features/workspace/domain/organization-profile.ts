import type { OrganizationProfile as BaseOrganizationProfile, OrganizationState } from "../types.js";

export type OrganizationWorkspaceState = "ACTIVE" | "ARCHIVED";

export type OrganizationWorkspaceProfile = Readonly<{
  id: string;
  name: string;
  state: OrganizationWorkspaceState;
  activeMemberCount: number;
}>;

export type OrganizationProfile = BaseOrganizationProfile & Readonly<{
  workspaces: readonly OrganizationWorkspaceProfile[];
}>;

export type OrganizationProfileError =
  | Readonly<{ kind: "invalid-principal" }>
  | Readonly<{ kind: "organization-not-found" }>
  | Readonly<{ kind: "forbidden" }>;

export type Result<Value, Error> =
  | Readonly<{ ok: true; value: Value }>
  | Readonly<{ ok: false; error: Error }>;

export type OrganizationProfileSource = Readonly<{
  id: string;
  name: string;
  ownerId: string;
  ownerDisplayName?: string | null;
  ownerName?: string | null;
  ownerUnavailable?: boolean;
  createdAt: Date;
  state: OrganizationState;
}>;

export type OrganizationProfilePrincipal = Readonly<{ userId: string }>;

export type OrganizationProfileInput = Readonly<{
  principal: OrganizationProfilePrincipal;
  organization: OrganizationProfileSource | null;
  workspaces: readonly OrganizationWorkspaceProfile[];
  activeMemberWorkspaceIds: readonly string[];
}>;

const ok = <Value>(value: Value): Result<Value, never> => ({ ok: true, value });
const err = <Error>(error: Error): Result<never, Error> => ({ ok: false, error });

/**
 * Applies the organization workspace visibility rule without depending on delivery,
 * persistence, or network libraries. Owners receive every workspace; members receive
 * only workspaces with an active membership.
 */
export const buildOrganizationProfile = ({
  principal,
  organization,
  workspaces,
  activeMemberWorkspaceIds
}: OrganizationProfileInput): Result<OrganizationProfile, OrganizationProfileError> => {
  if (!principal.userId.trim()) return err({ kind: "invalid-principal" });
  if (!organization) return err({ kind: "organization-not-found" });

  const isOwner = principal.userId === organization.ownerId;
  const memberWorkspaceIdSet = new Set(activeMemberWorkspaceIds);
  const visibleWorkspaces = workspaces
    .filter(workspace => isOwner || memberWorkspaceIdSet.has(workspace.id))
    .map(({ id, name, state, activeMemberCount }) => Object.freeze({ id, name, state, activeMemberCount }));

  if (!isOwner && visibleWorkspaces.length === 0) return err({ kind: "forbidden" });

  const profile: OrganizationProfile = {
    ...organization,
    workspaces: Object.freeze([...visibleWorkspaces])
  };

  return ok(Object.freeze(profile));
};
