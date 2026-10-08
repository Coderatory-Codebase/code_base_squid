import { createApplicationError } from "../../../errors/index.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import type { OrganizationGateway } from "../db/organization.gateway.js";
import type { PolicyDecision } from "../policies/organization.policy.js";
import type { OrganizationSummary, Principal } from "../types.js";

export type CreateOrganizationCommand = Readonly<{
  principal: Principal;
  name: string;
  policyDecision?: PolicyDecision;
}>;

export type OrganizationCommandBus = Readonly<{
  dispatch: (command: CreateOrganizationCommand) => Promise<OrganizationSummary>;
}>;

export const createOrganizationCommandBus = (gateway: OrganizationGateway): OrganizationCommandBus => ({
  dispatch: async (command) => {
    const decision = command.policyDecision;
    if (!decision || !decision.allowed || decision.action !== "organization:create" || decision.subjectId !== command.principal.userId) {
      throw createApplicationError({
        code: ERROR_CODES.forbidden,
        message: ERROR_MESSAGES.forbidden,
        status: HTTP_STATUS.forbidden
      }) as Error;
    }
    const organization = await gateway.createOrganizationForPrincipal(command.principal, command.name);
    return { id: String(organization._id), name: organization.name };
  }
});
