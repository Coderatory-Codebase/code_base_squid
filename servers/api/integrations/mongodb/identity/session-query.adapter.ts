import type { Model } from "mongoose";
import {
  SESSION_LIFETIME_MS,
  type ActiveSession,
  type SessionQueryPort,
  type SessionRecord
} from "../../../features/identity/index.js";

export const createSessionQueryAdapter = (model: Model<SessionRecord>): SessionQueryPort => ({
  findAndTouchActiveByTokenHash: async (tokenHash, now): Promise<ActiveSession | null> => {
    const session = await model.findOneAndUpdate(
      { tokenHash, status: "ACTIVE", expiresAt: { $gt: now } },
      { $set: { lastUsedAt: now, expiresAt: new Date(now.getTime() + SESSION_LIFETIME_MS) } },
      { returnDocument: "after", projection: { sessionId: 1, userId: 1, _id: 0 } }
    ).lean().exec();
    if (session) return { sessionId: session.sessionId, userId: session.userId };

    await model.updateOne(
      { tokenHash, status: "ACTIVE", expiresAt: { $lte: now } },
      { $set: { status: "EXPIRED" } }
    ).exec();
    return null;
  },
  revokeActiveSession: async (sessionId: string, userId: string, now: Date): Promise<boolean> => {
    const result = await model.updateOne(
      { sessionId, userId, status: "ACTIVE", expiresAt: { $gt: now } },
      { $set: { status: "REVOKED" } }
    ).exec();
    return result.modifiedCount === 1;
  },
  listActiveByUserId: async (userId, now) => {
    const sessions = await model.find({ userId, status: "ACTIVE", expiresAt: { $gt: now } })
      .sort({ lastUsedAt: -1 })
      .select({ sessionId: 1, userId: 1, device: 1, lastUsedAt: 1, expiresAt: 1, _id: 0 })
      .lean().exec();
    return sessions.map((session) => ({
      sessionId: session.sessionId,
      userId: session.userId,
      device: session.device,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt
    }));
  }
});
