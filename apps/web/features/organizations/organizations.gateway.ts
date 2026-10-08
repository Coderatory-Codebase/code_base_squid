import { createApiConfiguration, readWebEnvironment } from "@/config";

export type OrganizationSummary = Readonly<{ id: string; name: string }>;
export type OrganizationPage = Readonly<{
  organizations: readonly OrganizationSummary[];
  nextOffset: number | null;
}>;
export type OrganizationListResult =
  | Readonly<{ ok: true; organizations: readonly OrganizationSummary[]; nextOffset: number | null }>
  | Readonly<{ ok: false; message: string }>;

export type OrganizationsGatewayDependencies = Readonly<{
  getApiBaseUrl?: () => string;
  fetchApi?: typeof fetch;
}>;

const parseOrganizationPage = (value: unknown): OrganizationPage | null => {
  if (typeof value !== "object" || value === null || !("organizations" in value) || !Array.isArray(value.organizations)
    || !("nextOffset" in value) || (value.nextOffset !== null && (typeof value.nextOffset !== "number" || !Number.isSafeInteger(value.nextOffset) || value.nextOffset < 0))) return null;
  const organizations: OrganizationSummary[] = [];
  for (const item of value.organizations) {
    if (typeof item !== "object" || item === null || !("id" in item) || typeof item.id !== "string" || !("name" in item) || typeof item.name !== "string") return null;
    organizations.push({ id: item.id, name: item.name });
  }
  if (organizations.length > 50) return null;
  return { organizations, nextOffset: value.nextOffset };
};

export const createOrganizationsGateway = ({
  getApiBaseUrl = () => createApiConfiguration(readWebEnvironment()).baseUrl,
  fetchApi = fetch
}: OrganizationsGatewayDependencies = {}) => ({
  listOrganizations: async (sessionToken: string, offset = 0): Promise<OrganizationListResult> => {
    try {
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > 500_000) {
        return { ok: false, message: "The organization page offset is invalid." };
      }
      const url = new URL("/organizations", getApiBaseUrl());
      if (offset > 0) url.searchParams.set("offset", String(offset));
      const response = await fetchApi(url, {
        headers: { authorization: `Bearer ${sessionToken}` },
        cache: "no-store"
      });
      if (!response.ok) return { ok: false, message: `The organization query failed (HTTP ${response.status}).` };
      const page = parseOrganizationPage(await response.json());
      return page === null
        ? { ok: false, message: "The organization query returned an invalid response." }
        : { ok: true, ...page };
    } catch {
      return { ok: false, message: "The organization service could not be reached." };
    }
  }
});

export const listOrganizations = (sessionToken: string): Promise<OrganizationListResult> =>
  createOrganizationsGateway().listOrganizations(sessionToken);
