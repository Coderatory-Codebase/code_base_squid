import { Router, type Router as ExpressRouter } from "express";
import { createUserInvitationListController, type UserInvitationListControllerDependencies } from "../controllers/user-invitation.controller.js";
import { createUserInvitationMutationController, type UserInvitationMutationDependencies } from "../controllers/user-invitation-mutation.controller.js";

export type UserInvitationRouteDependencies = UserInvitationListControllerDependencies & UserInvitationMutationDependencies;

export const createUserInvitationRoutes = (dependencies: UserInvitationRouteDependencies): ExpressRouter => {
  const router = Router();
  router.get("/identity/user-invitations", createUserInvitationListController(dependencies));
  const mutation = createUserInvitationMutationController(dependencies);
  router.post("/identity/user-invitations", mutation);
  router.delete("/identity/user-invitations/:invitationId", mutation);
  router.post("/identity/user-invitations/:invitationId/:action", mutation);
  return router;
};
