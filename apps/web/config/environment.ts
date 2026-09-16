import { z } from "zod";

const environmentSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:4000")
});

export const getWebEnvironment = () => {
  const environment = environmentSchema.parse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
  });

  return Object.freeze({ apiBaseUrl: environment.NEXT_PUBLIC_API_BASE_URL });
};
