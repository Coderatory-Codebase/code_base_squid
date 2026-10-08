import type {
  IdentityUserBootstrapResult,
  IdentityUserTransaction,
  IdentityUserProvisioningPort,
  VerifiedIdentity
} from "../identity/services/index.js";
import type { SignInCompletionPort, SignInCompletionResult } from "../identity/services/index.js";

export type WorkspaceBootstrapTransaction = IdentityUserTransaction & Readonly<{
  activeWorkspaceIdsFor: (userId: string) => Promise<readonly string[]>;
  createOrganization: (input: Readonly<{ organizationId: string; ownerId: string; name: string }>) => Promise<void>;
  createWorkspace: (input: Readonly<{ workspaceId: string; organizationId: string; name: string }>) => Promise<void>;
  createOwnerMembership: (input: Readonly<{ workspaceId: string; userId: string }>) => Promise<void>;
  resolveInvitation: (token: string, email: string) => Promise<Readonly<{ workspaceId: string; role: string }> | null>;
  acceptInvitation: (input: Readonly<{
    token: string;
    email: string;
    userId: string;
    workspaceId: string;
    role: string;
  }>) => Promise<void>;
}>;

export type WorkspaceBootstrapTransactionRunner = Readonly<{
  run: <T>(operation: (transaction: WorkspaceBootstrapTransaction) => Promise<T>) => Promise<T>;
}>;

export type WorkspaceBootstrapDependencies = Readonly<{
  transactionRunner: WorkspaceBootstrapTransactionRunner;
  identity: IdentityUserProvisioningPort;
  createId: () => string;
}>;

const bootstrapWorkspaceForNewUser = async (
  transaction: WorkspaceBootstrapTransaction,
  identity: VerifiedIdentity,
  result: Extract<IdentityUserBootstrapResult, { kind: "created" }>,
  createId: () => string
): Promise<string> => {
  const organizationId = createId();
  const workspaceId = createId();
  await transaction.createOrganization({
    organizationId,
    ownerId: result.user.userId,
    name: `${identity.displayName}'s organization`
  });
  await transaction.createWorkspace({
    workspaceId,
    organizationId,
    name: `${identity.displayName}'s workspace`
  });
  await transaction.createOwnerMembership({ workspaceId, userId: result.user.userId });
  return workspaceId;
};

export const createWorkspaceBootstrap = ({
  transactionRunner,
  identity,
  createId
}: WorkspaceBootstrapDependencies): SignInCompletionPort => ({
  complete: (verifiedIdentity: VerifiedIdentity, invitationToken?: string): Promise<SignInCompletionResult> =>
    transactionRunner.run(async (transaction) => {
      const invitation = invitationToken
        ? await transaction.resolveInvitation(invitationToken, verifiedIdentity.email)
        : null;
      const result = await identity.createUser(transaction, verifiedIdentity);
      if (result.kind === "account-closed") return result;
      if (invitation && invitationToken) {
        await transaction.acceptInvitation({
          token: invitationToken,
          email: verifiedIdentity.email,
          userId: result.user.userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role
        });
        return { kind: "signed-in", sessionToken: result.sessionToken, workspaceId: invitation.workspaceId };
      }
      let workspaceId: string | null = null;
      if (result.kind === "created") {
        workspaceId = await bootstrapWorkspaceForNewUser(transaction, verifiedIdentity, result, createId);
      } else {
        const workspaceIds = await transaction.activeWorkspaceIdsFor(result.user.userId);
        if (workspaceIds.length === 1) workspaceId = workspaceIds[0] ?? null;
      }
      return { kind: "signed-in", sessionToken: result.sessionToken, workspaceId };
    })
});
