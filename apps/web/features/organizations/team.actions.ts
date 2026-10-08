"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import type { InvitationActionState } from "./team.action-state";
import { validateInvitationEmail } from "./team.invitation-validation";

const sessionCookie = "workspace_session";

const getToken = async (): Promise<string> => {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) redirect("/sign-in");
  return token;
};

const apiUrl = (path: string): URL => new URL(path, createApiConfiguration(readWebEnvironment()).baseUrl);
const dashboardPath = (organizationId: string): Route => `/workspace/dashboard/${organizationId}` as Route;

export const createOrganizationInvitation = async (
  _previous: InvitationActionState,
  formData: FormData
): Promise<InvitationActionState> => {
  const organizationId = formData.get("organizationId");
  const email = formData.get("email");
  const role = formData.get("role");
  const validatedEmail = validateInvitationEmail(email);
  if (!validatedEmail.ok) {
    return { status: "failure", field: "email", message: "Enter a valid email address." };
  }
  if (typeof organizationId !== "string" || !/^[a-f\d]{24}$/iu.test(organizationId)
    || (role !== "admin" && role !== "member")) {
    return { status: "failure", message: "Enter a valid email address and invitation role." };
  }
  const token = await getToken();
  let response: Response;
  try {
    response = await fetch(apiUrl(`/organizations/${organizationId}/invitations`), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: validatedEmail.email, role }),
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
      || !("url" in payload) || typeof payload.url !== "string"
    ) {
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
    return { status: "created", inviteUrl: invitationUrl.toString(), email: validatedEmail.email, expiresAt: payload.expiresAt };
  } catch {
    return { status: "failure", message: "The invitation service returned an unreadable response." };
  }
};

export type InvitationManagementState = Readonly<{
  status: "idle" | "success" | "failure";
  message?: string;
  invitationUrl?: string;
}>;

const invitationManagementApi = async (invitationId: string, method: "DELETE" | "POST"): Promise<Response> => {
  const token = await getToken();
  return fetch(apiUrl(method === "DELETE"
    ? `/identity/user-invitations/${encodeURIComponent(invitationId)}`
    : `/identity/user-invitations/${encodeURIComponent(invitationId)}/resend`), {
    method,
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store"
  });
};

export const revokeInvitationAction = async (
  invitationId: string,
  _previous: InvitationManagementState,
  _formData: FormData
): Promise<InvitationManagementState> => {
  if (!/^[a-f\d]{24}$/iu.test(invitationId)) return { status: "failure", message: "Invalid invitation." };
  let response: Response;
  try { response = await invitationManagementApi(invitationId, "DELETE"); }
  catch { return { status: "failure", message: "The invitation service could not be reached." }; }
  if (response.status === 401) redirect("/sign-in");
  if (!response.ok) return { status: "failure", message: "This invitation could not be revoked." };
  revalidatePath("/identity/user-invitation");
  return { status: "success", message: "Invitation revoked." };
};

export const resendInvitationAction = async (
  invitationId: string,
  _previous: InvitationManagementState,
  _formData: FormData
): Promise<InvitationManagementState> => {
  if (!/^[a-f\d]{24}$/iu.test(invitationId)) return { status: "failure", message: "Invalid invitation." };
  let response: Response;
  try { response = await invitationManagementApi(invitationId, "POST"); }
  catch { return { status: "failure", message: "The invitation service could not be reached." }; }
  if (response.status === 401) redirect("/sign-in");
  if (!response.ok) return { status: "failure", message: "This invitation could not be resent." };
  try {
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null || !("invitationUrl" in payload)
      || typeof payload.invitationUrl !== "string" || !("expiresAt" in payload)
      || typeof payload.expiresAt !== "string" || !Number.isFinite(Date.parse(payload.expiresAt))) {
      return { status: "failure", message: "The invitation service returned an invalid response." };
    }
    revalidatePath("/identity/user-invitation");
    return { status: "success", message: "Invitation renewed. Copy the new link; the previous link no longer works.", invitationUrl: payload.invitationUrl };
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
