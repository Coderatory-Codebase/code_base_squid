import type { WorkspaceRepository } from "../workspace.repository.js";
import type { OrganizationProfile } from "../types.js";
import type { OrganizationProfilePrincipal } from "../domain/organization-profile.js";

export type WorkspaceServiceDependencies = Readonly<{
  repository: Pick<WorkspaceRepository, "findOrganizationProfile">;
}>;

export type WorkspaceService = Readonly<{
  getOrganizationProfile: (principal: OrganizationProfilePrincipal, orgId: string) => Promise<OrganizationProfile | null>;
}>;

export const createWorkspaceService = ({ repository }: WorkspaceServiceDependencies): WorkspaceService => ({
  getOrganizationProfile: (principal: OrganizationProfilePrincipal, orgId: string) => repository.findOrganizationProfile(principal, orgId)
});
