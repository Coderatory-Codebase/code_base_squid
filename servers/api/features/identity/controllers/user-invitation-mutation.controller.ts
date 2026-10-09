import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";
import type { Principal } from "../../../kernel/index.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import type { InvitationCommandInput } from "../types/index.js";
import { InvitationCommandError } from "../gateways/index.js";

type PrincipalResolution = Readonly<{
  resolve: (authorizationHeader: string | undefined) => Promise<
    | Readonly<{ kind: "unauthenticated" }>
    | Readonly<{ kind: "no-active-workspace" }>
    | Readonly<{ kind: "workspace-selection-required" }>
    | Readonly<{ kind: "resolved"; principal: Principal }>
  >;
}>;

export type UserInvitationMutationDependencies = Readonly<{
  principalResolver: PrincipalResolution;
  invite: (principal: Principal, input: InvitationCommandInput) => Promise<Readonly<{ invitationUrl: string }>>;
  revoke: (principal: Principal, invitationId: string) => Promise<void>;
  resend: (principal: Principal, invitationId: string) => Promise<Readonly<{ invitationUrl: string; expiresAt: Date }>>;
}>;

const invitationSchema = z.object({ email: z.email().max(254), role: z.enum(["admin", "member"]) }).strict();
const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/iu);

const fail = (input: Parameters<typeof createApplicationError>[0]): Error =>
  Object.assign(new Error(input.message), createApplicationError(input));

export const createUserInvitationMutationController =
  ({ principalResolver, invite, revoke, resend }: UserInvitationMutationDependencies): RequestHandler =>
    async (request: Request, response: Response, next: NextFunction): Promise<void> => {
      try {
        const resolved = await principalResolver.resolve(request.headers.authorization);
        if (resolved.kind !== "resolved") {
          const unauthenticated = resolved.kind === "unauthenticated";
          const workspaceConflict = resolved.kind === "workspace-selection-required";
          next(fail({
            status: unauthenticated ? HTTP_STATUS.unauthorized : workspaceConflict ? HTTP_STATUS.conflict : HTTP_STATUS.forbidden,
            code: unauthenticated ? ERROR_CODES.unauthenticated : workspaceConflict ? ERROR_CODES.workspaceSelectionRequired : ERROR_CODES.noActiveWorkspace,
            message: unauthenticated ? ERROR_MESSAGES.unauthenticated : workspaceConflict ? ERROR_MESSAGES.workspaceSelectionRequired : ERROR_MESSAGES.noActiveWorkspace
          }));
          return;
        }

        if (request.method === "POST" && !request.params.invitationId) {
          const parsed = invitationSchema.safeParse(request.body);
          if (!parsed.success) {
            next(fail({ status: HTTP_STATUS.badRequest, code: ERROR_CODES.validation, message: ERROR_MESSAGES.validation }));
            return;
          }
          const result = await invite(resolved.principal, parsed.data);
          response.status(HTTP_STATUS.created).json(result);
          return;
        }

        const invitationId = objectIdSchema.safeParse(request.params.invitationId);
        if (!invitationId.success) {
          next(fail({ status: HTTP_STATUS.badRequest, code: ERROR_CODES.validation, message: ERROR_MESSAGES.validation }));
          return;
        }
        if (request.method === "DELETE") {
          await revoke(resolved.principal, invitationId.data);
          response.status(HTTP_STATUS.ok).json({ revoked: true });
          return;
        }
        if (request.method === "POST" && request.params.action === "resend") {
          response.status(HTTP_STATUS.ok).json(await resend(resolved.principal, invitationId.data));
          return;
        }
        next(fail({ status: HTTP_STATUS.notFound, code: ERROR_CODES.notFound, message: ERROR_MESSAGES.notFound }));
      } catch (error: unknown) {
        if (error instanceof InvitationCommandError) {
          const status = error.code === "forbidden" ? HTTP_STATUS.forbidden
            : error.code === "duplicate-invitation" ? HTTP_STATUS.conflict
              : HTTP_STATUS.badRequest;
          const code = error.code === "forbidden" ? ERROR_CODES.forbidden
            : error.code === "duplicate-invitation" ? ERROR_CODES.conflict
              : ERROR_CODES.validation;
          const message = error.code === "forbidden" ? ERROR_MESSAGES.forbidden
            : error.code === "duplicate-invitation" ? "A pending invitation could not be updated. Retry the operation."
              : ERROR_MESSAGES.validation;
          next(fail({ status, code, message }));
          return;
        }
        next(error);
      }
    };
