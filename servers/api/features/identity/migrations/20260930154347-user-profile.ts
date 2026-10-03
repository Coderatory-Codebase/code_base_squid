import {
  USER_PROFILE_COLLECTION,
  USER_PROFILE_VIEW_INDEX_KEYS,
  USER_PROFILE_VIEW_INDEX_NAME
} from "../shared/models/user-profile.js";

export type UserProfileMigrationDatabase = Readonly<{
  createCollection: (collectionName: string) => Promise<void>;
  createIndex: (
    collectionName: string,
    keys: Readonly<Record<string, 1 | -1>>,
    options: Readonly<{ name: string }>
  ) => Promise<void>;
  dropCollection: (collectionName: string) => Promise<void>;
}>;

export const up = async (database: UserProfileMigrationDatabase): Promise<void> => {
  await database.createCollection(USER_PROFILE_COLLECTION);
  await database.createIndex(
    USER_PROFILE_COLLECTION,
    USER_PROFILE_VIEW_INDEX_KEYS,
    { name: USER_PROFILE_VIEW_INDEX_NAME }
  );
};

export const down = async (database: UserProfileMigrationDatabase): Promise<void> => {
  await database.dropCollection(USER_PROFILE_COLLECTION);
};