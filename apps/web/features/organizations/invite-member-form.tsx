"use client";

import { useActionState, useState, type ReactElement } from "react";
import { createOrganizationInvitation, initialInvitationActionState } from "./team.actions";

type InviteMemberFormProps = Readonly<{ organizationId: string }>;

export const InviteMemberForm = ({ organizationId }: InviteMemberFormProps): ReactElement => {
  const [state, action, pending] = useActionState(createOrganizationInvitation, initialInvitationActionState);
  const [copyMessage, setCopyMessage] = useState("");

  const copyInvite = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(state.status === "created" ? state.inviteUrl : "");
      setCopyMessage("Invitation link copied.");
    } catch {
      setCopyMessage("Could not copy automatically. Select and copy the invitation link.");
    }
  };

  return (
    <section aria-labelledby="invite-member-title" className="grid gap-4 rounded-xl border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold" id="invite-member-title">Invite a team member</h2>
        <p className="mt-1 text-sm text-muted-foreground">The invitee must sign in with this email address. Links expire after seven days.</p>
      </div>
      {state.status === "created" ? (
        <div aria-live="polite" className="grid gap-3" role="status">
          <p>Invitation created for {state.email}. Expires {new Date(state.expiresAt).toLocaleDateString()}.</p>
          <label className="grid gap-2 text-sm font-medium" htmlFor="invitation-link">
            Secure invitation link
            <input className="h-10 min-w-0 rounded-md border bg-background px-3 font-normal" id="invitation-link" readOnly value={state.inviteUrl} />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" onClick={copyInvite} type="button">Copy invitation link</button>
            <button className="h-9 rounded-md border px-3 text-sm font-medium" onClick={() => window.location.reload()} type="button">Create another invitation</button>
            <p aria-live="polite" className="text-sm text-muted-foreground">{copyMessage}</p>
          </div>
        </div>
      ) : (
        <form action={action} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <input name="organizationId" type="hidden" value={organizationId} />
          <label className="grid gap-2 text-sm font-medium" htmlFor="invite-email">
            Email address
            <input autoComplete="email" className="h-10 rounded-md border bg-background px-3 font-normal" id="invite-email" maxLength={254} name="email" required type="email" />
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="invite-role">
            Role
            <select className="h-10 rounded-md border bg-background px-3 font-normal" defaultValue="member" id="invite-role" name="role">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" disabled={pending} type="submit">
            {pending ? "Creating link..." : "Create invite link"}
          </button>
        </form>
      )}
      {state.status === "failure" ? <p aria-live="polite" className="text-sm text-destructive" role="alert">{state.message}</p> : null}
    </section>
  );
};
