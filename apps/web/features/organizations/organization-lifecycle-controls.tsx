"use client";

import { useState, type ReactElement } from "react";
import { updateOrganizationLifecycle, type LifecycleAction, type LifecycleState } from "./organization-lifecycle.actions";

type Props = Readonly<{
  organizationId: string;
  initialLifecycle: LifecycleState;
  canManage: boolean;
}>;

export const OrganizationLifecycleControls = ({ organizationId, initialLifecycle, canManage }: Props): ReactElement => {
  const [lifecycle, setLifecycle] = useState(initialLifecycle);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const run = async (action: LifecycleAction): Promise<void> => {
    if (pending) return;
    if (action === "delete" && !window.confirm("Soft-delete this archived organization? It will no longer appear in organization lists.")) return;
    const previous = lifecycle;
    const optimistic: LifecycleState = action === "archive"
      ? { status: "archived", version: previous.version + 1, archivedAt: new Date().toISOString() }
      : action === "restore"
        ? { status: "active", version: previous.version + 1, archivedAt: null }
        : { status: "deleted", version: previous.version + 1, archivedAt: previous.archivedAt };
    setLifecycle(optimistic);
    setPending(true);
    setMessage(action === "archive" ? "Archiving organization…" : action === "restore" ? "Restoring organization…" : "Deleting organization…");
    const result = await updateOrganizationLifecycle(organizationId, action, previous.version);
    if (result.ok) {
      setLifecycle(result.lifecycle);
      setMessage(result.lifecycle.status === "archived" ? "Organization archived. Existing information remains readable." : result.lifecycle.status === "active" ? "Organization restored." : "Organization soft-deleted.");
    } else {
      setLifecycle(result.current ?? previous);
      setMessage(result.message);
    }
    setPending(false);
  };

  return (
    <section aria-labelledby="organization-lifecycle-heading" className="mb-8 rounded-xl border bg-card p-6">
      <h2 className="text-xl font-semibold" id="organization-lifecycle-heading">Organization status</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {lifecycle.status === "archived"
          ? "Archived organizations stay readable; team changes are disabled."
          : lifecycle.status === "deleted"
            ? "This organization is soft-deleted and no longer appears in organization lists."
            : "This organization is active."}
      </p>
      {canManage && lifecycle.status !== "deleted" ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {lifecycle.status === "active"
            ? <button className="rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" disabled={pending} onClick={() => void run("archive")} type="button">Archive organization</button>
            : <button className="rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" disabled={pending} onClick={() => void run("restore")} type="button">Restore organization</button>}
          {lifecycle.status === "archived"
            ? <button className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" disabled={pending} onClick={() => void run("delete")} type="button">Soft-delete organization</button>
            : null}
        </div>
      ) : null}
      <p aria-live="polite" className="mt-3 text-sm" role="status">{message}</p>
    </section>
  );
};
