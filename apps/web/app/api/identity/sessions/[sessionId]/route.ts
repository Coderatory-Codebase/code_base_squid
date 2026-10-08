import { headers } from "next/headers";
import { createApiConfiguration, readWebEnvironment } from "@/config";

type RouteContext = Readonly<{ params: Promise<Readonly<{ sessionId: string }>> }>;

export const DELETE = async (_request: Request, context: RouteContext): Promise<Response> => {
  const api = createApiConfiguration(readWebEnvironment());
  const incoming = await headers();
  const cookie = incoming.get("cookie");
  const outgoing = new Headers();
  if (cookie) outgoing.set("cookie", cookie);
  const { sessionId } = await context.params;
  const upstream = await fetch(`${api.baseUrl.replace(/\/$/, "")}/identity/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: outgoing,
    cache: "no-store"
  });
  return new Response(null, { status: upstream.status });
};
