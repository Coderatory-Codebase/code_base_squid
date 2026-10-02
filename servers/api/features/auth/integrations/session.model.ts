import mongoose, { Schema } from "mongoose";

export type SessionDocument = Readonly<{
  sessionId: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}>;

const sessionSchema = new Schema<SessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true }
);

export const SessionModel = mongoose.models.Session ?? mongoose.model<SessionDocument>("Session", sessionSchema, "sessions");
