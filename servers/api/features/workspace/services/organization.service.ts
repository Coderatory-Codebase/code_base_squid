import type { OrganizationGateway } from "../db/organization.gateway.js";
import type { OrganizationSummary, Principal } from "../types.js";
import { createOrganizationCommandBus } from "../commands/organization.command.js";
import { decideOrganizationCreation } from "../policies/organization.policy.js";

export type OrganizationService = Readonly<{
  listOrganizations: (principal: Principal) => Promise<readonly OrganizationSummary[]>;
  createOrganization: (principal: Principal, name: string) => Promise<OrganizationSummary>;
}>;

export const createOrganizationService = (gateway: OrganizationGateway): OrganizationService => {
  const commandBus = createOrganizationCommandBus(gateway);
  return {
    listOrganizations: async (principal) => {
    const organizations = await gateway.listOrganizationsForPrincipal(principal);
    return organizations.map((organization) => ({ id: String(organization._id), name: organization.name }));
    },
    createOrganization: (principal, name) => commandBus.dispatch({
      principal,
      name,
      policyDecision: decideOrganizationCreation(principal)
    })
  };
};
