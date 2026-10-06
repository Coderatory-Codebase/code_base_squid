import type { UserInvitation } from "./user-invitation.model.js";
import { UserInvitationModel } from "./user-invitation.model.js";
import type { Principal, InvitationQueryOptions, PendingInvitationInput } from "./types.js";

/**
 * Gateway for scoped user-invitation queries.
 * Automatically appends caller's workspaceId filter and excludes soft-deleted records.
 *
 * ADR-005: Gateway enforces tenant isolation at the data access boundary.
 */

export interface UserInvitationGateway {
  readonly findByPrincipal: (
    principal: Principal,
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

}

const toUserInvitation = (document: UserInvitation): UserInvitation =>
  Object.freeze({
    workspaceId: document.workspaceId,
    email: document.email,
    invitedBy: document.invitedBy,
    tokenHash: document.tokenHash,
    status: document.status,
    role: document.role,
    expiresAt: document.expiresAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    ...(document.acceptedAt ? { acceptedAt: document.acceptedAt } : {}),
    ...(document.deletedAt ? { deletedAt: document.deletedAt } : {})
  });

export const createUserInvitationGateway = (): UserInvitationGateway => {
  const buildScopedFilter = (principal: Principal, additionalFilter: Record<string, unknown> = {}) => ({
    ...additionalFilter,
    // These constraints deliberately come last: no caller-provided filter can
    // widen a read beyond the principal's workspace or include soft-deleted data.
    workspaceId: principal.workspaceId,
    deletedAt: null
  });

  const gateway: UserInvitationGateway = {
    findByPrincipal: async (
      principal: Principal,
      options: InvitationQueryOptions = {}
    ): Promise<readonly UserInvitation[]> => {
      const filter = buildScopedFilter(principal, {
        ...(options.status && { status: options.status })
      });

      const query = UserInvitationModel.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      if (options.limit) {
        query.limit(options.limit);
      }
      if (options.skip) {
        query.skip(options.skip);
      }

      const results = await query.exec();

      return Object.freeze(results.map(toUserInvitation));
    },

    findOneByEmail: async (
      principal: Principal,
      email: string
    ): Promise<UserInvitation | null> => {
      const filter = buildScopedFilter(principal, {
        email: email.toLowerCase().trim()
      });

      const doc = await UserInvitationModel.findOne(filter).lean().exec();

      if (!doc) {
        return null;
      }

      return toUserInvitation(doc);
    },

    findPendingByEmail: async (
      principal: Principal,
      email: string
    ): Promise<UserInvitation | null> => {
      const filter = buildScopedFilter(principal, {
        email: email.toLowerCase().trim(),
        status: "pending"
      });
      const doc = await UserInvitationModel.findOne(filter).lean().exec();

      return doc ? toUserInvitation(doc) : null;
    },

    createPending: async (
      principal: Principal,
      input: PendingInvitationInput
    ): Promise<UserInvitation> => {
      const document = await UserInvitationModel.create({
        workspaceId: principal.workspaceId,
        email: input.email.toLowerCase().trim(),
        invitedBy: principal.userId,
        tokenHash: input.tokenHash,
        status: "pending",
        role: input.role,
        expiresAt: input.expiresAt
      });

      return toUserInvitation(document);
    },

    replacePending: async (
      principal: Principal,
      email: string,
      input: PendingInvitationInput
    ): Promise<UserInvitation | null> => {
      const document = await UserInvitationModel.findOneAndUpdate(
        buildScopedFilter(principal, {
          email: email.toLowerCase().trim(),
          status: "pending"
        }),
        {
          $set: {
            tokenHash: input.tokenHash,
            role: input.role,
            expiresAt: input.expiresAt
          }
        },
        { new: true }
      ).lean().exec();

      return document ? toUserInvitation(document) : null;
    },

  };

  return Object.freeze(gateway);
};
