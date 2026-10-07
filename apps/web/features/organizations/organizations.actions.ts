"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createOrganizationsGateway, type OrganizationListResult } from "./organizations.gateway.js";

export const loadMoreOrganizations = async (offset: number): Promise<OrganizationListResult> => {
  if (!Number.isSafeInteger(offset) || offset <= 0 || offset > 500_000) {
    return { ok: false, message: "The requested organization page is invalid." };
  }
  const token = (await cookies()).get("workspace_session")?.value;
  if (!token) redirect("/sign-in");
  return createOrganizationsGateway().listOrganizations(token, offset);
};
