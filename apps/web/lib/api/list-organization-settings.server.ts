import "server-only";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import {
  createOrganizationSettingsRequest,
  createOrganizationSettingsQuery,
  type OrganizationSettings
} from "./organization-settings";

export const listOrganizationSettings = (sessionToken: string): Promise<readonly OrganizationSettings[]> => {
  const api = createApiConfiguration(readWebEnvironment());
  return createOrganizationSettingsQuery(createOrganizationSettingsRequest(sessionToken))(api.baseUrl);
};
