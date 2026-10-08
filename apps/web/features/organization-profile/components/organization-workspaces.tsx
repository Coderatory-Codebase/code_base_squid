"use client";

import type { ReactElement } from "react";
import type { ApiOrganizationWorkspace } from "@workspace/types";

type OrganizationWorkspacesProps = Readonly<{
  workspaces: readonly ApiOrganizationWorkspace[] | undefined;
  retryHref: string;
}>;

const workspaceStateLabel = (state: ApiOrganizationWorkspace["state"]): string =>
  state === "ACTIVE" ? "Active" : "Archived";

export const OrganizationWorkspaces = ({ workspaces, retryHref }: OrganizationWorkspacesProps): ReactElement => (
  <section aria-labelledby="organization-workspaces-heading" className="mt-8">
    <h2 className="text-lg font-semibold text-foreground" id="organization-workspaces-heading">Workspaces</h2>
    {workspaces === undefined ? (
      <div className="mt-3 rounded-md border border-border p-4">
        <p aria-atomic="true" aria-live="polite" role="status">
          Workspace details are unavailable right now. Retrying may help.
        </p>
        <a
          className="mt-3 inline-flex rounded-md border border-border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={retryHref}
        >
          Retry
        </a>
      </div>
    ) : workspaces.length === 0 ? (
      <p aria-live="polite" className="mt-3 text-muted-foreground" role="status">
        This organization has no workspaces yet.
      </p>
    ) : (
      <ul aria-label="Organization workspaces" className="mt-3 divide-y divide-border rounded-md border border-border">
        {workspaces.map(workspace => (
          <li className="grid gap-2 p-4 sm:grid-cols-3" key={workspace.id}>
            <h3 className="font-medium text-foreground">{workspace.name}</h3>
            <p>
              <span className="text-muted-foreground">State: </span>
              <span>{workspaceStateLabel(workspace.state)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Active members: </span>
              <span>{workspace.activeMemberCount}</span>
            </p>
          </li>
        ))}
      </ul>
    )}
  </section>
);
