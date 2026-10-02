import { Suspense } from "react";
import { listInvitationItems } from "@/lib/api/user-invitation";
import {
  EmptyState,
  ErrorState,
  InvitationCard,
  InvitationListSkeleton
} from "./components";

type InvitationListResult =
  | Readonly<{ invitations: Awaited<ReturnType<typeof listInvitationItems>>; error?: never }>
  | Readonly<{ invitations?: never; error: unknown }>;

export default function UserInvitationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Team invitations</h1>
        <p className="mt-2 text-muted-foreground">
          Review invitations that are waiting for a response.
        </p>
      </header>
      <Suspense fallback={<InvitationListSkeleton />}>
        <InvitationList />
      </Suspense>
    </div>
  );
}

async function InvitationList() {
  const result = await loadInvitationList();

  if ("error" in result) return <ErrorState error={result.error} />;
  if (result.invitations.length === 0) return <EmptyState />;

  return (
    <section aria-labelledby="pending-invitations-heading" className="rounded-lg border bg-card p-6">
      <h2 id="pending-invitations-heading" className="mb-4 text-lg font-semibold">
        Pending invitations ({result.invitations.length})
      </h2>
      <ul className="space-y-3">
        {result.invitations.map((invitation) => (
          <li key={invitation.id}>
            <InvitationCard invitation={invitation} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const loadInvitationList = async (): Promise<InvitationListResult> => {
  try {
    return Object.freeze({ invitations: await listInvitationItems() });
  } catch (error: unknown) {
    return Object.freeze({ error });
  }
};
