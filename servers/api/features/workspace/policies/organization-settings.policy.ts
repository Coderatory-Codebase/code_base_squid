import { abilities, type Ability } from "../../access/public.js";
import type { PolicyEvaluator, Principal } from "../../../kernel/index.js";

export const ORGANIZATION_SETTINGS_UPDATE_COMMAND = "workspace.organization-settings.update";

export type OrganizationSettingsPolicyActor = Readonly<{
  kind: "user" | "api-key";
  role?: "owner" | "admin" | "member";
  guest: boolean;
}>;

export type OrganizationSettingsPolicyDecision =
  | Readonly<{ effect: "allow"; ability: Ability }>
  | Readonly<{
      effect: "deny";
      ability: Ability;
      reason: "unknown-command" | "guest" | "api-key" | "insufficient-role";
    }>;

/** Workspace owns the mapping from its command to the centrally named ability. */
export const workspaceCommandAbilities: Readonly<Record<string, Ability>> = Object.freeze({
  [ORGANIZATION_SETTINGS_UPDATE_COMMAND]: abilities.organizationSettingsUpdate
});

/** Organization defaults are managed by an authenticated, non-guest owner. */
export const decideOrganizationSettingsCommand = (
  commandName: string,
  actor: OrganizationSettingsPolicyActor
): OrganizationSettingsPolicyDecision => {
  const ability = workspaceCommandAbilities[commandName];
  if (!ability) {
    return Object.freeze({ effect: "deny", ability: abilities.organizationSettingsUpdate, reason: "unknown-command" });
  }
  if (actor.kind === "api-key") {
    return Object.freeze({ effect: "deny", ability, reason: "api-key" });
  }
  if (actor.guest) {
    return Object.freeze({ effect: "deny", ability, reason: "guest" });
  }
  if (actor.role !== "owner") {
    return Object.freeze({ effect: "deny", ability, reason: "insufficient-role" });
  }
  return Object.freeze({ effect: "allow", ability });
};

/** Resolves workspace membership context at the application boundary before authorizing. */
export const createWorkspacePolicyEvaluator = ({
  resolveActor
}: Readonly<{
  resolveActor: (principal: Principal) => Promise<OrganizationSettingsPolicyActor | null>;
}>): PolicyEvaluator => async ({ principal, commandName }) => {
  if (!workspaceCommandAbilities[commandName]) return { effect: "deny", reason: "unknown command" };
  const actor = await resolveActor(principal);
  if (!actor) return { effect: "deny", reason: "no workspace membership" };

  const decision = decideOrganizationSettingsCommand(commandName, actor);
  return decision.effect === "allow"
    ? { effect: "allow" }
    : { effect: "deny", reason: decision.reason };
};
