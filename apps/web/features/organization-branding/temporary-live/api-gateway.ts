import "server-only";
import { z } from "zod";
import type { OrganizationBrandingRecord } from "../contracts";

const organizationsResponseSchema = z.object({
  organizations: z.array(z.object({
    organizationId: z.string().min(1),
    organizationName: z.string().min(1),
    workspaceName: z.string().min(1),
    workspaceId: z.string().min(1),
    logoUrl: z.string().nullable(),
    accentColor: z.string().nullable()
  }))
});

const getApiBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  return baseUrl.replace(/\/$/, "");
};

export class TemporaryBrandingApiError extends Error {
  constructor(public readonly status: number) {
    super(`Temporary branding API returned ${status}.`);
    this.name = "TemporaryBrandingApiError";
  }
}

export const loginToTemporaryBrandingApi = async (email: string, password: string): Promise<string> => {
  const response = await fetch(`${getApiBaseUrl()}/temporary/organization-branding/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });
  if (!response.ok) throw new TemporaryBrandingApiError(response.status);
  const body: unknown = await response.json();
  return z.object({ token: z.string().min(1) }).parse(body).token;
};

export const readTemporaryBrandingOrganizations = async (token: string): Promise<readonly OrganizationBrandingRecord[]> => {
  const response = await fetch(`${getApiBaseUrl()}/temporary/organization-branding/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!response.ok) throw new TemporaryBrandingApiError(response.status);
  const body: unknown = await response.json();
  return organizationsResponseSchema.parse(body).organizations;
};
