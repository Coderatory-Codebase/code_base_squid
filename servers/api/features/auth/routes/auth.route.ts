import { Router } from "express";
import { z } from "zod";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import type { AuthService } from "../services/auth.service.js";
import { createAuthController } from "../controllers/auth.controller.js";

const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256)
});

export const createAuthRoutes = (service: AuthService): Router => {
  const router = Router();
  const controller = createAuthController(service);
  router.post("/auth/sign-in", (request, _response, next) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      next(createApplicationError({
        code: ERROR_CODES.validation,
        message: ERROR_MESSAGES.validation,
        status: HTTP_STATUS.badRequest
      }));
      return;
    }
    request.body = parsed.data;
    next();
  }, controller.signIn);
  router.post("/auth/sign-out", controller.signOut);
  return router;
};
