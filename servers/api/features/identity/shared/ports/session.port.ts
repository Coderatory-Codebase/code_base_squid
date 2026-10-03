import type { ActiveSession } from "../models/session.js";

export type SessionQueryPort = Readonly<{
  findAndTouchActiveByTokenHash: (tokenHash: string, now: Date) => Promise<ActiveSession | null>;
}>;