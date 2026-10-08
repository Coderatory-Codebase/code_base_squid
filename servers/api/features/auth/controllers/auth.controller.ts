import type { Request, Response } from "express";
import type { AuthService } from "../services/auth.service.js";
import { HTTP_STATUS } from "../../../constants/index.js";

type AuthResponse = Pick<Response, "json" | "status">;

export const readBearerToken = (request: Request): string | null => {
  const authorization = request.get("authorization");
  const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,64})$/i);
  return match?.[1] ?? null;
};

export const createAuthController = (service: AuthService) => ({
  signIn: async (request: Request, response: AuthResponse): Promise<void> => {
    const credentials = request.body as { email: string; password: string };
    response.status(HTTP_STATUS.ok).json(await service.signIn(credentials.email, credentials.password));
  },
  signOut: async (request: Request, response: AuthResponse): Promise<void> => {
    await service.signOut(readBearerToken(request));
    response.status(HTTP_STATUS.noContent).end();
  }
});
