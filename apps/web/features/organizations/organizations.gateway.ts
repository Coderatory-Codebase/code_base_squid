import { createApiConfiguration, readWebEnvironment } from "@/config";

export type OrganizationSummary = Readonly<{ id: string; name: string }>;
export type OrganizationListResult =
  | Readonly<{ ok: true; organizations: readonly OrganizationSummary[] }>
  | Readonly<{ ok: false; message: string }>;

export type OrganizationsGatewayDependencies = Readonly<{
  getApiBaseUrl?: () => string;
  fetchApi?: typeof fetch;
}>;

const parseOrganizations = (value: unknown): readonly OrganizationSummary[] | null => {
  if (!Array.isArray(value)) return null;
  const organizations: OrganizationSummary[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || !("id" in item) || typeof item.id !== "string" || !("name" in item) || typeof item.name !== "string") return null;
    organizations.push({ id: item.id, name: item.name });
  }
  return organizations;
};

export const createOrganizationsGateway = ({
  getApiBaseUrl = () => createApiConfiguration(readWebEnvironment()).baseUrl,
  fetchApi = fetch
}: OrganizationsGatewayDependencies = {}) => ({
  listOrganizations: async (sessionToken: string): Promise<OrganizationListResult> => {
    try {
      const response = await fetchApi(new URL("/organizations", getApiBaseUrl()), {
        headers: { authorization: `Bearer ${sessionToken}` },
        cache: "no-store"
      });
      if (!response.ok) return { ok: false, message: `The organization query failed (HTTP ${response.status}).` };
      const organizations = parseOrganizations(await response.json());
      return organizations === null
        ? { ok: false, message: "The organization query returned an invalid response." }
        : { ok: true, organizations };
    } catch {
      return { ok: false, message: "The organization service could not be reached." };
    }
  }
});

export const listOrganizations = (sessionToken: string): Promise<OrganizationListResult> =>
  createOrganizationsGateway().listOrganizations(sessionToken);
