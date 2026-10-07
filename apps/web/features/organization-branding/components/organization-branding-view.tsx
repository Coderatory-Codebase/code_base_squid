import type { ReactElement } from "react";
import { Building2, Layers3, RotateCw } from "lucide-react";
import { MessageState, PageHeader, PageShell } from "@workspace/ui";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/primitives";
import type { OrganizationBrandingPageData } from "../organization-branding-page-data";
import { getOrganizationInitials } from "../organization-branding-page-data";
import { OrganizationBrandingLogo } from "./organization-branding-logo";

type OrganizationBrandingViewProps = Readonly<{
  data: OrganizationBrandingPageData;
  organizationId?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
}>;

const retryHref = (organizationId?: string): string => organizationId
  ? `/workspace/organization-branding?organizationId=${encodeURIComponent(organizationId)}`
  : "/workspace/organization-branding";

const organizationHref = (organizationId: string): string =>
  `/workspace/organization-branding?organizationId=${encodeURIComponent(organizationId)}`;

export const OrganizationBrandingView = ({
  data,
  organizationId,
  emptyActionHref = "/workspace/organization-branding",
  emptyActionLabel = "Reload organization list"
}: OrganizationBrandingViewProps): ReactElement => {
  if (data.kind === "unavailable") {
    return (
      <MessageState
        action={<Button asChild className="mt-5"><a href={retryHref(organizationId)}><RotateCw aria-hidden="true" className="mr-2 size-4" />Try again</a></Button>}
        description="The organization branding service did not respond. Try again when it is available."
        eyebrow="Workspace branding"
        icon={<Building2 aria-hidden="true" className="size-7 text-muted-foreground" />}
        title="We couldn’t load this workspace."
      />
    );
  }

  if (data.kind === "empty") {
    return (
      <MessageState
        action={<Button asChild className="mt-5" variant="outline"><a href={emptyActionHref}>{emptyActionLabel}</a></Button>}
        description="There is no organization available for this selection. Check the selected organization or reload the list."
        eyebrow="Workspace branding"
        icon={<Building2 aria-hidden="true" className="size-7 text-muted-foreground" />}
        title="No organization found."
      />
    );
  }

  const selectedOrganization = data.selectedOrganization;
  if (!selectedOrganization) {
    return (
      <MessageState
        description="This workspace does not have any organizations yet."
        eyebrow="Workspace branding"
        icon={<Building2 aria-hidden="true" className="size-7 text-muted-foreground" />}
        title="No organizations yet."
      />
    );
  }

  const accentColor = selectedOrganization.accentColor ?? "#4B5563";

  return (
    <PageShell>
      <PageHeader
        description="Your organizations and their workspaces, with the right identity carried through each view."
        eyebrow="Workspace · Organization branding"
        icon={<Building2 aria-hidden="true" className="size-5" />}
        title="Your organizations"
      />

      <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section aria-labelledby="organizations-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Workspace directory</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground" id="organizations-heading">Organizations</h2>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{data.organizations.length} available</span>
          </div>

          <ul className="space-y-3">
            {data.organizations.map((organization) => {
              const organizationAccent = organization.accentColor ?? "#4B5563";
              const isSelected = organization.organizationId === selectedOrganization.organizationId;
              return (
                <li key={organization.organizationId}>
                  <a
                    aria-current={isSelected ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSelected ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
                    href={organizationHref(organization.organizationId)}
                  >
                    <OrganizationBrandingLogo accentColor={organizationAccent} initials={getOrganizationInitials(organization.organizationName)} logoUrl={organization.logoUrl} organizationName={organization.organizationName} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{organization.organizationName}</span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">{organization.workspaceName}</span>
                    </span>
                    <span aria-hidden="true" className="text-muted-foreground">›</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="workspace-heading">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Selected workspace</p>
          <Card className="overflow-hidden rounded-3xl border-border shadow-sm">
            <div className="h-2" style={{ backgroundColor: accentColor }} />
            <CardHeader className="gap-5 p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <OrganizationBrandingLogo accentColor={accentColor} initials={getOrganizationInitials(selectedOrganization.organizationName)} logoUrl={selectedOrganization.logoUrl} organizationName={selectedOrganization.organizationName} size="large" />
                <div className="min-w-0">
                  <CardDescription>Organization</CardDescription>
                  <CardTitle className="mt-1 truncate text-2xl" id="workspace-heading">{selectedOrganization.organizationName}</CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/70 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-background text-muted-foreground"><Layers3 aria-hidden="true" className="size-5" /></div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Workspace</p>
                  <p className="mt-1 font-medium text-foreground">{selectedOrganization.workspaceName}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <span className="text-sm text-muted-foreground">Organization accent</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground">
                  <span aria-hidden="true" className="size-3 rounded-full" style={{ backgroundColor: accentColor }} />
                  {accentColor}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageShell>
  );
};

