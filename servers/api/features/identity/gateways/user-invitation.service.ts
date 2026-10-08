import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { canInviteToWorkspace } from "./user-invitation.policy.js";
import type { UserInvitationGateway } from "./user-invitation.gateway.js";
import type { InvitationCommandInput, Principal } from "../types/index.js";

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

export interface InvitationOperationSignal {
  readonly module: "identity";
  readonly operation: "invite-to-workspace";
  readonly outcome: "succeeded" | "refused" | "failed";
  readonly workspaceId: string;
  readonly actorId: string;
  readonly reason?: InvitationCommandFailure;
}

export interface InvitationServiceDependencies {
  readonly gateway: Pick<UserInvitationGateway, "findPendingByEmail" | "createPending" | "replacePending">;
  readonly now: () => Date;
  readonly createToken: () => string;
  readonly createInvitationUrl: (token: string) => string;
  readonly auditRefusal: (event: InvitationAuditEvent) => Promise<void>;
  readonly emitOperationSignal: (signal: InvitationOperationSignal) => void;
}

export interface InvitationCommandResult {
  readonly invitationUrl: string;
  readonly expiresAt: Date;
}

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

const isPendingInvitationUniqueConflict = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== 11000) return false;
  if (!("keyPattern" in error) || typeof error.keyPattern !== "object" || error.keyPattern === null) return false;
  return "workspaceId" in error.keyPattern && "email" in error.keyPattern;
};

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
  auditRefusal,
  emitOperationSignal
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
      emitOperationSignal({
        module: "identity",
        operation: "invite-to-workspace",
        outcome: "refused",
        workspaceId: principal.workspaceId,
        actorId: principal.userId,
        reason: "forbidden"
      });
      throw new InvitationCommandError("forbidden");
    }

    const parsedInput = invitationInputSchema.safeParse(input);
    if (!parsedInput.success) {
      emitOperationSignal({
        module: "identity",
        operation: "invite-to-workspace",
        outcome: "refused",
        workspaceId: principal.workspaceId,
        actorId: principal.userId,
        reason: "invalid-email"
      });
      throw new InvitationCommandError("invalid-email");
    }

    const email = parsedInput.data.email.toLowerCase();
    const token = createToken();
    const expiresAt = createExpiry(now());
    const pendingInvitation = {
      email,
      role: parsedInput.data.role,
      tokenHash: hashToken(token),
      expiresAt
    };
    const existing = await gateway.findPendingByEmail(principal, email);

    if (existing) {
      const replacement = await gateway.replacePending(principal, email, pendingInvitation);
      if (!replacement) throw new InvitationCommandError("duplicate-invitation");
    } else {
      try {
        await gateway.createPending(principal, pendingInvitation);
      } catch (error: unknown) {
        // The pending-email partial unique index is the concurrency boundary. If
        // another invite won the insert race, replace that pending record so the
        // earlier token becomes invalid and only one pending invitation remains.
        if (!isPendingInvitationUniqueConflict(error)) throw error;
        const replacement = await gateway.replacePending(principal, email, pendingInvitation);
        if (!replacement) throw new InvitationCommandError("duplicate-invitation");
      }
    }

    emitOperationSignal({
      module: "identity",
      operation: "invite-to-workspace",
      outcome: "succeeded",
      workspaceId: principal.workspaceId,
      actorId: principal.userId
    });

    return Object.freeze({ invitationUrl: createInvitationUrl(token), expiresAt });
  };

  return Object.freeze({ invite });
};
