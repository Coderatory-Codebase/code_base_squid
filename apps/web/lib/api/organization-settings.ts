import { z } from "zod";

const settingValueSchema = <T extends string>(value: z.ZodType<T>) => z.object({
  value,
  source: z.enum(["owner", "default"])
});

export const organizationSettingsSchema = z.object({
  organizationId: z.string().optional(),
  name: z.string().optional(),
  version: z.number().int().positive().optional(),
  canUpdate: z.boolean().optional(),
  timeZone: settingValueSchema(z.string()),
  weekStart: settingValueSchema(z.enum(["Monday", "Sunday"])),
  dateFormat: settingValueSchema(z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"])),
  workspaceSetupRule: settingValueSchema(z.enum(["owner only", "any member"]))
});

export const organizationSettingsResponseSchema = z.object({
  settings: z.array(organizationSettingsSchema)
});

const versionedOrganizationSettingsSchema = z.object({
  settings: organizationSettingsSchema,
  version: z.number().int().positive()
});

export const organizationSettingsUpdateResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("updated"), current: versionedOrganizationSettingsSchema }),
  z.object({ status: z.literal("conflict"), current: versionedOrganizationSettingsSchema.nullable() }),
  z.object({ status: z.literal("invalid_value"), field: z.string(), allowedValues: z.array(z.string()) })
]);

export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;
export type OrganizationSettingsPatch = Readonly<{
  timeZone?: string | undefined;
  weekStart?: "Monday" | "Sunday" | undefined;
  dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | undefined;
  workspaceSetupRule?: "owner only" | "any member" | undefined;
}>;
export type OrganizationSettingsRequest = (url: string) => Promise<z.infer<typeof organizationSettingsResponseSchema>>;

export const createOrganizationSettingsRequest = (
  sessionToken: string,
  fetchApi: typeof fetch = fetch
): OrganizationSettingsRequest => async (url) => {
  const response = await fetchApi(url, {
    cache: "no-store",
    headers: { accept: "application/json", authorization: `Bearer ${sessionToken}` }
  });
  if (!response.ok) {
    throw new Error(`Unable to load organization settings (${response.status}).`);
  }
  return organizationSettingsResponseSchema.parse(await response.json());
};

export const createOrganizationSettingsQuery = (request: OrganizationSettingsRequest) =>
  async (baseUrl: string): Promise<readonly OrganizationSettings[]> => {
    const response = await request(`${baseUrl}/workspace/organization-settings`);
    return Object.freeze(response.settings);
  };
