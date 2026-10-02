export type ApiOrganizationState =
  | Readonly<{ kind: "ACTIVE" }>
  | Readonly<{ kind: "ARCHIVED" }>
  | Readonly<{ kind: "DELETION_SCHEDULED"; effectiveOn: string }>;

export type ApiOrganizationProfile = Readonly<{
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  state: ApiOrganizationState;
}>;

export type ApiOrganizationProfileResponse = ApiOrganizationProfile;
