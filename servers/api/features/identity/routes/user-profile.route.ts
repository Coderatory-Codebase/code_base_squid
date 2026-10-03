import { Router } from "express";
import { createUserProfileController, type UserProfileControllerDependencies } from "../controllers/index.js";

export type UserProfileRouteDependencies = UserProfileControllerDependencies;

export const createUserProfileRoutes = ({ principalResolver, gateway, recordProfileSignal }: UserProfileRouteDependencies) => {
  const router = Router();
  router.get("/identity/user-profile", createUserProfileController({
    principalResolver,
    gateway,
    ...(recordProfileSignal ? { recordProfileSignal } : {})
  }));
  return router;
};
