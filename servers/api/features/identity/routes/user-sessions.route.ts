import { Router } from "express";
import { createUserSessionsController, type UserSessionsControllerDependencies } from "../controllers/user-sessions.controller.js";

export type UserSessionsRouteDependencies = UserSessionsControllerDependencies;

export const createUserSessionsRoutes = (dependencies: UserSessionsRouteDependencies) => {
  const router = Router();
  const controller = createUserSessionsController(dependencies);
  router.get("/identity/sessions", controller.list);
  router.delete("/identity/sessions/:sessionId", controller.revoke);
  return router;
};
