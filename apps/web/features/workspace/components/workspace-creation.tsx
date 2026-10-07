"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { Button } from "@workspace/ui";

type WorkspaceCreationProps = Readonly<{ organizationName: string }>;
type WorkspaceResponse = Readonly<{ kind: "ready"; workspace: Readonly<{ workspaceId: string; name: string }> }>;

export const WorkspaceCreation = ({ organizationName }: WorkspaceCreationProps): ReactElement => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [workspace, setWorkspace] = useState<WorkspaceResponse["workspace"] | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 80) {
      setMessage("Workspace name must contain between 1 and 80 characters.");
      return;
    }
    setSaving(true);
    setMessage("Creating workspace…");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmedName })
      });
      if (!response.ok) {
        setMessage(response.status >= 500
          ? "We could not create the workspace because the service had a problem. No workspace was created. Your name is still here; you can retry."
          : "We could not create this workspace. No workspace was created. Your name is still here; check access and retry.");
        return;
      }
      const result = await response.json() as WorkspaceResponse;
      setName(result.workspace.name);
      setWorkspace(result.workspace);
      setMessage("Workspace created. You are now in your workspace.");
    } catch {
      setMessage("We could not reach the workspace service. No workspace was created. Your name is still here; you can retry.");
    } finally {
      setSaving(false);
    }
  };

  if (workspace) {
    return (
      <section aria-labelledby="workspace-ready-title" className="mt-8 grid gap-3">
        <h2 className="text-xl font-semibold" id="workspace-ready-title">{workspace.name}</h2>
        <p>You are in the workspace for {organizationName}.</p>
        <p aria-live="polite" className="text-sm text-muted-foreground">{message}</p>
      </section>
    );
  }

  return (
    <form className="mt-8 grid max-w-md gap-3" onSubmit={(event) => void submit(event)}>
      <label className="grid gap-2 text-sm font-medium" htmlFor="workspace-name">Workspace name</label>
      <input
        autoComplete="organization-title"
        className="h-10 rounded-md border border-input bg-background px-3 text-base"
        id="workspace-name"
        maxLength={81}
        onChange={(event) => setName(event.currentTarget.value)}
        required
        value={name}
      />
      <div><Button disabled={saving} type="submit">{saving ? "Creating…" : "Create workspace"}</Button></div>
      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{message}</p>
    </form>
  );
};
