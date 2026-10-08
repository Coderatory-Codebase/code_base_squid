import type { Principal, SessionQueryPort } from "./public.js";
import { systemClock } from "@workspace/kernel";
import type { Clock } from "@workspace/kernel";

export type ManagedSession = Readonly<{
  sessionId: string;
  device: string;
  lastUsedAt: Date;
  isCurrent: boolean;
}>;

export type SessionAudit = Readonly<{
  event: "identity.session.revoke";
  actorUserId: string;
  sessionId: string;
  outcome: "revoked" | "not_found" | "error";
}>;

export type IdentitySessionManager = Readonly<{
  list: (principal: Principal) => Promise<readonly ManagedSession[]>;
  revoke: (principal: Principal, sessionId: string) => Promise<boolean>;
}>;

export const createIdentitySessionManager = (
  sessions: SessionQueryPort,
  clock: Clock = systemClock
): IdentitySessionManager => Object.freeze({
  list: async (principal) => {
    const userSessions = await sessions.listActiveByUserId(principal.userId, new Date(clock.now()));
    return userSessions
      .filter((session) => session.userId === principal.userId)
      .map((session) => ({
        sessionId: session.sessionId,
        device: session.device,
        lastUsedAt: session.lastUsedAt,
        isCurrent: session.sessionId === principal.sessionId
      }));
  },
  revoke: (principal, sessionId) => sessions.revokeActiveSession(sessionId, principal.userId, new Date(clock.now()))
});
