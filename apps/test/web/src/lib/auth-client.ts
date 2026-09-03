"use client";

// Local, independently maintained types for what apps/web consumes from
// servers/api's /api/auth/* endpoints — the two deployables don't share
// source (ADR-012 -> "Contract placement").
export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface AuthErrorBody {
  error: { message: string; code: string };
}

export interface SessionSummary {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

async function readErrorMessage(res: globalThis.Response, fallback: string): Promise<string> {
  const data = (await res.json()) as AuthErrorBody;
  return data.error?.message ?? fallback;
}

async function sendAuth(
  method: "POST" | "PATCH",
  path: string,
  body?: unknown,
): Promise<{ user: AuthUser }> {
  const res = await fetch(`/api/auth/${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Request failed."));
  }
  return (await res.json()) as { user: AuthUser };
}

export function register(email: string, password: string): Promise<{ user: AuthUser }> {
  return sendAuth("POST", "register", { email, password });
}

export function login(email: string, password: string): Promise<{ user: AuthUser }> {
  return sendAuth("POST", "login", { email, password });
}

export function updateProfile(displayName: string): Promise<{ user: AuthUser }> {
  return sendAuth("PATCH", "me", { displayName });
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch("/api/auth/password", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not change password."));
  }
}

export async function listSessions(): Promise<SessionSummary[]> {
  const res = await fetch("/api/auth/sessions", { credentials: "include" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not load sessions."));
  }
  const data = (await res.json()) as { sessions: SessionSummary[] };
  return data.sessions;
}

export async function revokeSession(id: string): Promise<void> {
  const res = await fetch(`/api/auth/sessions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not revoke session."));
  }
}

export async function revokeOtherSessions(): Promise<void> {
  const res = await fetch("/api/auth/sessions/revoke-others", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not revoke other sessions."));
  }
}
