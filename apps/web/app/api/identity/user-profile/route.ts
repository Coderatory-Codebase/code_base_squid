import { headers } from "next/headers";
import { createApiConfiguration, readWebEnvironment } from "@/config";

export const PUT = async (request: Request): Promise<Response> => {
  const api = createApiConfiguration(readWebEnvironment());
  const incoming = await headers();
  const outgoing = new Headers({ "content-type": "application/json" });
  const cookie = incoming.get("cookie");
  if (cookie) outgoing.set("cookie", cookie);
  const upstream = await fetch(`${api.baseUrl.replace(/\/$/, "")}/identity/user-profile`, {
    method: "PUT",
    headers: outgoing,
    body: await request.text(),
    cache: "no-store"
  });
  return new Response(await upstream.text(), { status: upstream.status, headers: { "content-type": "application/json" } });
};
