export type OrganizationBrandingRecord = Readonly<{
  organizationId: string;
  organizationName: string;
  workspaceName: string;
  workspaceId: string;
  logoUrl: string | null;
  accentColor: string | null;
}>;

export type WorkspacePrincipal = Readonly<{ workspaceId: string }>;

export type OrganizationBrandingGateway = Readonly<{
  findForWorkspace: (principal: WorkspacePrincipal) => Promise<readonly OrganizationBrandingRecord[]>;
}>;
