import { Router } from "express";
import { createWorkspaceController, type WorkspaceControllerDependencies } from "../controllers/workspace.controller.js";

export type WorkspaceRouteDependencies = WorkspaceControllerDependencies;

export const createWorkspaceRoutes = (dependencies: WorkspaceRouteDependencies) => {
  const router = Router();
  const controller = createWorkspaceController(dependencies);
  router.get("/workspace", controller.landing);
  router.post("/workspace", controller.create);
  return router;
};
