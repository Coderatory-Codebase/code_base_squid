import type { Connection, Model } from "mongoose";
import { Schema } from "mongoose";
import { SESSION_COLLECTION, type SessionRecord } from "../../../features/identity/index.js";

export const sessionSchema = new Schema<SessionRecord>(
  {
    sessionId: { type: String, required: true },
    tokenHash: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: String, required: true, enum: ["ACTIVE", "EXPIRED", "REVOKED"] },
    lastUsedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    device: { type: String, required: true }
  },
  { timestamps: false, versionKey: false }
);

sessionSchema.index({ sessionId: 1 }, { unique: true, name: "sessions_by_id" });
sessionSchema.index({ tokenHash: 1 }, { unique: true, name: "sessions_by_token_hash" });
sessionSchema.index({ userId: 1 }, { name: "sessions_by_user" });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "sessions_expire_at" });

export const createSessionModel = (connection: Connection): Model<SessionRecord> =>
  connection.model<SessionRecord>("IdentitySession", sessionSchema, SESSION_COLLECTION);