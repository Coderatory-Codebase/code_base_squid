import { Router } from "express";
import { z } from "zod";
import { createOrganizationGateway, type OrganizationGateway } from "../db/organization.gateway.js";
import { createOrganizationController, type PrincipalResolver } from "../controllers/organization.controller.js";
import { createOrganizationService } from "../services/organization.service.js";

export const createOrganizationRoutes = ({
  gateway,
  resolvePrincipal
}: Readonly<{ gateway?: OrganizationGateway; resolvePrincipal: PrincipalResolver }>): Router => {
  const router = Router();
  const controller = createOrganizationController({
    service: createOrganizationService(gateway ?? createOrganizationGateway()),
    resolvePrincipal
  });
  router.get("/organizations", controller);
  router.post("/organizations", (request, _response, next) => {
    const parsed = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(request.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    request.body = parsed.data;
    next();
  }, controller);
  return router;
};
