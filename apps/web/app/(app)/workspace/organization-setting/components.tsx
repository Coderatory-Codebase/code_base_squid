import { AlertCircle, Building2 } from "lucide-react";
import type { OrganizationSettings } from "@/lib/api/organization-settings";
import type { OrganizationSettingUpdateActionResult } from "../_actions/organization-setting.action";
import { OrganizationSettingsEditor } from "./organization-settings-editor";

type UpdateOrganizationSettings = (input: unknown) => Promise<OrganizationSettingUpdateActionResult>;

const settingsRows = (settings: OrganizationSettings) => [
  ["Time zone", settings.timeZone],
  ["Week starts", settings.weekStart],
  ["Date format", settings.dateFormat],
  ["Workspace setup", settings.workspaceSetupRule]
] as const;

export const OrganizationSettingsList = ({
  settings,
  updateSettings
}: {
  readonly settings: readonly OrganizationSettings[];
  readonly updateSettings?: UpdateOrganizationSettings;
}) => (
  <section aria-labelledby="organization-settings-heading" className="space-y-4">
    <h2 id="organization-settings-heading" className="text-lg font-semibold">
      Organization defaults
    </h2>
    <p className="text-sm text-muted-foreground">
      Only the organization owner can change these settings.
    </p>
    {settings.map((organization, index) => (
      <article key={organization.organizationId ?? index} className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 font-semibold">{organization.name ?? "Organization"}</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          {settingsRows(organization).map(([label, setting]) => (
            <div key={label} className="space-y-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-medium">
                {setting.value}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Set by {setting.source === "owner" ? "the owner" : "default"}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        {organization.canUpdate === true
          && organization.organizationId
          && organization.version !== undefined
          && updateSettings
          ? <OrganizationSettingsEditor organization={organization} updateSettings={updateSettings} />
          : null}
      </article>
    ))}
  </section>
);

export const EmptyState = () => (
  <section className="rounded-lg border bg-card p-10 text-center">
    <Building2 aria-hidden="true" className="mx-auto mb-4 size-10 text-primary" />
    <h2 className="text-lg font-semibold">No organization settings found</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
      Settings will appear here when an organization is available to your workspace.
    </p>
    <a className="mt-4 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4" href="/workspace/organization/new">
      <Building2 aria-hidden="true" className="size-4" />
      Set up an organization
    </a>
  </section>
);

export const ErrorState = ({ error }: { readonly error: unknown }) => {
  const detail = error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <section aria-live="polite" className="rounded-lg border border-destructive/50 bg-destructive/10 p-8">
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <h2 className="font-semibold">Could not load organization settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Refreshing the page retries the server request.
          </p>
          <a className="mt-3 inline-block text-sm font-medium underline underline-offset-4" href="/workspace/organization-setting">
            Retry
          </a>
        </div>
      </div>
    </section>
  );
};

export const OrganizationSettingsSkeleton = () => (
  <section aria-label="Loading organization settings" className="rounded-lg border bg-card p-6">
    <div className="mb-5 h-6 w-56 animate-pulse rounded bg-muted" />
    <div className="grid gap-4 sm:grid-cols-2">
      {["timezone", "week-start", "date-format", "workspace-rule"].map((item) => (
        <div key={item} className="h-16 animate-pulse rounded bg-muted" />
      ))}
    </div>
  </section>
);
