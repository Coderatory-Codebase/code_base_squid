import type { Model } from "mongoose";
import type {
  IdentityUserRecord,
  UserProfileDocument,
  UserProfileQuery,
  UserProfileQueryPort,
  UserProfileUpdateResult
} from "../../../features/identity/index.js";

export const createUserProfileQueryAdapter = (users: Model<IdentityUserRecord>): UserProfileQueryPort => ({
  findOne: async (query: UserProfileQuery): Promise<UserProfileDocument | null> => {
    const user = await users.findOne({
      ...query
    }).select({ userId: 1, email: 1, name: 1, profileVersion: 1, _id: 0 }).lean().exec();
    if (!user) return null;

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      version: user.profileVersion ?? 0
    };
  },
  updateOne: async ({ query, name, expectedVersion }): Promise<UserProfileUpdateResult> => {
    const versionMatch = expectedVersion === 0
      ? { $or: [{ profileVersion: 0 }, { profileVersion: { $exists: false } }] }
      : { profileVersion: expectedVersion };
    const updated = await users.findOneAndUpdate(
      { ...query, ...versionMatch },
      { $set: { name, profileVersion: expectedVersion + 1 } },
      { returnDocument: "after", projection: { userId: 1, email: 1, name: 1, profileVersion: 1, _id: 0 } }
    ).lean().exec();
    if (updated) {
      return {
        kind: "updated",
        profile: { email: updated.email, name: updated.name, version: updated.profileVersion ?? expectedVersion + 1 }
      };
    }

    const current = await users.findOne(query)
      .select({ userId: 1, email: 1, name: 1, profileVersion: 1, _id: 0 })
      .lean()
      .exec();
    if (!current) return { kind: "not-found" };
    return {
      kind: "conflict",
      currentProfile: { email: current.email, name: current.name, version: current.profileVersion ?? 0 }
    };
  }
});
