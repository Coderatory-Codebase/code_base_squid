"use server";

import { cookies } from "next/headers";
import { createApiConfiguration, readWebEnvironment } from "@/config";

export type LifecycleAction = "archive" | "restore" | "delete";
export type LifecycleState = Readonly<{ status: "active" | "archived" | "deleted"; version: number; archivedAt: string | null }>;
export type LifecycleActionResult =
  | Readonly<{ ok: true; lifecycle: LifecycleState }>
  | Readonly<{ ok: false; message: string; current?: LifecycleState }>;

const isLifecycleState = (value: unknown): value is LifecycleState =>
  typeof value === "object" && value !== null
  && "status" in value && (value.status === "active" || value.status === "archived" || value.status === "deleted")
  && "version" in value && typeof value.version === "number" && Number.isSafeInteger(value.version)
  && "archivedAt" in value && (value.archivedAt === null || typeof value.archivedAt === "string");

export const updateOrganizationLifecycle = async (
  organizationId: string,
  action: LifecycleAction,
  expectedVersion: number
): Promise<LifecycleActionResult> => {
  if (!/^[a-f\d]{24}$/iu.test(organizationId)
    || !Number.isSafeInteger(expectedVersion)
    || expectedVersion < 0) {
    return { ok: false, message: "The organization lifecycle request is invalid." };
  }
  const token = (await cookies()).get("workspace_session")?.value;
  if (!token) return { ok: false, message: "Your session has expired. Sign in again." };
  let response: Response;
  try {
    response = await fetch(new URL(`/organizations/${encodeURIComponent(organizationId)}/lifecycle`, createApiConfiguration(readWebEnvironment()).baseUrl), {
      method: "PATCH",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ action, expectedVersion }),
      cache: "no-store"
    });
  } catch {
    return { ok: false, message: "The organization service could not be reached. Its current state has been restored." };
  }
  if (!response.ok && response.status !== 409) {
    return {
      ok: false,
      message: response.status === 401
        ? "Your session has expired. Sign in again."
        : response.status === 403
          ? "Only the organization owner can change its lifecycle."
          : response.status === 400
            ? "That lifecycle action is not valid for the current state."
            : `The organization could not be updated (HTTP ${response.status}).`
    };
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, message: "The organization service returned an invalid lifecycle response." };
  }
  if (!response.ok) {
    if (typeof data === "object" && data !== null && "current" in data && isLifecycleState(data.current)) {
      return {
        ok: false,
        message: "The organization changed. Its current state has been refreshed; review it before trying again.",
        current: data.current
      };
    }
    return { ok: false, message: `The organization could not be updated (HTTP ${response.status}).` };
  }
  if (typeof data === "object" && data !== null && "lifecycle" in data && isLifecycleState(data.lifecycle)) {
    return { ok: true, lifecycle: data.lifecycle };
  }
  return { ok: false, message: "The organization service returned an invalid lifecycle response." };
};
