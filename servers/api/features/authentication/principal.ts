import type { Principal, ActiveSession } from "../identity/services/index.js";
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
  invalidateResolvedSession?: (sessionId: string) => void;
  now?: () => number;
  cacheTtlMs?: number;
}>;

export type PrincipalResolver = Readonly<{
  resolve: (cookieHeader: string | undefined) => Promise<PrincipalResolution>;
  invalidateSession: (sessionId: string) => void;
}>;

const DEFAULT_PRINCIPAL_CACHE_TTL_MS = 60_000;
const MAX_CACHED_PRINCIPALS = 10_000;

export const createPrincipalResolver = ({
  resolveSession,
  memberships,
  invalidateResolvedSession = () => undefined,
  now = Date.now,
  cacheTtlMs = DEFAULT_PRINCIPAL_CACHE_TTL_MS
}: PrincipalResolverDependencies): PrincipalResolver => {
  const cachedMemberships = new Map<string, Readonly<{ expiresAt: number; resolution: PrincipalResolution }>>();
  const resolve = async (cookieHeader: string | undefined): Promise<PrincipalResolution> => {
    const session = await resolveSession(cookieHeader);
    if (!session) return { kind: "unauthenticated" };

    const currentTime = now();
    const cache = cachedMemberships.get(session.sessionId);
    if (cache && cache.expiresAt > currentTime) return cache.resolution;
    if (cache) cachedMemberships.delete(session.sessionId);

    const activeMemberships = await memberships.activeMembershipsFor(session.userId);
    if (activeMemberships.length === 0) return { kind: "no-active-workspace" };
    if (activeMemberships.length > 1) return { kind: "workspace-selection-required" };
    const [membership] = activeMemberships;
    if (!membership) return { kind: "no-active-workspace" };

    const resolution: PrincipalResolution = {
      kind: "resolved",
      principal: {
        userId: session.userId,
        sessionId: session.sessionId,
        workspaceId: membership.workspaceId
      }
    };
    if (cachedMemberships.size >= MAX_CACHED_PRINCIPALS) {
      const oldestSessionId = cachedMemberships.keys().next().value;
      if (oldestSessionId) cachedMemberships.delete(oldestSessionId);
    }
    cachedMemberships.set(session.sessionId, { expiresAt: currentTime + cacheTtlMs, resolution });
    return resolution;
  };

  return Object.freeze({
    resolve,
    invalidateSession: (sessionId: string): void => {
      cachedMemberships.delete(sessionId);
      invalidateResolvedSession(sessionId);
    }
  });
};
