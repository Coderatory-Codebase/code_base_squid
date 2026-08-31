"use client";

// Local, independently maintained types for what apps/web consumes from
// servers/api's /api/auth/* endpoints — the two deployables don't share
// source (ADR-012 -> "Contract placement").
export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthErrorBody {
  error: { message: string; code: string };
}

async function postAuth(path: string, body?: unknown): Promise<{ user: AuthUser }> {
  const res = await fetch(`/api/auth/${path}`, {
    method: "POST",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = (await res.json()) as AuthErrorBody;
    throw new Error(data.error?.message ?? "Request failed.");
  }
  return (await res.json()) as { user: AuthUser };
}

export function register(email: string, password: string): Promise<{ user: AuthUser }> {
  return postAuth("register", { email, password });
}

export function login(email: string, password: string): Promise<{ user: AuthUser }> {
  return postAuth("login", { email, password });
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}
