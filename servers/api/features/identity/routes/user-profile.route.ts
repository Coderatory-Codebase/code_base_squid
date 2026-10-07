import { Router } from "express";
import { createUserProfileController, createUpdateUserProfileController, type UserProfileControllerDependencies } from "../controllers/index.js";

export type UserProfileRouteDependencies = UserProfileControllerDependencies;

export const createUserProfileRoutes = ({ principalResolver, gateway, recordProfileSignal }: UserProfileRouteDependencies) => {
  const router = Router();
  router.get("/identity/user-profile", createUserProfileController({
    principalResolver,
    gateway,
    ...(recordProfileSignal ? { recordProfileSignal } : {})
  }));
  router.put("/identity/user-profile", createUpdateUserProfileController({ principalResolver, gateway }));
  return router;
};
