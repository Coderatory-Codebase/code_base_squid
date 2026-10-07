import "server-only";
import { cookies } from "next/headers";

export const TEMPORARY_BRANDING_SESSION_COOKIE = "temporary_organization_branding_session";
export const TEMPORARY_BRANDING_SESSION_MAX_AGE = 4 * 60 * 60;

export const getTemporaryBrandingSession = async (): Promise<string | null> =>
  (await cookies()).get(TEMPORARY_BRANDING_SESSION_COOKIE)?.value ?? null;

export const setTemporaryBrandingSession = async (token: string): Promise<void> => {
  (await cookies()).set(TEMPORARY_BRANDING_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TEMPORARY_BRANDING_SESSION_MAX_AGE
  });
};

export const clearTemporaryBrandingSession = async (): Promise<void> => {
  (await cookies()).delete(TEMPORARY_BRANDING_SESSION_COOKIE);
};
