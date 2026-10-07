export type UserProfileDocument = Readonly<{
  userId: string;
  email: string;
  name: string;
  version: number;
}>;

export type UserProfile = Readonly<{ email: string; name: string; version: number }>;
export type VersionedUserProfile = Readonly<{ email: string; name: string; version: number }>;
export type UserProfileUpdateResult =
  | Readonly<{ kind: "updated"; profile: VersionedUserProfile }>
  | Readonly<{ kind: "conflict"; currentProfile: VersionedUserProfile | null }>
  | Readonly<{ kind: "not-found" }>;

export type UserProfileQuery = Readonly<{
  userId: string;
  status: "ACTIVE";
  closedAt: null;
}>;
