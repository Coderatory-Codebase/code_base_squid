import { headers } from "next/headers";
import { createApiConfiguration, readWebEnvironment } from "@/config";

export const GET = async (): Promise<Response> => {
  const api = createApiConfiguration(readWebEnvironment());
  const incoming = await headers();
  const outgoing = new Headers();
  const cookie = incoming.get("cookie");
  if (cookie) outgoing.set("cookie", cookie);
  const upstream = await fetch(`${api.baseUrl.replace(/\/$/, "")}/identity/sessions`, { headers: outgoing, cache: "no-store" });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" }
  });
};
