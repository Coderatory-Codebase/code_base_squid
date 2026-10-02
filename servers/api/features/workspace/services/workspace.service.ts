import type { WorkspaceRepository } from "../workspace.repository.js";
import type { Principal, OrganizationProfile } from "../types.js";

export type WorkspaceServiceDependencies = Readonly<{
  repository: Pick<WorkspaceRepository, "findOrganizationProfile">;
}>;

export type WorkspaceService = Readonly<{
  getOrganizationProfile: (principal: Principal, orgId: string) => Promise<OrganizationProfile | null>;
}>;

export const createWorkspaceService = ({ repository }: WorkspaceServiceDependencies): WorkspaceService => ({
  getOrganizationProfile: (principal: Principal, orgId: string) => repository.findOrganizationProfile(principal, orgId)
});
