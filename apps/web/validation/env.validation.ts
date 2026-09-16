import { z } from "zod";

export const webEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:4000")
});

export type ValidatedWebEnvironment = Readonly<z.infer<typeof webEnvironmentSchema>>;

export const validateWebEnvironment = (input: unknown): ValidatedWebEnvironment =>
  Object.freeze(webEnvironmentSchema.parse(input));
