import { headers } from "next/headers";
import type { ReactElement } from "react";
import { z } from "zod";
import { CircleAlert, MonitorSmartphone } from "lucide-react";
import { Button, MessageState, PageHeader, PageShell } from "@workspace/ui";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import { UserSessionsManager } from "@/features/identity/components/user-sessions-manager";

const SessionsSchema = z.array(z.object({
  sessionId: z.string().min(1),
  device: z.string(),
  lastUsedAt: z.string().datetime(),
  isCurrent: z.boolean()
}));

type SessionsPageState =
  | Readonly<{ kind: "ready"; sessions: z.infer<typeof SessionsSchema> }>
  | Readonly<{ kind: "empty" }>
  | Readonly<{ kind: "error" }>;

const loadSessions = async (): Promise<SessionsPageState> => {
  const api = createApiConfiguration(readWebEnvironment());
  const incoming = await headers();
  const outgoing = new Headers();
  const cookie = incoming.get("cookie");
  if (cookie) outgoing.set("cookie", cookie);
  try {
    const response = await fetch(`${api.baseUrl.replace(/\/$/, "")}/identity/sessions`, { headers: outgoing, cache: "no-store" });
    if (response.status === 401) return { kind: "empty" };
    if (!response.ok) return { kind: "error" };
    const parsed = SessionsSchema.safeParse(await response.json());
    return parsed.success ? { kind: "ready", sessions: parsed.data } : { kind: "error" };
  } catch {
    return { kind: "error" };
  }
};

const UserSessionsPage = async (): Promise<ReactElement> => {
  const state = await loadSessions();
  if (state.kind === "empty") {
    return <MessageState
      action={<div className="mt-6"><Button asChild><a href="/sign-in">Sign in</a></Button></div>}
      description="Sign in to see and manage the devices connected to your account."
      eyebrow="Identity"
      icon={<MonitorSmartphone aria-hidden="true" className="size-8 text-muted-foreground" />}
      title="No active sign-in"
    />;
  }
  if (state.kind === "error") {
    return <MessageState description="The session list could not be loaded. Refresh the page or try again later." eyebrow="Identity" icon={<CircleAlert aria-hidden="true" className="size-8 text-muted-foreground" />} title="Unable to load sessions" />;
  }
  return (
    <PageShell width="narrow">
      <PageHeader description="Review the devices signed in to your account and end any session you do not recognize." eyebrow="Identity" icon={<MonitorSmartphone aria-hidden="true" className="size-5" />} title="Active sessions" />
      <UserSessionsManager initialSessions={state.sessions} />
    </PageShell>
  );
};

export default UserSessionsPage;
