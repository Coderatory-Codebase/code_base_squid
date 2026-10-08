import type { RequestHandler } from "express";
import { z } from "zod";
import type { Principal as KernelPrincipal } from "../../../kernel/index.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import type { InvitationListItem } from "../gateways/index.js";
import type { InvitationQueryOptions } from "../types/index.js";

const statusSchema = z.enum(["pending", "accepted", "expired", "revoked"]);

export type UserInvitationListControllerDependencies = Readonly<{
  principalResolver: Readonly<{
    resolve: (authorizationHeader: string | undefined) => Promise<
      | Readonly<{ kind: "unauthenticated" }>
      | Readonly<{ kind: "no-active-workspace" }>
      | Readonly<{ kind: "workspace-selection-required" }>
      | Readonly<{ kind: "resolved"; principal: KernelPrincipal }>
    >;
  }>;
  list: (principal: KernelPrincipal, options?: InvitationQueryOptions) => Promise<readonly InvitationListItem[]>;
}>;

const principalError = (kind: "unauthenticated" | "no-active-workspace" | "workspace-selection-required") =>
  createApplicationError({
    code: kind === "unauthenticated" ? ERROR_CODES.unauthenticated : kind === "no-active-workspace" ? ERROR_CODES.noActiveWorkspace : ERROR_CODES.workspaceSelectionRequired,
    message: kind === "unauthenticated" ? ERROR_MESSAGES.unauthenticated : kind === "no-active-workspace" ? ERROR_MESSAGES.noActiveWorkspace : ERROR_MESSAGES.workspaceSelectionRequired,
    status: kind === "unauthenticated" ? HTTP_STATUS.unauthorized : kind === "no-active-workspace" ? HTTP_STATUS.forbidden : HTTP_STATUS.conflict
  });

type InvitationListRequest = Readonly<{
  headers: Readonly<{ authorization?: string }>;
  query: Readonly<Record<string, unknown>>;
}>;
type InvitationListResponse = Readonly<{
  status: (code: number) => InvitationListResponse;
  json: (body: unknown) => unknown;
}>;
type InvitationListNext = (error?: unknown) => void;

export const createUserInvitationListController = ({ principalResolver, list }: UserInvitationListControllerDependencies): RequestHandler => {
  const handler = async (request: InvitationListRequest, response: InvitationListResponse, next: InvitationListNext): Promise<void> => {
    try {
      const resolution = await principalResolver.resolve(request.headers.authorization);
      if (resolution.kind !== "resolved") {
        next(principalError(resolution.kind));
        return;
      }

      const statusParam = request.query.status;
      let options: InvitationQueryOptions = { status: "pending" };
      if (statusParam !== undefined) {
        if (typeof statusParam !== "string") {
          next(createApplicationError({ code: ERROR_CODES.validation, message: ERROR_MESSAGES.validation, status: HTTP_STATUS.badRequest }));
          return;
        }
        const parsedStatus = statusSchema.safeParse(statusParam);
        if (!parsedStatus.success) {
          next(createApplicationError({ code: ERROR_CODES.validation, message: ERROR_MESSAGES.validation, status: HTTP_STATUS.badRequest }));
          return;
        }
        options = Object.freeze({ status: parsedStatus.data });
      }

      const invitations = await list(resolution.principal, options);
      response.status(HTTP_STATUS.ok).json({ invitations });
    } catch (error: unknown) {
      next(error);
    }
  };
  return handler;
};
