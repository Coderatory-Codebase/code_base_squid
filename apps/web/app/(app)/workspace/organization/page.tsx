import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buttonVariants, PageHeader, PageShell } from "@workspace/ui";
import { Building2 } from "lucide-react";
import { signOut } from "@/features/auth/auth.actions";
import { listOrganizations } from "@/features/organizations/organizations.gateway";
import { OrganizationResults } from "@/features/organizations/organization-results";

type OrganizationListPageProps = Readonly<{ searchParams: Promise<Readonly<{ created?: string }>> }>;

const OrganizationListPage = async ({ searchParams }: OrganizationListPageProps): Promise<ReactElement> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("workspace_session")?.value;
  if (!token) redirect("/sign-in");
  const result = await listOrganizations(token);
  const { created } = await searchParams;
  return (
    <PageShell>
      <div className="flex items-start justify-between gap-4">
        <PageHeader description="Organizations you own or belong to through a workspace." eyebrow="Workspace" icon={<Building2 aria-hidden="true" className="size-5" />} title="Your organizations" />
        <form action={signOut}><button className={buttonVariants({ variant: "outline" })} type="submit">Sign out</button></form>
      </div>
      <OrganizationResults {...(created ? { createdId: created } : {})} result={result} />
    </PageShell>
  );
};

export default OrganizationListPage;
