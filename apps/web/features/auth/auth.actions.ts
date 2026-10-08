"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import { organizationNameSchema, type OrganizationSetupActionState } from "@/features/organizations/public";

const sessionCookie = "workspace_session";
const isInvitationReturnPath = (value: unknown): value is string =>
  typeof value === "string"
  && /^\/workspace\/invitations\/accept\?token=[A-Za-z0-9_-]{40,60}$/u.test(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readConflictName = (payload: unknown): string | null => {
  if (!isRecord(payload)) return null;
  const error = isRecord(payload.error) ? payload.error : null;
  const details = error && isRecord(error.details) ? error.details : null;
  const current = isRecord(payload.current)
    ? payload.current
    : error && isRecord(error.current)
      ? error.current
      : details && isRecord(details.current)
        ? details.current
        : null;
  return current && typeof current.name === "string" ? current.name : null;
};

export const signIn = async (formData: FormData): Promise<void> => {
  const email = formData.get("email");
  const password = formData.get("password");
  const returnTo = formData.get("returnTo");
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
  if (isInvitationReturnPath(returnTo)) redirect(returnTo as Route);
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

export const createOrganization = async (
  _previousState: OrganizationSetupActionState,
  formData: FormData
): Promise<OrganizationSetupActionState> => {
  const parsedName = organizationNameSchema.safeParse(formData.get("name"));
  if (!parsedName.success) {
    return { status: "invalid", message: parsedName.error.issues[0]?.message ?? "Enter a valid organization name." };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) redirect("/sign-in");

  const api = createApiConfiguration(readWebEnvironment());
  let organizationId: string | null = null;
  try {
    const response = await fetch(new URL("/organizations", api.baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: parsedName.data }),
      cache: "no-store"
    });
    if (response.status === 409) {
      const payload: unknown = await response.json().catch(() => null);
      return { status: "conflict", currentName: readConflictName(payload) };
    }
    if (!response.ok) {
      return { status: "failure", message: "The organization could not be created. Try again." };
    }
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null || !("id" in payload) || typeof payload.id !== "string") {
      return { status: "failure", message: "The organization service returned an invalid response." };
    }
    organizationId = payload.id;
  } catch {
    return { status: "failure", message: "The organization service could not be reached. Try again." };
  }
  if (!organizationId) return { status: "failure", message: "The organization service returned an invalid response." };
  const encodedId = encodeURIComponent(organizationId);
  redirect(`/workspace/organization?created=${encodedId}#organization-${encodedId}`);
};
