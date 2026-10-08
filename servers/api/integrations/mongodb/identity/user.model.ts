import type { Connection, Model } from "mongoose";
import { Schema } from "mongoose";
import { USER_COLLECTION, type IdentityUserRecord } from "../../../features/identity/index.js";

export const identityUserSchema = new Schema<IdentityUserRecord>(
  {
    userId: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    profileVersion: { type: Number, required: true, default: 0, min: 0 },
    provider: { type: String, required: true, enum: ["google", "microsoft"] },
    subject: { type: String, required: true },
    status: { type: String, required: true, enum: ["ACTIVE", "CLOSED"] },
    closedAt: { type: Date, default: null }
  },
  { timestamps: false, versionKey: false }
);

identityUserSchema.index({ email: 1 }, { unique: true, name: "users_by_email" });
identityUserSchema.index({ userId: 1 }, { unique: true, name: "users_by_user_id" });
identityUserSchema.index({ provider: 1, subject: 1 }, { unique: true, name: "users_by_provider_subject" });

export const createIdentityUserModel = (connection: Connection): Model<IdentityUserRecord> =>
  connection.model<IdentityUserRecord>("IdentityUser", identityUserSchema, USER_COLLECTION);
