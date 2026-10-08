import type { UserInvitation } from "../models/index.js";
import type { Principal, InvitationQueryOptions, PendingInvitationInput } from "../types/index.js";

export type UserInvitationScope = Pick<Principal, "userId" | "workspaceId">;

/**
 * Gateway for scoped user-invitation queries.
 * Automatically appends caller's workspaceId filter and excludes soft-deleted records.
 *
 * ADR-005: Gateway enforces tenant isolation at the data access boundary.
 */

export interface UserInvitationGateway {
  readonly findByPrincipal: (
    principal: UserInvitationScope,
    options?: InvitationQueryOptions
  ) => Promise<readonly UserInvitation[]>;

  readonly findOneByEmail: (
    principal: Principal,
    email: string
  ) => Promise<UserInvitation | null>;
  readonly findPendingByEmail: (
    principal: Principal,
    email: string
  ) => Promise<UserInvitation | null>;
  readonly createPending: (
    principal: Principal,
    input: PendingInvitationInput
  ) => Promise<UserInvitation>;
  readonly replacePending: (
    principal: Principal,
    email: string,
    input: PendingInvitationInput
  ) => Promise<UserInvitation | null>;
  readonly revokePending: (principal: UserInvitationScope, invitationId: string) => Promise<boolean>;
  readonly resendPending: (
    principal: UserInvitationScope,
    invitationId: string,
    input: Pick<PendingInvitationInput, "tokenHash" | "expiresAt">
  ) => Promise<boolean>;
}
