import { z } from "zod";

const organizationSettingsPatchSchema = z
  .object({
    timeZone: z.string().trim().min(1).optional(),
    weekStart: z.enum(["Monday", "Sunday"]).optional(),
    dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
    workspaceSetupRule: z.enum(["owner only", "any member"]).optional(),
  })
  .strict()
  .refine(
    (settings) =>
      settings.timeZone !== undefined ||
      settings.weekStart !== undefined ||
      settings.dateFormat !== undefined ||
      settings.workspaceSetupRule !== undefined,
    { message: "At least one organization setting must be provided." },
  );

export const organizationSettingInputSchema = z
  .object({
    organizationId: z.string().trim().regex(/^[a-f\d]{24}$/iu),
    expectedVersion: z.number().int().positive(),
    settings: organizationSettingsPatchSchema,
  })
  .strict();

export const organizationSettingUpdateBodySchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    settings: organizationSettingsPatchSchema,
  })
  .strict();

export type OrganizationSettingInput = z.infer<typeof organizationSettingInputSchema>;
