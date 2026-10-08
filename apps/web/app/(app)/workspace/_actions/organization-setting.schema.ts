import { z } from "zod";

const organizationSettingsPatchSchema = z
  .object({
    timeZone: z.string().trim().min(1).optional(),
    weekStart: z.string().trim().min(1).optional(),
    dateFormat: z.string().trim().min(1).optional(),
  })
  .strict()
  .refine(
    (settings) =>
      settings.timeZone !== undefined ||
      settings.weekStart !== undefined ||
      settings.dateFormat !== undefined,
    { message: "At least one organization setting must be provided." },
  );

export const organizationSettingInputSchema = z
  .object({
    organizationId: z.string().trim().min(1),
    expectedVersion: z.number().int().nonnegative(),
    settings: organizationSettingsPatchSchema,
  })
  .strict();

export type OrganizationSettingInput = z.infer<typeof organizationSettingInputSchema>;
