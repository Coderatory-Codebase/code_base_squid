import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Button, PageHeader, PageShell } from "@workspace/ui";
import { Building2 } from "lucide-react";
import { createOrganization } from "@/features/auth/auth.actions";

type NewOrganizationPageProps = Readonly<{ searchParams: Promise<Readonly<{ error?: string }>> }>;

const NewOrganizationPage = async ({ searchParams }: NewOrganizationPageProps): Promise<ReactElement> => {
  const cookieStore = await cookies();
  if (!cookieStore.has("workspace_session")) redirect("/sign-in");
  const { error } = await searchParams;
  return (
    <PageShell width="narrow">
      <PageHeader description="Create an organization to group your workspaces." eyebrow="Organization setup" icon={<Building2 aria-hidden="true" className="size-5" />} title="Set up an organization" />
      <form action={createOrganization} className="grid gap-4 rounded-xl border bg-card p-6">
        {error ? <p aria-live="polite" className="text-sm text-destructive">{error === "name" ? "Enter an organization name." : "The organization could not be created. Try again."}</p> : null}
        <label className="grid gap-2 text-sm font-medium" htmlFor="name">
          Organization name
          <input autoComplete="organization" className="h-10 rounded-md border bg-background px-3 font-normal" id="name" maxLength={80} name="name" required />
        </label>
        <div className="flex items-center gap-3">
          <Button type="submit">Create organization</Button>
          <Button asChild variant="outline"><Link href="/workspace/organization">Cancel</Link></Button>
        </div>
      </form>
    </PageShell>
  );
};

export default NewOrganizationPage;
