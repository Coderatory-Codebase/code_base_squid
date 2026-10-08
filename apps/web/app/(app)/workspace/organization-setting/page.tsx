import { Suspense } from "react";
import { Settings2 } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "@workspace/ui";
import { listOrganizationSettings } from "@/lib/api/list-organization-settings.server";
import { updateOrganizationSetting } from "../_actions/organization-setting.action";
import {
  EmptyState,
  ErrorState,
  OrganizationSettingsList,
  OrganizationSettingsSkeleton
} from "./components";

type SettingsResult =
  | Readonly<{ settings: Awaited<ReturnType<typeof listOrganizationSettings>>; error?: never }>
  | Readonly<{ settings?: never; error: unknown }>;

const OrganizationSettingPage = async () => {
  const sessionToken = (await cookies()).get("workspace_session")?.value;
  if (!sessionToken) redirect("/sign-in");

  return (
    <PageShell>
      <PageHeader
        description="View the organization’s settings and where each value comes from."
        eyebrow="Workspace"
        icon={<Settings2 aria-hidden="true" className="size-5" />}
        title="Organization settings"
      />
      <Suspense fallback={<OrganizationSettingsSkeleton />}>
        <OrganizationSettingsContent sessionToken={sessionToken} />
      </Suspense>
    </PageShell>
  );
};

const OrganizationSettingsContent = async ({ sessionToken }: { readonly sessionToken: string }) => {
  const result = await loadOrganizationSettings(sessionToken);

  if ("error" in result) return <ErrorState error={result.error} />;
  if (result.settings.length === 0) return <EmptyState />;

  return <OrganizationSettingsList settings={result.settings} updateSettings={updateOrganizationSetting} />;
};

const loadOrganizationSettings = async (sessionToken: string): Promise<SettingsResult> => {
  try {
    return Object.freeze({ settings: await listOrganizationSettings(sessionToken) });
  } catch (error: unknown) {
    return Object.freeze({ error });
  }
};

export default OrganizationSettingPage;
