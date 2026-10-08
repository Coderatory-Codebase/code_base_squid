import type { PolicyEvaluator, Principal } from "../../../kernel/index.js";

export const USER_INVITATIONS_LIST_COMMAND = "identity.user-invitations.list";
export const USER_INVITATIONS_CREATE_COMMAND = "identity.user-invitations.create";
export const USER_INVITATIONS_REVOKE_COMMAND = "identity.user-invitations.revoke";
export const USER_INVITATIONS_RESEND_COMMAND = "identity.user-invitations.resend";

const invitationCommands = new Set([
  USER_INVITATIONS_LIST_COMMAND,
  USER_INVITATIONS_CREATE_COMMAND,
  USER_INVITATIONS_REVOKE_COMMAND,
  USER_INVITATIONS_RESEND_COMMAND
]);

export const createIdentityPolicyEvaluator = ({
  resolveActor
}: Readonly<{
  resolveActor: (principal: Principal) => Promise<Readonly<{ role: string; guest: boolean }> | null>;
}>): PolicyEvaluator =>
  async ({ principal, commandName }) => {
    if (!invitationCommands.has(commandName)) {
      return Object.freeze({ effect: "deny", reason: "unknown-command" });
    }
    const actor = await resolveActor(principal);
    if (!actor || actor.guest) return Object.freeze({ effect: "deny", reason: "insufficient-role" });

    const role = actor.role.trim().toLowerCase();
    return role === "owner" || role === "admin"
      ? Object.freeze({ effect: "allow" })
      : Object.freeze({ effect: "deny", reason: "insufficient-role" });
  };

export type InvitationPolicyPrincipal = Principal;
