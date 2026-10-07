import { Router } from "express";
import { createOidcSignInController, type OidcSignInControllerDependencies } from "../controllers/index.js";

export const createOidcSignInRoutes = (dependencies: OidcSignInControllerDependencies) => {
  const router = Router();
  const controller = createOidcSignInController(dependencies);

  router.get("/identity/sign-in/:provider", controller.start);
  router.get("/identity/callback/:provider", controller.callback);
  router.delete("/identity/session", controller.signOut);
  return router;
};
