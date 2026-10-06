import type { ReactElement } from "react";
import { Settings2 } from "lucide-react";
import { PageHeader, PageShell } from "@workspace/ui";

const OrganizationSettingPage = (): ReactElement => (
  <PageShell>
    <PageHeader
      description="View the organization’s settings and where each value comes from."
      eyebrow="Workspace"
      icon={<Settings2 aria-hidden="true" className="size-5" />}
      title="Organization settings"
    />
  </PageShell>
);

export default OrganizationSettingPage;
