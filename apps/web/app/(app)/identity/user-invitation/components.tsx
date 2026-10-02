import { AlertCircle, Clock, Mail, UserPlus } from "lucide-react";
import type { InvitationListItem } from "@/lib/api/user-invitation";

export const InvitationCard = ({ invitation }: { invitation: InvitationListItem }) => {
  const expiryDate = invitation.expiresAt.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });

  return (
    <article className="flex items-center justify-between rounded-lg border bg-background p-4">
      <div className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Mail aria-hidden="true" className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{invitation.email}</p>
          <p className="text-sm text-muted-foreground">Role: {invitation.role}</p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock aria-hidden="true" className="size-4" />
        Expires {expiryDate}
      </p>
    </article>
  );
};

export const EmptyState = () => (
  <section className="rounded-lg border bg-card p-12 text-center">
    <UserPlus aria-hidden="true" className="mx-auto mb-4 size-12 text-primary" />
    <h2 className="text-lg font-semibold">No pending invitations</h2>
    <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
      Invitations will appear here once they have been sent.
    </p>
  </section>
);

export const ErrorState = ({ error }: { error: unknown }) => {
  const detail = error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <section aria-live="polite" className="rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center">
      <AlertCircle aria-hidden="true" className="mx-auto mb-4 size-12 text-destructive" />
      <h2 className="text-lg font-semibold">Failed to load invitations</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{detail}</p>
      <p className="mt-4 text-sm text-muted-foreground">Refresh the page to try again.</p>
    </section>
  );
};

export const InvitationListSkeleton = () => (
  <section aria-label="Loading invitations" className="rounded-lg border bg-card p-6">
    <div className="mb-4 h-6 w-48 animate-pulse rounded bg-muted" />
    <div className="space-y-3">
      {["first", "second", "third"].map((item) => (
        <div key={item} className="h-18 animate-pulse rounded-lg border bg-muted" />
      ))}
    </div>
  </section>
);
