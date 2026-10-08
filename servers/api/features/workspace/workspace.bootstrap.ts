import type { VerifiedIdentity } from "../identity/public.js";

export type VerifiedWorkspaceIdentity = VerifiedIdentity;

export type WorkspaceBootstrapDependencies<Transaction> = Readonly<{
  transaction: <Result>(operation: (transaction: Transaction) => Promise<Result>) => Promise<Result>;
  createUser: (
    input: Readonly<{ identity: VerifiedWorkspaceIdentity; idempotencyKey?: string }>,
    transaction: Transaction
  ) => Promise<Readonly<{ id: string }>>;
  resolveInvitation: (
    token: string,
    email: string,
    transaction: Transaction
  ) => Promise<
    | Readonly<{ status: "valid"; organizationId: string; workspaceId: string; role: string }>
    | Readonly<{ status: "expired"; senderName: string }>
    | Readonly<{ status: "missing" }>
  >;
  acceptInvitation: (
    input: Readonly<{ userId: string; organizationId: string; workspaceId: string; role: string; idempotencyKey: string }>,
    transaction: Transaction
  ) => Promise<void>;
  createOrganization: (
    input: Readonly<{ ownerId: string; name: string }>,
    transaction: Transaction
  ) => Promise<Readonly<{ id: string }>>;
  createWorkspace: (
    input: Readonly<{ organizationId: string; name: "General" }>,
    transaction: Transaction
  ) => Promise<void>;
  createOwnerMembership: (
    input: Readonly<{ userId: string; organizationId: string }>,
    transaction: Transaction
  ) => Promise<void>;
}>;

export type WorkspaceBootstrapResult =
  | Readonly<{ status: "invited"; userId: string; workspaceId: string; role: string }>
  | Readonly<{ status: "organization-created"; userId: string; organizationId: string }>
  | Readonly<{ status: "invitation-expired"; senderName: string; setupAvailable: true }>
  | Readonly<{ status: "invitation-not-found" }>;

export type WorkspaceBootstrapInput = Readonly<{
  identity: VerifiedWorkspaceIdentity;
  organizationName: string;
  invitationToken?: string | undefined;
  chooseOrganizationSetup?: boolean | undefined;
}>;

export const createWorkspaceBootstrap = <Transaction>(
  dependencies: WorkspaceBootstrapDependencies<Transaction>
) => async ({
  identity,
  organizationName,
  invitationToken,
  chooseOrganizationSetup = false
}: WorkspaceBootstrapInput): Promise<WorkspaceBootstrapResult> =>
  dependencies.transaction(async (transaction) => {
    if (invitationToken) {
      const invitation = await dependencies.resolveInvitation(invitationToken, identity.email, transaction);

      if (invitation.status === "missing") return { status: "invitation-not-found" };
      if (invitation.status === "expired" && !chooseOrganizationSetup) {
        return { status: "invitation-expired", senderName: invitation.senderName, setupAvailable: true };
      }

      const user = await dependencies.createUser({ identity, idempotencyKey: invitationToken }, transaction);
      if (invitation.status === "valid") {
        await dependencies.acceptInvitation({
          userId: user.id,
          organizationId: invitation.organizationId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
          idempotencyKey: invitationToken
        }, transaction);
        return { status: "invited", userId: user.id, workspaceId: invitation.workspaceId, role: invitation.role };
      }

      return createOrganizationForUser(dependencies, transaction, user.id, organizationName);
    }

    const user = await dependencies.createUser({ identity }, transaction);
    return createOrganizationForUser(dependencies, transaction, user.id, organizationName);
  });

const createOrganizationForUser = async <Transaction>(
  dependencies: WorkspaceBootstrapDependencies<Transaction>,
  transaction: Transaction,
  userId: string,
  organizationName: string
): Promise<WorkspaceBootstrapResult> => {
  const organization = await dependencies.createOrganization({ ownerId: userId, name: organizationName }, transaction);
  await dependencies.createWorkspace({ organizationId: organization.id, name: "General" }, transaction);
  await dependencies.createOwnerMembership({ userId, organizationId: organization.id }, transaction);
  return { status: "organization-created", userId, organizationId: organization.id };
};
