export const USER_PROFILE_COLLECTION = "user_profiles";
export const USER_PROFILE_VIEW_INDEX_NAME = "workspace_user_profile_updated_at";
export const USER_PROFILE_VIEW_INDEX_KEYS = Object.freeze({
  workspaceId: 1,
  userProfileId: 1,
  updatedAt: 1
} as const);

export type UserProfileRecord = Readonly<{
  userProfileId: string;
  userId: string;
  workspaceId: string;
  name: string;
  updatedAt: Date;
  version: number;
  deletedAt: Date | null;
}>;

export type UserProfileDocument = Readonly<{
  userProfileId: string;
  userId: string;
  workspaceId: string;
  name: string;
  version: number;
  deletedAt: Date | null;
}>;

export type UserProfile = Readonly<{ name: string }>;

export type UserProfileQuery = Readonly<{
  userProfileId: string;
  deletedAt: null;
  workspaceId: string;
}>;
