import type { ReactElement } from "react";
import { Building2, RotateCw } from "lucide-react";
import { Button } from "@workspace/ui";
import type { OrganizationListResult } from "./organizations.gateway";

type OrganizationResultsProps = Readonly<{ result: OrganizationListResult; createdId?: string }>;

export const OrganizationResults = ({ result, createdId }: OrganizationResultsProps): ReactElement => (
  <>
    {createdId && result.ok && result.organizations.some(({ id }) => id === createdId)
      ? <p aria-live="polite" className="rounded-md border border-primary/30 bg-card p-4 text-sm" role="status">Organization created. It is now available in your organization list.</p>
      : null}
    {!result.ok ? (
      <section aria-labelledby="organizations-error-title" className="rounded-xl border border-destructive/30 bg-card p-6">
        <h2 className="text-lg font-semibold" id="organizations-error-title">Organizations could not be loaded</h2>
        <p className="mt-2 text-sm text-muted-foreground">{result.message} No organization list is shown until the query succeeds.</p>
        <Button asChild className="mt-5">
          <a href="/workspace/organization"><RotateCw aria-hidden="true" className="size-4" />Try again</a>
        </Button>
      </section>
    ) : result.organizations.length === 0 ? (
      <section aria-labelledby="organizations-empty-title" className="rounded-xl border bg-card p-8 text-center">
        <Building2 aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold" id="organizations-empty-title">You don’t belong to an organization yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Set up an organization to start bringing your workspaces together.</p>
        <Button asChild className="mt-5"><a href="/workspace/organization/new">Set up an organization</a></Button>
      </section>
    ) : (
      <ul aria-label="Organizations" className="grid gap-3">
        {result.organizations.map((organization) => (
          <li className="rounded-xl border bg-card p-5" id={`organization-${organization.id}`} key={organization.id}>
            <h2 className="font-medium"><a className="underline-offset-4 hover:underline" href={`/workspace/dashboard/${encodeURIComponent(organization.id)}`}>{organization.name}</a></h2>
          </li>
        ))}
      </ul>
    )}
  </>
);
