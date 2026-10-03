import type { Connection, Model } from "mongoose";
import { Schema } from "mongoose";
import {
  USER_PROFILE_COLLECTION,
  USER_PROFILE_VIEW_INDEX_KEYS,
  USER_PROFILE_VIEW_INDEX_NAME,
  type UserProfileRecord
} from "../../../features/identity/index.js";

export const userProfileSchema = new Schema<UserProfileRecord>(
  {
    userProfileId: { type: String, required: true },
    userId: { type: String, required: true },
    workspaceId: { type: String, required: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    updatedAt: { type: Date, required: true },
    version: { type: Number, required: true, default: 0, min: 0 },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    versionKey: "version",
    optimisticConcurrency: true
  }
);

userProfileSchema.index(USER_PROFILE_VIEW_INDEX_KEYS, { name: USER_PROFILE_VIEW_INDEX_NAME });

export const createUserProfileModel = (connection: Connection): Model<UserProfileRecord> =>
  connection.model<UserProfileRecord>("UserProfile", userProfileSchema, USER_PROFILE_COLLECTION);