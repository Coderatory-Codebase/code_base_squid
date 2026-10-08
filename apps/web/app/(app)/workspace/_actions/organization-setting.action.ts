"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  organizationSettingInputSchema
} from "./organization-setting.schema";
import {
  organizationSettingsUpdateResponseSchema,
  type OrganizationSettings
} from "@/lib/api/organization-settings";
import { updateOrganizationSettings } from "@/lib/api/update-organization-settings.server";

export type OrganizationSettingUpdateActionResult =
  | Readonly<{ status: "updated"; settings: OrganizationSettings; version: number }>
  | Readonly<{ status: "conflict"; current: Readonly<{ settings: OrganizationSettings; version: number }> | null }>
  | Readonly<{ status: "failure"; message: string }>;

const invalidInput: OrganizationSettingUpdateActionResult = {
  status: "failure",
  message: "Enter valid organization settings and a current version."
};

export const updateOrganizationSetting = async (
  input: unknown
): Promise<OrganizationSettingUpdateActionResult> => {
  const parsed = organizationSettingInputSchema.safeParse(input);
  if (!parsed.success) return invalidInput;

  const token = (await cookies()).get("workspace_session")?.value;
  if (!token) redirect("/sign-in");

  let response: Awaited<ReturnType<typeof updateOrganizationSettings>>;
  try {
    response = await updateOrganizationSettings(token, parsed.data);
  } catch {
    return { status: "failure", message: "The organization settings service could not be reached. Try again." };
  }
  if (response.status === 401) redirect("/sign-in");
  if (response.status === 403) {
    return { status: "failure", message: "Only the organization owner can change these settings." };
  }

  const result = organizationSettingsUpdateResponseSchema.safeParse(response.payload);
  if (!result.success) {
    return { status: "failure", message: "The organization settings service returned an invalid response." };
  }
  if (response.status === 200 && result.data.status === "updated") {
    revalidatePath("/workspace/organization-setting");
    return { status: "updated", ...result.data.current };
  }
  if (response.status === 409 && result.data.status === "conflict") {
    return { status: "conflict", current: result.data.current };
  }
  return { status: "failure", message: "The organization settings could not be updated. Try again." };
};
