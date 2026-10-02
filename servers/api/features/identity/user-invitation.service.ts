import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { canInviteToWorkspace } from "./user-invitation.policy.js";
import type { UserInvitationGateway } from "./user-invitation.gateway.js";
import type { InvitationCommandInput, Principal } from "./types.js";

const invitationInputSchema = z.object({
  email: z.email(),
  role: z.string().trim().min(1)
}) satisfies z.ZodType<InvitationCommandInput>;

export type InvitationCommandFailure = "forbidden" | "duplicate-invitation" | "invalid-email";

export class InvitationCommandError extends Error {
  public constructor(public readonly code: InvitationCommandFailure) {
    super(code);
  }
}

export interface InvitationAuditEvent {
  readonly type: "invitation.refused";
  readonly reason: "forbidden";
  readonly workspaceId: string;
  readonly actorId: string;
}

export interface InvitationServiceDependencies {
  readonly gateway: Pick<UserInvitationGateway, "findPendingByEmail" | "createPending">;
  readonly now: () => Date;
  readonly createToken: () => string;
  readonly createInvitationUrl: (token: string) => string;
  readonly auditRefusal: (event: InvitationAuditEvent) => Promise<void>;
}

export interface InvitationCommandResult {
  readonly invitationUrl: string;
}

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

const createExpiry = (now: Date): Date => {
  const expiry = new Date(now);
  expiry.setUTCDate(expiry.getUTCDate() + 7);
  return expiry;
};

export const createSecureInvitationToken = (): string => randomBytes(32).toString("base64url");

export const createInvitationService = ({
  gateway,
  now,
  createToken,
  createInvitationUrl,
  auditRefusal
}: InvitationServiceDependencies) => {
  const invite = async (
    principal: Principal,
    input: InvitationCommandInput
  ): Promise<InvitationCommandResult> => {
    if (!canInviteToWorkspace(principal)) {
      await auditRefusal({
        type: "invitation.refused",
        reason: "forbidden",
        workspaceId: principal.workspaceId,
        actorId: principal.userId
      });
      throw new InvitationCommandError("forbidden");
    }

    const parsedInput = invitationInputSchema.safeParse(input);
    if (!parsedInput.success) throw new InvitationCommandError("invalid-email");

    const email = parsedInput.data.email.toLowerCase();
    if (await gateway.findPendingByEmail(principal, email)) {
      throw new InvitationCommandError("duplicate-invitation");
    }

    const token = createToken();
    await gateway.createPending(principal, {
      email,
      role: parsedInput.data.role,
      tokenHash: hashToken(token),
      expiresAt: createExpiry(now())
    });

    return Object.freeze({ invitationUrl: createInvitationUrl(token) });
  };

  return Object.freeze({ invite });
};
