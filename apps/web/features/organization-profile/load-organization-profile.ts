import type { ApiOrganizationProfileResponse } from "@workspace/types";

export type OrganizationProfileResult =
  | Readonly<{ kind: "profile"; profile: ApiOrganizationProfileResponse }>
  | Readonly<{ kind: "unauthorized" }>
  | null;

type LoadOrganizationProfileDependencies = Readonly<{
  apiBaseUrl: string;
  organizationId: string;
  fetcher?: typeof fetch;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isValidDateString = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const isOrganizationProfile = (value: unknown): value is ApiOrganizationProfileResponse => {
  if (!isRecord(value) || !isRecord(value.state)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.ownerId !== "string" ||
    !isValidDateString(value.createdAt) ||
    typeof value.state.kind !== "string"
  ) return false;

  if (value.state.kind === "ACTIVE" || value.state.kind === "ARCHIVED") return true;
  return value.state.kind === "DELETION_SCHEDULED" && isValidDateString(value.state.effectiveOn);
};

export const loadOrganizationProfile = async ({
  apiBaseUrl,
  organizationId,
  fetcher = fetch
}: LoadOrganizationProfileDependencies): Promise<OrganizationProfileResult> => {
  const endpoint = new URL(
    `workspace/organization-profile/${encodeURIComponent(organizationId)}`,
    `${apiBaseUrl.replace(/\/+$/, "")}/`
  );
  const response = await fetcher(endpoint, { cache: "no-store" });

  if (response.status === 401) return { kind: "unauthorized" };
  if (response.status === 404) return null;
  if (response.status !== 200) {
    throw new Error(`Organization profile request failed with status ${response.status}.`);
  }

  const body: unknown = await response.json();
  if (!isOrganizationProfile(body)) {
    throw new Error("The API returned an invalid organization profile response.");
  }
  return { kind: "profile", profile: body };
};
