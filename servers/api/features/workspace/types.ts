export type Principal = Readonly<{
  userId: string;
}>;

export type OrganizationState =
  | Readonly<{ kind: "ACTIVE" }>
  | Readonly<{ kind: "ARCHIVED" }>
  | Readonly<{ kind: "DELETION_SCHEDULED"; effectiveOn: Date }>;

export type OrganizationProfile = Readonly<{
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  state: OrganizationState;
}>;
