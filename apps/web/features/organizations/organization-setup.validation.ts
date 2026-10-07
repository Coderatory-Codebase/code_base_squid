import { z } from "zod";

export const organizationNameSchema = z.string()
  .trim()
  .min(1, "Enter an organization name.")
  .max(80, "Organization names must be 80 characters or fewer.");
