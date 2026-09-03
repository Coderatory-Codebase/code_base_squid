import { Session, type SessionDocument } from "./session.model.js";
import type { SessionSummary } from "./auth.contracts.js";

export async function createSession(
  userId: string,
  userAgent: string | undefined,
): Promise<SessionDocument> {
  return Session.create({ userId, userAgent });
}

export async function touchSession(sessionId: string): Promise<SessionDocument | null> {
  return Session.findByIdAndUpdate(
    sessionId,
    { lastUsedAt: new Date() },
    { returnDocument: "after" },
  );
}

export async function getOwnedSession(
  sessionId: string,
  userId: string,
): Promise<SessionDocument | null> {
  return Session.findOne({ _id: sessionId, userId });
}

export async function deleteSession(sessionId: string): Promise<void> {
  await Session.deleteOne({ _id: sessionId });
}

export async function deleteOtherSessions(userId: string, keepSessionId: string): Promise<void> {
  await Session.deleteMany({ userId, _id: { $ne: keepSessionId } });
}

export async function listSessions(
  userId: string,
  currentSessionId: string,
): Promise<SessionSummary[]> {
  const sessions = await Session.find({ userId }).sort({ lastUsedAt: -1 });
  return sessions.map((session) => ({
    id: session.id as string,
    userAgent: session.userAgent ?? null,
    createdAt: (session.createdAt as Date).toISOString(),
    lastUsedAt: (session.lastUsedAt as Date).toISOString(),
    isCurrent: (session.id as string) === currentSessionId,
  }));
}
