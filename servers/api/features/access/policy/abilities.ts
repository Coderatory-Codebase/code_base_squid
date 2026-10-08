/** Abilities are named centrally; feature policy modules bind commands to them. */
export const abilities = Object.freeze({
  organizationSettingsUpdate: "organization.settings.update",
  workspaceInvitationManage: "workspace.invitation.manage"
} as const);

export type Ability = (typeof abilities)[keyof typeof abilities];
