import type { ValidatedWebEnvironment } from "@/validation/env.validation";

export type ApiConfiguration = Readonly<{ baseUrl: string }>;

export const createApiConfiguration = (
  environment: ValidatedWebEnvironment
): ApiConfiguration => Object.freeze({
  baseUrl: environment.NEXT_PUBLIC_API_BASE_URL
});
