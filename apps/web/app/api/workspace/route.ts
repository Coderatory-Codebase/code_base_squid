import { headers } from "next/headers";
import { createApiConfiguration, readWebEnvironment } from "@/config";

const forward = async (method: "GET" | "POST", body?: string): Promise<Response> => {
  const api = createApiConfiguration(readWebEnvironment());
  const incoming = await headers();
  const outgoing = new Headers();
  const cookie = incoming.get("cookie");
  if (cookie) outgoing.set("cookie", cookie);
  if (body !== undefined) outgoing.set("content-type", "application/json");
  const upstream = await fetch(`${api.baseUrl.replace(/\/$/, "")}/workspace`, {
    method,
    headers: outgoing,
    ...(body !== undefined ? { body } : {}),
    cache: "no-store"
  });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" }
  });
};

export const GET = (): Promise<Response> => forward("GET");
export const POST = async (request: Request): Promise<Response> => forward("POST", await request.text());
