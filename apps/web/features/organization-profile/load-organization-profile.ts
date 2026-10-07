import type { ApiOrganizationProfileResponse, ApiOrganizationWorkspace } from "@workspace/types";

export type OrganizationProfileResult =
  | Readonly<{ kind: "profile"; profile: ApiOrganizationProfileResponse }>
  | Readonly<{ kind: "unauthorized" }>
  | Readonly<{ kind: "error" }>
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

const isOrganizationWorkspace = (value: unknown): value is ApiOrganizationWorkspace => {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.state === "ACTIVE" || value.state === "ARCHIVED") &&
    typeof value.activeMemberCount === "number" &&
    Number.isSafeInteger(value.activeMemberCount) &&
    value.activeMemberCount >= 0;
};

const isOrganizationProfile = (value: unknown): value is ApiOrganizationProfileResponse => {
  if (!isRecord(value) || !isRecord(value.state)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.ownerId !== "string" ||
    !isValidDateString(value.createdAt) ||
    typeof value.state.kind !== "string"
  ) return false;

  if (value.workspaces !== undefined &&
    (!Array.isArray(value.workspaces) || !value.workspaces.every(isOrganizationWorkspace))) return false;

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
  let response: Response;
  try { response = await fetcher(endpoint, { cache: "no-store" }); } catch { return { kind: "error" }; }

  if (response.status === 401) return { kind: "unauthorized" };
  if (response.status === 404) return null;
  if (response.status !== 200) return { kind: "error" };

  let body: unknown;
  try { body = await response.json(); } catch { return { kind: "error" }; }
  if (!isOrganizationProfile(body)) return { kind: "error" };
  return { kind: "profile", profile: body };
};
