import { cookies } from "next/headers";
import type { AuthUser } from "./auth-client";

const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";

// Server components render before the browser exists, so a relative
// "/api/*" fetch has no implicit host — call servers/api directly and
// forward the incoming request's cookies by hand (the Next.js rewrite
// proxy only applies to requests the browser itself makes).
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) {
    return null;
  }
  const res = await fetch(`${apiOrigin}/api/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { user: AuthUser };
  return data.user;
}
