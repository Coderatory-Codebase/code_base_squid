import { z } from "zod";

const invitationEmailSchema = z.email().max(254);

export type InvitationEmailValidation =
  | Readonly<{ ok: true; email: string }>
  | Readonly<{ ok: false }>;

export const validateInvitationEmail = (value: unknown): InvitationEmailValidation => {
  if (typeof value !== "string") return Object.freeze({ ok: false });
  const email = value.trim();
  return invitationEmailSchema.safeParse(email).success
    ? Object.freeze({ ok: true, email })
    : Object.freeze({ ok: false });
};
