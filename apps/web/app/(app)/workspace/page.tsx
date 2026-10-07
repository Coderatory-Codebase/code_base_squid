import { headers } from "next/headers";
import type { ReactElement } from "react";
import { BriefcaseBusiness, CircleAlert } from "lucide-react";
import { Button, MessageState, PageHeader, PageShell } from "@workspace/ui";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import { WorkspaceCreation } from "@/features/workspace/components/workspace-creation";

type WorkspaceState =
  | Readonly<{ kind: "ready"; workspace: Readonly<{ workspaceId: string; name: string; organizationId: string }> }>
  | Readonly<{ kind: "create-workspace"; organizationName: string }>
  | Readonly<{ kind: "signed-out" }>
  | Readonly<{ kind: "unavailable" }>;

const loadWorkspace = async (): Promise<WorkspaceState> => {
  const api = createApiConfiguration(readWebEnvironment());
  const incoming = await headers();
  const outgoing = new Headers();
  const cookie = incoming.get("cookie");
  if (cookie) outgoing.set("cookie", cookie);
  try {
    const response = await fetch(`${api.baseUrl.replace(/\/$/, "")}/workspace`, { headers: outgoing, cache: "no-store" });
    if (response.status === 401) return { kind: "signed-out" };
    if (!response.ok) return { kind: "unavailable" };
    const result: unknown = await response.json();
    if (typeof result !== "object" || result === null || !("kind" in result)) return { kind: "unavailable" };
    if (result.kind === "create-workspace" && "organizationName" in result && typeof result.organizationName === "string") {
      return { kind: "create-workspace", organizationName: result.organizationName };
    }
    if (result.kind === "ready" && "workspace" in result && typeof result.workspace === "object" && result.workspace !== null &&
      "workspaceId" in result.workspace && typeof result.workspace.workspaceId === "string" &&
      "organizationId" in result.workspace && typeof result.workspace.organizationId === "string" &&
      "name" in result.workspace && typeof result.workspace.name === "string") {
      return {
        kind: "ready",
        workspace: {
          workspaceId: result.workspace.workspaceId,
          organizationId: result.workspace.organizationId,
          name: result.workspace.name
        }
      };
    }
    return { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
};

const WorkspacePage = async (): Promise<ReactElement> => {
  const state = await loadWorkspace();
  if (state.kind === "signed-out") {
    return <MessageState action={<div className="mt-6"><Button asChild><a href="/sign-in">Sign in</a></Button></div>} description="Sign in with your organization owner account to open a workspace." eyebrow="Workspace" icon={<BriefcaseBusiness aria-hidden="true" className="size-8 text-muted-foreground" />} title="Sign in to continue" />;
  }
  if (state.kind === "unavailable") {
    return <MessageState description="We could not load your workspace. Refresh the page or try again later." eyebrow="Workspace" icon={<CircleAlert aria-hidden="true" className="size-8 text-muted-foreground" />} title="Unable to load workspace" />;
  }
  return (
    <PageShell width="narrow">
      <PageHeader description="Create and open the workspace for your organization." eyebrow="Workspace" icon={<BriefcaseBusiness aria-hidden="true" className="size-5" />} title={state.kind === "ready" ? state.workspace.name : "Set up your workspace"} />
      {state.kind === "create-workspace"
        ? <WorkspaceCreation organizationName={state.organizationName} />
        : <p className="mt-4 text-muted-foreground">You are in your organization workspace.</p>}
    </PageShell>
  );
};

export default WorkspacePage;
