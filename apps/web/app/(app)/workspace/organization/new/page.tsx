import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PageHeader, PageShell } from "@workspace/ui";
import { Building2 } from "lucide-react";
import { createOrganization } from "@/features/auth/auth.actions";
import { OrganizationSetupForm } from "@/features/organizations/organization-setup-form";

type NewOrganizationPageProps = Readonly<{ searchParams: Promise<Readonly<{ error?: string }>> }>;

const NewOrganizationPage = async ({ searchParams }: NewOrganizationPageProps): Promise<ReactElement> => {
  const cookieStore = await cookies();
  if (!cookieStore.has("workspace_session")) redirect("/sign-in");
  const { error } = await searchParams;
  return (
    <PageShell width="narrow">
      <PageHeader description="Create an organization to group your workspaces." eyebrow="Organization setup" icon={<Building2 aria-hidden="true" className="size-5" />} title="Set up an organization" />
      <OrganizationSetupForm action={createOrganization} error={error} />
    </PageShell>
  );
};

export default NewOrganizationPage;
