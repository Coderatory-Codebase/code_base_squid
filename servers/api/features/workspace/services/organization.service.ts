import type { OrganizationGateway } from "../db/organization.gateway.js";
import type { OrganizationListSummary, OrganizationPage, OrganizationSummary, Principal } from "../types.js";
import { createOrganizationCommandBus } from "../commands/organization.command.js";
import { decideOrganizationCreation } from "../policies/organization.policy.js";

export type OrganizationService = Readonly<{
  listOrganizations: (principal: Principal, offset: number) => Promise<OrganizationPage<OrganizationListSummary>>;
  createOrganization: (principal: Principal, name: string) => Promise<OrganizationSummary>;
}>;

export const createOrganizationService = (gateway: OrganizationGateway): OrganizationService => {
  const commandBus = createOrganizationCommandBus(gateway);
  return {
    listOrganizations: async (principal, offset) => {
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > 500_000) {
        throw new RangeError("Organization list offset must be a non-negative safe integer no greater than 500000.");
      }
      const page = await gateway.listOrganizationsForPrincipal(principal, offset);
      return {
        organizations: page.organizations.map((organization) => ({
          id: String(organization._id),
          name: organization.name,
          status: organization.archivedAt ? "archived" : "active",
          archivedAt: organization.archivedAt ?? null
        })),
        nextOffset: page.nextOffset
      };
    },
    createOrganization: (principal, name) => commandBus.dispatch({
      principal,
      name,
      policyDecision: decideOrganizationCreation(principal)
    })
  };
};
