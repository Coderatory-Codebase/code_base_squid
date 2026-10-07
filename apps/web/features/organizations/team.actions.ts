"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { createApiConfiguration, readWebEnvironment } from "@/config";

const sessionCookie = "workspace_session";

const getToken = async (): Promise<string> => {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) redirect("/sign-in");
  return token;
};

const apiUrl = (path: string): URL => new URL(path, createApiConfiguration(readWebEnvironment()).baseUrl);
const dashboardPath = (organizationId: string): Route => `/workspace/dashboard/${organizationId}` as Route;

export type InvitationActionState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "failure"; message: string }>
  | Readonly<{ status: "created"; inviteUrl: string; email: string; expiresAt: string }>;

export const initialInvitationActionState: InvitationActionState = { status: "idle" };

export const createOrganizationInvitation = async (
  _previous: InvitationActionState,
  formData: FormData
): Promise<InvitationActionState> => {
  const organizationId = formData.get("organizationId");
  const email = formData.get("email");
  const role = formData.get("role");
  if (typeof organizationId !== "string" || !/^[a-f\d]{24}$/iu.test(organizationId)
    || typeof email !== "string" || !email.trim()
    || (role !== "admin" && role !== "member")) {
    return { status: "failure", message: "Enter a valid email address and invitation role." };
  }
  const token = await getToken();
  let response: Response;
  try {
    response = await fetch(apiUrl(`/organizations/${organizationId}/invitations`), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: email.trim(), role }),
      cache: "no-store"
    });
  } catch {
    return { status: "failure", message: "The invitation service could not be reached. Try again." };
  }
  if (response.status === 401) redirect("/sign-in");
  if (!response.ok) {
    return {
      status: "failure",
      message: response.status === 403
        ? "Only organization owners and admins can invite members."
        : response.status === 409
          ? "This account already belongs to the organization or has a pending invitation."
          : "The invitation could not be created. Try again."
    };
  }
  try {
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null
      || !("token" in payload) || typeof payload.token !== "string"
      || !/^[A-Za-z0-9_-]{40,60}$/u.test(payload.token)
      || !("expiresAt" in payload) || typeof payload.expiresAt !== "string" || !Number.isFinite(Date.parse(payload.expiresAt))
      || !("url" in payload) || typeof payload.url !== "string") {
      return { status: "failure", message: "The invitation service returned an invalid response." };
    }
    let invitationUrl: URL;
    try {
      invitationUrl = new URL(payload.url);
    } catch {
      return { status: "failure", message: "The invitation service returned an invalid response." };
    }
    if ((invitationUrl.protocol !== "https:" && invitationUrl.protocol !== "http:")
      || invitationUrl.pathname !== "/workspace/invitations/accept"
      || invitationUrl.searchParams.get("token") !== payload.token) {
      return { status: "failure", message: "The invitation service returned an invalid response." };
    }
    return { status: "created", inviteUrl: invitationUrl.toString(), email: email.trim(), expiresAt: payload.expiresAt };
  } catch {
    return { status: "failure", message: "The invitation service returned an unreadable response." };
  }
};

export const updateOrganizationMemberRole = async (formData: FormData): Promise<void> => {
  const organizationId = formData.get("organizationId");
  const memberId = formData.get("memberId");
  const role = formData.get("role");
  if (typeof organizationId !== "string" || !/^[a-f\d]{24}$/iu.test(organizationId)
    || typeof memberId !== "string" || !memberId
    || (role !== "admin" && role !== "member")) {
    redirect("/workspace/organization?teamError=invalid");
  }
  const token = await getToken();
  let response: Response;
  try {
    response = await fetch(apiUrl(`/organizations/${organizationId}/members/${encodeURIComponent(memberId)}`), {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
      cache: "no-store"
    });
  } catch {
    redirect(`${dashboardPath(organizationId)}?teamError=service` as Route);
  }
  if (response.status === 401) redirect("/sign-in");
  if (!response.ok) {
    redirect(`${dashboardPath(organizationId)}?teamError=${response.status === 403 ? "forbidden" : "update"}` as Route);
  }
  revalidatePath(dashboardPath(organizationId));
  redirect(dashboardPath(organizationId));
};

export const removeOrganizationMember = async (formData: FormData): Promise<void> => {
  const organizationId = formData.get("organizationId");
  const memberId = formData.get("memberId");
  if (typeof organizationId !== "string" || !/^[a-f\d]{24}$/iu.test(organizationId)
    || typeof memberId !== "string" || !memberId) {
    redirect("/workspace/organization?teamError=invalid");
  }
  const token = await getToken();
  let response: Response;
  try {
    response = await fetch(apiUrl(`/organizations/${organizationId}/members/${encodeURIComponent(memberId)}`), {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store"
    });
  } catch {
    redirect(`${dashboardPath(organizationId)}?teamError=service` as Route);
  }
  if (response.status === 401) redirect("/sign-in");
  if (!response.ok) {
    redirect(`${dashboardPath(organizationId)}?teamError=${response.status === 403 ? "forbidden" : "remove"}` as Route);
  }
  revalidatePath(dashboardPath(organizationId));
  redirect(dashboardPath(organizationId));
};

export const acceptOrganizationInvitation = async (formData: FormData): Promise<void> => {
  const tokenValue = formData.get("token");
  if (typeof tokenValue !== "string" || !/^[A-Za-z0-9_-]{40,60}$/u.test(tokenValue)) {
    redirect("/workspace/organization?inviteError=invalid");
  }
  const token = await getToken();
  let response: Response;
  try {
    response = await fetch(apiUrl("/organizations/invitations/accept"), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ token: tokenValue }),
      cache: "no-store"
    });
  } catch {
    redirect(`/workspace/invitations/accept?token=${encodeURIComponent(tokenValue)}&error=service` as Route);
  }
  if (response.status === 401) {
    const returnTo = `/workspace/invitations/accept?token=${encodeURIComponent(tokenValue)}`;
    redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}` as Route);
  }
  if (!response.ok) {
    redirect(`/workspace/invitations/accept?token=${encodeURIComponent(tokenValue)}&error=invalid` as Route);
  }
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null
    || !("id" in payload) || typeof payload.id !== "string" || !/^[a-f\d]{24}$/iu.test(payload.id)) {
    redirect(`/workspace/invitations/accept?token=${encodeURIComponent(tokenValue)}&error=service` as Route);
  }
  revalidatePath("/workspace/organization");
  redirect(dashboardPath(payload.id));
};
