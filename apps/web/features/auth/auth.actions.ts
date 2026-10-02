"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createApiConfiguration, readWebEnvironment } from "@/config";

const sessionCookie = "workspace_session";

export const signIn = async (formData: FormData): Promise<void> => {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    redirect("/sign-in?error=credentials");
  }

  const api = createApiConfiguration(readWebEnvironment());
  let token: string | null = null;
  let failure: string | null = null;
  try {
    const response = await fetch(new URL("/auth/sign-in", api.baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store"
    });
    if (!response.ok) {
      failure = response.status === 401 ? "credentials" : "service";
    } else {
      const payload: unknown = await response.json();
      if (typeof payload === "object" && payload !== null && "token" in payload && typeof payload.token === "string") {
        token = payload.token;
      } else {
        failure = "service";
      }
    }
  } catch {
    failure = "service";
  }
  if (failure) redirect(`/sign-in?error=${failure}`);
  if (!token) redirect("/sign-in?error=service");
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60
  });
  redirect("/workspace/organization");
};

export const signOut = async (): Promise<void> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (token) {
    try {
      const api = createApiConfiguration(readWebEnvironment());
      await fetch(new URL("/auth/sign-out", api.baseUrl), {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store"
      });
    } catch {
      // The browser cookie is still cleared if the API is temporarily unavailable.
    }
  }
  cookieStore.delete(sessionCookie);
  redirect("/sign-in");
};

export const createOrganization = async (formData: FormData): Promise<void> => {
  const name = formData.get("name");
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) redirect("/sign-in");
  if (typeof name !== "string" || !name.trim()) redirect("/workspace/organization/new?error=name");

  const api = createApiConfiguration(readWebEnvironment());
  let failed = false;
  try {
    const response = await fetch(new URL("/organizations", api.baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
      cache: "no-store"
    });
    failed = !response.ok;
  } catch {
    failed = true;
  }
  if (failed) redirect("/workspace/organization/new?error=create");
  redirect("/workspace/organization");
};
