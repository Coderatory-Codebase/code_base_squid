import { headers } from "next/headers";
import { createApiConfiguration, readWebEnvironment } from "@/config";

export const DELETE = async (): Promise<Response> => {
  const api = createApiConfiguration(readWebEnvironment());
  const incoming = await headers();
  const outgoing = new Headers();
  const cookie = incoming.get("cookie");
  if (cookie) outgoing.set("cookie", cookie);
  const upstream = await fetch(`${api.baseUrl.replace(/\/$/, "")}/identity/session`, {
    method: "DELETE",
    headers: outgoing,
    cache: "no-store"
  });
  return new Response(null, { status: upstream.status, headers: { "set-cookie": upstream.headers.get("set-cookie") ?? "" } });
};
