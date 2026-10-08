import type { OrganizationBrandingGateway, OrganizationBrandingRecord, WorkspacePrincipal } from "./contracts";

export type OrganizationBrandingPageData =
  | Readonly<{ kind: "ready"; organizations: readonly OrganizationBrandingRecord[]; selectedOrganization: OrganizationBrandingRecord | null }>
  | Readonly<{ kind: "empty" }>
  | Readonly<{ kind: "unavailable" }>;

type LoadOrganizationBrandingPageOptions = Readonly<{
  gateway: OrganizationBrandingGateway;
  principal: WorkspacePrincipal;
  organizationId?: string;
}>;

export const loadOrganizationBrandingPageData = async ({
  gateway,
  principal,
  organizationId
}: LoadOrganizationBrandingPageOptions): Promise<OrganizationBrandingPageData> => {
  try {
    const organizations = await gateway.findForWorkspace(principal);
    return selectOrganizationBrandingPageData(organizations, organizationId);
  } catch {
    return Object.freeze({ kind: "unavailable" });
  }
};

export const selectOrganizationBrandingPageData = (
  organizations: readonly OrganizationBrandingRecord[],
  organizationId?: string
): OrganizationBrandingPageData => {
  const selectedOrganization = organizationId
    ? organizations.find((organization) => organization.organizationId === organizationId) ?? null
    : organizations.at(0) ?? null;

  if (organizations.length === 0 || (organizationId && selectedOrganization === null)) {
    return Object.freeze({ kind: "empty" });
  }

  return Object.freeze({ kind: "ready", organizations, selectedOrganization });
};

export const getOrganizationInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter((word) => Boolean(word) && word !== "&");
  const initials = words.length > 1
    ? `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`
    : (words[0] ?? "").slice(0, 2);
  return initials.toLocaleUpperCase("en-US");
};
