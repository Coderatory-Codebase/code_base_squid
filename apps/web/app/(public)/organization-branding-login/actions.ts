"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { loginToTemporaryBrandingApi } from "@/features/organization-branding/temporary-live/api-gateway";
import { clearTemporaryBrandingSession, setTemporaryBrandingSession } from "@/features/organization-branding/temporary-live/session";

export const signInToTemporaryBrandingDemo = async (formData: FormData): Promise<void> => {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/organization-branding-login?error=credentials" as Route);
  try {
    const token = await loginToTemporaryBrandingApi(email, password);
    await setTemporaryBrandingSession(token);
  } catch {
    redirect("/organization-branding-login?error=unavailable" as Route);
  }
  redirect("/workspace/organization-branding" as Route);
};

export const signOutFromTemporaryBrandingDemo = async (): Promise<void> => {
  await clearTemporaryBrandingSession();
  redirect("/organization-branding-login" as Route);
};
