export type TemporaryWorkspaceBranding = Readonly<{
  organizationId: string;
  organizationName?: string;
  workspaceName?: string;
  logoUrl: string | null;
  accentColor: string | null;
}>;

export type TemporaryBrandingReader = Readonly<{
  listForWorkspace: (workspaceId: string) => Promise<readonly TemporaryWorkspaceBranding[]>;
}>;

export type TemporaryBrandingGateway = Readonly<{
  listForWorkspace: (principal: Readonly<{ workspaceId: string }>) => Promise<readonly TemporaryWorkspaceBranding[]>;
}>;

export const createTemporaryBrandingGateway = ({
  reader
}: Readonly<{ reader: TemporaryBrandingReader }>): TemporaryBrandingGateway => Object.freeze({
  listForWorkspace: (principal) => reader.listForWorkspace(principal.workspaceId)
});

