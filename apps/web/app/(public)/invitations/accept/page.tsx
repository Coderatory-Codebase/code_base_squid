import type { ReactElement } from "react";
import { Button, PageHeader, PageShell } from "@workspace/ui";

type InvitationAcceptancePageProps = Readonly<{
  searchParams: Promise<Readonly<{ token?: string | readonly string[] }>>;
}>;

const InvitationAcceptancePage = async ({ searchParams }: InvitationAcceptancePageProps): Promise<ReactElement> => {
  const parameters = await searchParams;
  const token = typeof parameters.token === "string" ? parameters.token : undefined;

  if (!token) {
    return (
      <PageShell className="justify-center" width="narrow">
        <PageHeader
          description="This invitation link is incomplete. Ask the workspace administrator to send a new invitation."
          eyebrow="Invitation unavailable"
          title="We could not open this invitation"
        />
      </PageShell>
    );
  }

  const signInUrl = `/sign-in?${new URLSearchParams({ invitationToken: token }).toString()}`;
  return (
    <PageShell className="justify-center" width="narrow">
      <PageHeader
        description="Sign in with the email address that received the invitation to join the workspace."
        eyebrow="Workspace invitation"
        title="Join this workspace"
      />
      <section className="mt-8">
        <Button asChild className="min-h-11" size="lg">
          <a href={signInUrl}>Accept invitation</a>
        </Button>
      </section>
    </PageShell>
  );
};

export default InvitationAcceptancePage;
