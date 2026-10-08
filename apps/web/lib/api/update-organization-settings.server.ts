import "server-only";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import type { OrganizationSettingsPatch } from "./organization-settings";

export type OrganizationSettingUpdateInput = Readonly<{
  organizationId: string;
  expectedVersion: number;
  settings: OrganizationSettingsPatch;
}>;

export type OrganizationSettingsUpdateHttpResult = Readonly<{
  status: number;
  payload: unknown;
}>;

export const updateOrganizationSettings = async (
  sessionToken: string,
  input: OrganizationSettingUpdateInput,
  fetchApi: typeof fetch = fetch
): Promise<OrganizationSettingsUpdateHttpResult> => {
  const baseUrl = createApiConfiguration(readWebEnvironment()).baseUrl;
  const response = await fetchApi(
    new URL(`/organizations/${encodeURIComponent(input.organizationId)}/settings`, baseUrl),
    {
      method: "PATCH",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${sessionToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ expectedVersion: input.expectedVersion, settings: input.settings }),
      cache: "no-store"
    }
  );
  const payload: unknown = await response.json().catch(() => null);
  return { status: response.status, payload };
};
