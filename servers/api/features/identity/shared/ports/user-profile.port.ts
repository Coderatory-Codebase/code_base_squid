import type { UserProfileDocument, UserProfileQuery, UserProfileUpdateResult } from "../models/user-profile.js";

export type UserProfileQueryPort = Readonly<{
  findOne: (query: UserProfileQuery) => Promise<UserProfileDocument | null>;
  updateOne: (input: Readonly<{ query: UserProfileQuery; name: string; expectedVersion: number }>) => Promise<UserProfileUpdateResult>;
}>;
