import type { Principal, ActiveSession } from "../identity/public.js";
import type { WorkspaceMembershipPort } from "../workspace/public.js";

export type AuthenticatedSession = ActiveSession;

export type PrincipalResolution =
  | Readonly<{ kind: "unauthenticated" }>
  | Readonly<{ kind: "no-active-workspace" }>
  | Readonly<{ kind: "workspace-selection-required" }>
  | Readonly<{ kind: "resolved"; principal: Principal }>;

export type PrincipalResolverDependencies = Readonly<{
  resolveSession: (cookieHeader: string | undefined) => Promise<AuthenticatedSession | null>;
  memberships: WorkspaceMembershipPort;
}>;

export type PrincipalResolver = Readonly<{
  resolve: (cookieHeader: string | undefined) => Promise<PrincipalResolution>;
}>;

export const createPrincipalResolver = ({ resolveSession, memberships }: PrincipalResolverDependencies): PrincipalResolver => ({
  resolve: async (cookieHeader) => {
    const session = await resolveSession(cookieHeader);
    if (!session) return { kind: "unauthenticated" };

    const activeMemberships = await memberships.activeMembershipsFor(session.userId);
    if (activeMemberships.length === 0) return { kind: "no-active-workspace" };
    if (activeMemberships.length > 1) return { kind: "workspace-selection-required" };
    const [membership] = activeMemberships;
    if (!membership) return { kind: "no-active-workspace" };

    return {
      kind: "resolved",
      principal: {
        userId: session.userId,
        sessionId: session.sessionId,
        workspaceId: membership.workspaceId
      }
    };
  }
});
