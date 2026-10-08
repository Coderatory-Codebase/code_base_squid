import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "@workspace/ui";
import { Building2 } from "lucide-react";
import { acceptOrganizationInvitation } from "@/features/organizations/team.actions";
import { InvalidInvitationLink } from "@/features/user-invitation-acceptance";

type AcceptInvitationPageProps = Readonly<{
  searchParams: Promise<Readonly<{ token?: string; error?: string }>>;
}>;

const AcceptInvitationPage = async ({ searchParams }: AcceptInvitationPageProps): Promise<ReactElement> => {
  const { token, error } = await searchParams;
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/u.test(token) || error === "invalid") return <InvalidInvitationLink />;
  const hasSession = (await cookies()).has("workspace_session");
  if (!hasSession) {
    const returnTo = `/workspace/invitations/accept?token=${encodeURIComponent(token)}`;
    redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return (
    <PageShell width="narrow">
      <PageHeader description="Join the organization using the email address this invitation was sent to." eyebrow="Organization invitation" icon={<Building2 aria-hidden="true" className="size-5" />} title="Accept invitation" />
      {error === "service"
        ? <p aria-live="polite" className="mb-4 text-sm text-destructive" role="alert">The invitation service could not be reached. Please try again.</p>
        : null}
      <form action={acceptOrganizationInvitation} className="grid gap-4 rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Invitation links expire after seven days and can only be used once by the matching account.</p>
        <input name="token" type="hidden" value={token} />
        <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Accept invitation</button>
      </form>
    </PageShell>
  );
};

export default AcceptInvitationPage;
