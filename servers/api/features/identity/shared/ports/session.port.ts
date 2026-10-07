import type { ActiveSession, UserSession } from "../models/session.js";

export type SessionQueryPort = Readonly<{
  findAndTouchActiveByTokenHash: (tokenHash: string, now: Date) => Promise<ActiveSession | null>;
  listActiveByUserId: (userId: string, now: Date) => Promise<readonly UserSession[]>;
  revokeActiveSession: (sessionId: string, userId: string, now: Date) => Promise<boolean>;
}>;
