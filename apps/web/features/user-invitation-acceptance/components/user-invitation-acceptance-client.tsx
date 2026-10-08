"use client";

import { useOptimistic, useState, useTransition, type FormEvent } from "react";

export type InvitationAcceptanceActionResult =
  | Readonly<{ kind: "accepted"; workspaceName: string }>
  | Readonly<{ kind: "already-accepted"; workspaceName: string }>
  | Readonly<{ kind: "conflict"; currentStatus: string }>
  | Readonly<{ kind: "refused"; message: string }>
  | Readonly<{ kind: "failed"; message: string }>;

type UserInvitationAcceptanceClientProps = Readonly<{
  token: string;
  acceptInvitation: (token: string) => Promise<InvitationAcceptanceActionResult>;
}>;

type InvitationSurfaceState = "ready" | "accepting" | "accepted" | "failed";

export const UserInvitationAcceptanceClient = ({
  token,
  acceptInvitation
}: UserInvitationAcceptanceClientProps) => {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("Review the workspace invitation, then accept it to join.");
  const [state, setOptimisticState] = useOptimistic<InvitationSurfaceState, InvitationSurfaceState>(
    "ready",
    (_currentState, nextState) => nextState
  );

  const accept = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    startTransition(async () => {
      setOptimisticState("accepting");
      const result = await acceptInvitation(token);
      if (result.kind === "accepted" || result.kind === "already-accepted") {
        setOptimisticState("accepted");
        setMessage(`You are now in ${result.workspaceName}.`);
        return;
      }
      if (result.kind === "conflict") {
        setOptimisticState("ready");
        setMessage(`The invitation is currently ${result.currentStatus}. Refresh before trying again.`);
        return;
      }
      setOptimisticState("failed");
      setMessage(result.message);
    });
  };

  return (
    <section aria-labelledby="invitation-acceptance-heading" className="rounded-lg border bg-card p-6">
      <h1 id="invitation-acceptance-heading" className="text-xl font-semibold">Join this workspace</h1>
      <p aria-live="polite" className="mt-2 text-muted-foreground" role="status">{message}</p>
      <form className="mt-6" onSubmit={accept}>
        <button
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending || state === "accepted"}
          type="submit"
        >
          {state === "accepting" ? "Joining workspace…" : state === "accepted" ? "Joined workspace" : "Accept invitation"}
        </button>
      </form>
    </section>
  );
};
