export type WorkspacePrincipal = Readonly<{
  workspaceId: string;
}>;

export type OrganizationBranding = Readonly<{
  organizationId: string;
  logoUrl: string | null;
  accentColor: string | null;
}>;

export type OrganizationBrandingQuery = Readonly<{
  organizationId: string;
  deletedAt: null;
  workspaceId: string;
}>;

export type OrganizationBrandingReader = Readonly<{
  findMany: (query: OrganizationBrandingQuery) => Promise<readonly OrganizationBranding[]>;
}>;

type OrganizationBrandingGatewayDependencies = Readonly<{
  reader: OrganizationBrandingReader;
}>;

export type OrganizationBrandingGateway = Readonly<{
  findOrganizationBranding: (
    principal: WorkspacePrincipal,
    organizationId: string
  ) => Promise<readonly OrganizationBranding[]>;
}>;

export const createOrganizationBrandingGateway = ({
  reader
}: OrganizationBrandingGatewayDependencies): OrganizationBrandingGateway => Object.freeze({
  findOrganizationBranding: (principal, organizationId) => reader.findMany(Object.freeze({
    organizationId,
    deletedAt: null,
    workspaceId: principal.workspaceId
  }))
});
