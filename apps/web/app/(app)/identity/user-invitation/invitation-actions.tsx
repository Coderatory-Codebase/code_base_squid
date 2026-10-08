"use client";

import { useActionState, useState, type ReactElement } from "react";
import { resendInvitationAction, revokeInvitationAction, type InvitationManagementState } from "@/features/organizations/team.actions";

const initial: InvitationManagementState = { status: "idle" };

export const InvitationActions = ({ invitationId }: Readonly<{ invitationId: string }>): ReactElement => {
  const [revokeState, revokeAction, revoking] = useActionState(revokeInvitationAction.bind(null, invitationId), initial);
  const [resendState, resendAction, resending] = useActionState(resendInvitationAction.bind(null, invitationId), initial);
  const [copyMessage, setCopyMessage] = useState("");

  const copy = async (): Promise<void> => {
    if (!resendState.invitationUrl) return;
    try {
      await navigator.clipboard.writeText(resendState.invitationUrl);
      setCopyMessage("New invitation link copied.");
    } catch {
      setCopyMessage("Copy failed. Select the link and copy it manually.");
    }
  };

  return (
    <div className="grid gap-2" aria-live="polite">
      <div className="flex flex-wrap gap-2">
        <form action={resendAction}>
          <button className="rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={resending || revoking} type="submit">
            {resending ? "Renewing…" : "Resend invitation"}
          </button>
        </form>
        <form action={revokeAction}>
          <button className="rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={revoking || resending} type="submit">
            {revoking ? "Revoking…" : "Revoke invitation"}
          </button>
        </form>
      </div>
      {revokeState.message ? <p className="text-sm" role={revokeState.status === "failure" ? "alert" : "status"}>{revokeState.message}</p> : null}
      {resendState.message ? <p className="text-sm" role={resendState.status === "failure" ? "alert" : "status"}>{resendState.message}</p> : null}
      {resendState.invitationUrl ? (
        <div className="grid gap-2">
          <label className="sr-only" htmlFor={`resent-link-${invitationId}`}>New invitation link</label>
          <input className="h-9 w-full rounded-md border bg-background px-2 text-xs" id={`resent-link-${invitationId}`} readOnly value={resendState.invitationUrl} />
          <button className="w-fit rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={copy} type="button">Copy new link</button>
          {copyMessage ? <p className="text-sm" role="status">{copyMessage}</p> : null}
        </div>
      ) : null}
    </div>
  );
};
