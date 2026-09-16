import {
  validateWebEnvironment,
  type ValidatedWebEnvironment
} from "@/validation/env.validation";

export const readWebEnvironment = (
  source: Readonly<Record<string, string | undefined>> = process.env
): ValidatedWebEnvironment => validateWebEnvironment({
  NEXT_PUBLIC_API_BASE_URL: source.NEXT_PUBLIC_API_BASE_URL
});
