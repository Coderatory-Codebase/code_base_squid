export type InvitationActionState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "failure"; message: string; field?: "email" }>
  | Readonly<{ status: "created"; inviteUrl: string; email: string; expiresAt: string }>;

export const initialInvitationActionState: InvitationActionState = { status: "idle" };
