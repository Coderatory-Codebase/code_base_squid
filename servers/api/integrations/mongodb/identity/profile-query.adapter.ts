import type { Model } from "mongoose";
import type {
  UserProfileDocument,
  UserProfileQuery,
  UserProfileRecord
} from "../../../features/identity/index.js";
import type { IdentityUserRecord } from "../../../features/identity/index.js";
import type { UserProfileQueryPort } from "../../../features/identity/index.js";

export const createUserProfileQueryAdapter = (
  model: Model<UserProfileRecord>,
  users?: Model<IdentityUserRecord>
): UserProfileQueryPort => ({
  findOne: async (query: UserProfileQuery): Promise<UserProfileDocument | null> => {
    const profile = await model.findOne(query).sort({ updatedAt: -1 }).lean().exec();
    if (profile) {
      return {
        userProfileId: profile.userProfileId,
        userId: profile.userId,
        workspaceId: profile.workspaceId,
        name: profile.name,
        version: profile.version,
        deletedAt: profile.deletedAt
      };
    }

    // First sign-in creates the canonical Identity user in the same transaction as its session/outbox.
    // The principal resolver has already verified workspace membership; use the principal's user id
    // as the scoped fallback when a workspace profile projection has not been materialized.
    if (!users) return null;
    const user = await users.findOne({
      userId: query.userProfileId,
      status: "ACTIVE",
      closedAt: null
    }).select({ userId: 1, name: 1 }).lean().exec();
    if (!user) return null;

    return {
      userProfileId: user.userId,
      userId: user.userId,
      workspaceId: query.workspaceId,
      name: user.name,
      version: 0,
      deletedAt: null
    };
  }
});
