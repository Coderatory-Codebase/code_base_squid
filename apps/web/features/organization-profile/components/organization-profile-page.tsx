import type { ReactElement } from "react";
import { Building2, CircleAlert } from "lucide-react";
import type { ApiOrganizationProfileResponse } from "@workspace/types";
import { MessageState, PageHeader, PageShell } from "@workspace/ui";

type OrganizationProfilePageProps = Readonly<{
  profile: ApiOrganizationProfileResponse;
}>;

const stateLabel = (profile: ApiOrganizationProfileResponse): string => {
  switch (profile.state.kind) {
    case "ACTIVE":
      return "Active";
    case "ARCHIVED":
      return "Archived";
    case "DELETION_SCHEDULED":
      return "Deletion scheduled";
    default:
      throw new Error("Unknown organization status.");
  }
};

export const OrganizationProfilePage = ({ profile }: OrganizationProfilePageProps): ReactElement => (
  <PageShell>
    <PageHeader
      description="Organization profile"
      eyebrow="Organization"
      icon={<Building2 aria-hidden="true" className="size-5" />}
      title={profile.name}
    />
    <section aria-label="Organization details" className="grid gap-5 border-y border-border py-6 sm:grid-cols-2">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Owner ID</h2>
        <p className="mt-1 break-all text-foreground">{profile.ownerId}</p>
      </div>
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Setup date</h2>
        <p className="mt-1 text-foreground">
          <time dateTime={profile.createdAt}>
            {new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(profile.createdAt))}
          </time>
        </p>
      </div>
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Status</h2>
        <p className="mt-1 text-foreground">{stateLabel(profile)}</p>
      </div>
    </section>
  </PageShell>
);

export const OrganizationSignInRequired = (): ReactElement => (
  <MessageState
    description="Sign in to view this organization profile."
    eyebrow="401"
    icon={<CircleAlert aria-hidden="true" className="size-8 text-amber-700" />}
    title="Sign in required"
  />
);
