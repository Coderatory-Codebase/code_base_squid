import type { UserProfileDocument, UserProfileQuery } from "../models/user-profile.js";

export type UserProfileQueryPort = Readonly<{
  findOne: (query: UserProfileQuery) => Promise<UserProfileDocument | null>;
}>;