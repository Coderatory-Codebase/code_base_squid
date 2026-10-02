import type { ReactElement } from "react";
import { Building2, RotateCw } from "lucide-react";
import { Button } from "@workspace/ui";
import type { OrganizationListResult } from "./organizations.gateway";

type OrganizationResultsProps = Readonly<{ result: OrganizationListResult }>;

export const OrganizationResults = ({ result }: OrganizationResultsProps): ReactElement => (
  <>
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
          <li className="rounded-xl border bg-card p-5" key={organization.id}>
            <h2 className="font-medium">{organization.name}</h2>
          </li>
        ))}
      </ul>
    )}
  </>
);
