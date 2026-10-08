import type { ReactElement } from "react";
import { Building2, CircleAlert, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { ApiOrganizationProfileResponse } from "@workspace/types";
import { MessageState, PageHeader, PageShell } from "@workspace/ui";
import { OrganizationWorkspaces } from "./organization-workspaces";

type OrganizationProfilePageProps = Readonly<{
  profile: ApiOrganizationProfileResponse;
  retryHref: string;
}>;

const formatDate = (value: string, locale: "en-GB" | "en-US" = "en-US"): string =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(value)
  );

const stateLabel = (profile: ApiOrganizationProfileResponse): string => {
  switch (profile.state.kind) {
    case "ACTIVE":
      return "Active";
    case "ARCHIVED":
      return "Archived";
    case "DELETION_SCHEDULED":
      return `Deletion scheduled — ${formatDate(profile.state.effectiveOn, "en-GB")}`;
    default:
      throw new Error("Unknown organization status.");
  }
};

const OrganizationOwnerUnavailable = ({ retryHref }: Readonly<{ retryHref: string }>): ReactElement => (
  <div>
    <h2 className="text-sm font-medium text-muted-foreground">Owner</h2>
    <p aria-atomic="true" aria-live="polite" className="mt-1 text-foreground" role="status">Owner: unavailable</p>
    <a
      href={retryHref}
      className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground"
    >
      <RotateCcw aria-hidden="true" className="size-4" />
      Retry
    </a>
  </div>
);

export const OrganizationProfilePage = ({ profile, retryHref }: OrganizationProfilePageProps): ReactElement => {
  const ownerDisplayName = profile.ownerDisplayName ?? profile.ownerName;
  const ownerUnavailable = profile.ownerUnavailable === true || profile.ownerDisplayName === null || profile.ownerName === null;
  const ownerValue = ownerDisplayName && ownerDisplayName.trim().length > 0
    ? ownerDisplayName
    : ownerUnavailable
      ? null
      : profile.ownerId;

  return (
    <PageShell>
      <PageHeader
        description="Organization profile"
        eyebrow="Organization"
        icon={<Building2 aria-hidden="true" className="size-5" />}
        title={profile.name}
      />
      <section aria-label="Organization details" className="grid gap-5 border-y border-border py-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Owner</h2>
          {ownerUnavailable || ownerValue === null ? (
            <OrganizationOwnerUnavailable retryHref={retryHref} />
          ) : (
            <p className="mt-1 break-all text-foreground">{ownerValue}</p>
          )}
        </div>
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Set up</h2>
          <p className="mt-1 text-foreground">
            <time dateTime={profile.createdAt}>
              {formatDate(profile.createdAt, "en-GB")}
            </time>
            <span className="sr-only">{new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(profile.createdAt))}</span>
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">State</h2>
          <p className="mt-1 text-foreground">{stateLabel(profile)}</p>
        </div>
      </section>
      <OrganizationWorkspaces retryHref={retryHref} workspaces={profile.workspaces} />
    </PageShell>
  );
};

export const OrganizationSignInRequired = (): ReactElement => (
  <MessageState
    description="Sign in to view this organization profile."
    eyebrow="401"
    icon={<CircleAlert aria-hidden="true" className="size-8 text-amber-700" />}
    title="Sign in required"
  />
);

type OrganizationProfileAnnouncementProps = Readonly<{
  action: ReactElement;
  description: string;
  eyebrow: string;
  icon: ReactElement;
  role: "alert" | "status";
  ariaLive: "assertive" | "polite";
  title: string;
}>;

const OrganizationProfileAnnouncement = ({
  action,
  ariaLive,
  description,
  eyebrow,
  icon,
  role,
  title
}: OrganizationProfileAnnouncementProps): ReactElement => (
  <PageShell className="justify-center" width="narrow">
    {icon}
    <p className="mt-5 text-sm font-semibold text-foreground">{eyebrow}</p>
    <h1 className="mt-3 text-2xl font-semibold text-foreground">{title}</h1>
    <p aria-atomic="true" aria-live={ariaLive} className="mt-3 text-muted-foreground" role={role}>{description}</p>
    {action}
  </PageShell>
);

export const OrganizationProfileUnavailable = (): ReactElement => (
  <OrganizationProfileAnnouncement
    action={<Link className="mt-6 inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium" href="/">Return to organizations</Link>}
    ariaLive="polite"
    description="This organization can’t be found or you don’t have access."
    eyebrow="Not found"
    icon={<CircleAlert aria-hidden="true" className="size-8 text-muted-foreground" />}
    role="status"
    title="Organization unavailable"
  />
);

export const OrganizationProfileLoadError = ({ retryHref }: Readonly<{ retryHref: string }>): ReactElement => (
  <OrganizationProfileAnnouncement
    action={<a className="mt-6 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium" href={retryHref}><RotateCcw aria-hidden="true" className="size-4" />Retry</a>}
    ariaLive="assertive"
    description="We couldn’t load the organization profile because the profile service is unavailable. Retrying may help."
    eyebrow="Load failed"
    icon={<CircleAlert aria-hidden="true" className="size-8 text-amber-700" />}
    role="alert"
    title="Organization profile unavailable"
  />
);
