import { createHash } from "node:crypto";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import { createCommandBus, createCommandFactory } from "../../../kernel/index.js";
import type { BusLogger, PolicyEvaluator, Principal } from "../../../kernel/index.js";
import type { InvitationCommandInput, InvitationQueryOptions, Principal as InvitationPrincipal } from "../types/index.js";
import type { UserInvitationGateway } from "./user-invitation.gateway.js";
import type { InvitationCommandResult } from "./user-invitation.service.js";
import {
  USER_INVITATIONS_CREATE_COMMAND,
  USER_INVITATIONS_LIST_COMMAND,
  USER_INVITATIONS_RESEND_COMMAND,
  USER_INVITATIONS_REVOKE_COMMAND
} from "../policies/user-invitation.policy.js";

export type InvitationListItem = Readonly<{
  id: string;
  email: string;
  status: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
}>;

const invitationNotFound = (): never => {
  const error = createApplicationError({ code: ERROR_CODES.notFound, message: ERROR_MESSAGES.notFound, status: HTTP_STATUS.notFound });
  throw Object.assign(new Error(error.message), error);
};

export const createUserInvitationQueryService = ({
  gateway,
  evaluatePolicy,
  logger,
  invite,
  now,
  createToken,
  createInvitationUrl
}: Readonly<{
  gateway: UserInvitationGateway;
  evaluatePolicy: PolicyEvaluator;
  logger: BusLogger;
  invite?: (principal: InvitationPrincipal, input: InvitationCommandInput) => Promise<InvitationCommandResult>;
  now?: () => Date;
  createToken?: () => string;
  createInvitationUrl?: (token: string) => string;
}>) => {
  const commandFactory = createCommandFactory({ evaluate: evaluatePolicy });
  const commandBus = createCommandBus({
    handlers: {
      [USER_INVITATIONS_LIST_COMMAND]: async (command) => {
        const options = command.payload as InvitationQueryOptions;
        const invitations = await gateway.findByPrincipal(command.principal, options);
        return Object.freeze(invitations.map(({ id, email, status, role, expiresAt, createdAt }) =>
          Object.freeze({ id, email, status, role, expiresAt, createdAt } satisfies InvitationListItem)
        ));
      },
      [USER_INVITATIONS_CREATE_COMMAND]: async (command) => {
        if (!invite) throw new Error("Invitation creation is not configured.");
        // This handler is reachable only after the central command policy allows the
        // authenticated, persisted owner/admin membership.
        const authorizedPrincipal: InvitationPrincipal = {
          ...command.principal,
          role: "admin",
          permissions: ["workspace:invite"]
        };
        return invite(authorizedPrincipal, command.payload as InvitationCommandInput);
      },
      [USER_INVITATIONS_REVOKE_COMMAND]: async (command) => {
        const { invitationId } = command.payload as { invitationId: string };
        const changed = await gateway.revokePending(command.principal, invitationId);
        if (!changed) invitationNotFound();
        return Object.freeze({ revoked: true });
      },
      [USER_INVITATIONS_RESEND_COMMAND]: async (command) => {
        const { invitationId } = command.payload as { invitationId: string };
        if (!now || !createToken || !createInvitationUrl) throw new Error("Invitation resend is not configured.");
        const token = createToken();
        const expiry = new Date(now());
        expiry.setUTCDate(expiry.getUTCDate() + 7);
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const changed = await gateway.resendPending(command.principal, invitationId, { tokenHash, expiresAt: expiry });
        if (!changed) invitationNotFound();
        return Object.freeze({ invitationUrl: createInvitationUrl(token), expiresAt: expiry });
      }
    },
    logger
  });

  return Object.freeze({
    list: async (principal: Principal, options: InvitationQueryOptions = {}): Promise<readonly InvitationListItem[]> => {
      const command = await commandFactory({ name: USER_INVITATIONS_LIST_COMMAND, payload: options, principal });
      return await commandBus.dispatch(command) as readonly InvitationListItem[];
    },
    invite: async (principal: Principal, input: InvitationCommandInput): Promise<InvitationCommandResult> => {
      const command = await commandFactory({ name: USER_INVITATIONS_CREATE_COMMAND, payload: input, principal });
      return await commandBus.dispatch(command) as InvitationCommandResult;
    },
    revoke: async (principal: Principal, invitationId: string): Promise<void> => {
      const command = await commandFactory({ name: USER_INVITATIONS_REVOKE_COMMAND, payload: { invitationId }, principal });
      await commandBus.dispatch(command);
    },
    resend: async (principal: Principal, invitationId: string): Promise<Readonly<{ invitationUrl: string; expiresAt: Date }>> => {
      const command = await commandFactory({ name: USER_INVITATIONS_RESEND_COMMAND, payload: { invitationId }, principal });
      return await commandBus.dispatch(command) as Readonly<{ invitationUrl: string; expiresAt: Date }>;
    }
  });
};
