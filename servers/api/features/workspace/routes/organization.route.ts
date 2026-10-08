import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import type { Logger } from "@workspace/logging";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import { createOrganizationRbacMiddleware } from "../../../middleware/rbac.middleware.js";
import { createOrganizationGateway, type OrganizationGateway } from "../db/organization.gateway.js";
import { createOrganizationController, type PrincipalResolver } from "../controllers/organization.controller.js";
import { createMembersController } from "../controllers/members.controller.js";
import { createOrganizationRequestSignal } from "./organization-signal.js";
import { createOrganizationService } from "../services/organization.service.js";
import { createMembersService, type MembersService } from "../services/members.service.js";
import {
  createOrganizationSettingsController,
  type OrganizationSettingsReader
} from "../controllers/organization-settings.controller.js";
import { createOrganizationSettingsUpdateController } from "../controllers/organization-settings-update.controller.js";
import { createOrganizationSettingsUpdater, type OrganizationSettingsUpdater } from "../services/organization-settings.service.js";

const parseBody = (schema: z.ZodType) => (request: Request, _response: Response, next: NextFunction): void => {
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    next(createApplicationError({
      code: ERROR_CODES.validation,
      message: ERROR_MESSAGES.validation,
      status: HTTP_STATUS.badRequest
    }) as Error);
    return;
  }
  request.body = parsed.data;
  next();
};

export const createOrganizationRoutes = ({
  gateway,
  resolvePrincipal,
  membersService,
  settingsReader,
  settingsUpdater,
  webOrigin,
  logger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined
  }
}: Readonly<{
  gateway?: OrganizationGateway;
  membersService?: MembersService;
  settingsReader?: OrganizationSettingsReader;
  settingsUpdater?: OrganizationSettingsUpdater;
  resolvePrincipal: PrincipalResolver;
  webOrigin: string;
  logger?: Pick<Logger, "info" | "warn" | "error">;
}>): Router => {
  const router = Router();
  const team = membersService ?? createMembersService();
  const organizationController = createOrganizationController({
    service: createOrganizationService(gateway ?? createOrganizationGateway()),
    resolvePrincipal
  });
  const membersController = createMembersController({ service: team, resolvePrincipal, webOrigin });
  const organizationSettingsController = createOrganizationSettingsController({
    resolvePrincipal,
    logger,
    ...(settingsReader ? { readSettings: settingsReader } : {})
  });
  const organizationSettingsUpdateController = createOrganizationSettingsUpdateController({
    updater: settingsUpdater ?? createOrganizationSettingsUpdater(),
    resolvePrincipal
  });
  const requireManager = createOrganizationRbacMiddleware({
    membersService: team,
    resolvePrincipal,
    allowedRoles: ["owner", "admin"]
  });
  const invitationSchema = z.object({
    email: z.email().max(254),
    role: z.enum(["admin", "member"])
  });
  const acceptInvitationSchema = z.object({ token: z.string().min(40).max(60) });
  const roleSchema = z.object({ role: z.enum(["admin", "member"]) });
  const organizationSettingsPatchSchema = z.object({
    expectedVersion: z.number().int().positive(),
    settings: z.object({
      timeZone: z.string().trim().min(1).optional(),
      weekStart: z.string().trim().min(1).optional(),
      dateFormat: z.string().trim().min(1).optional(),
      workspaceSetupRule: z.string().trim().min(1).optional()
    }).strict().refine((settings) => Object.keys(settings).length > 0, {
      message: "At least one organization setting must be provided."
    })
  }).strict();

  router.use("/organizations", createOrganizationRequestSignal({ logger }));
  router.get("/workspace/organization-settings", organizationSettingsController);
  router.patch("/organizations/:organizationId/settings", parseBody(organizationSettingsPatchSchema), organizationSettingsUpdateController);
  router.get("/organizations", organizationController);
  router.post("/organizations", parseBody(z.object({ name: z.string().trim().min(1).max(80) })), organizationController);
  router.get("/organizations/:organizationId/dashboard", membersController.getDashboard);
  router.post("/organizations/:organizationId/invitations", parseBody(invitationSchema), requireManager, membersController.createInvitation);
  router.post("/organizations/invitations/accept", parseBody(acceptInvitationSchema), membersController.acceptInvitation);
  router.patch("/organizations/:organizationId/members/:memberId", parseBody(roleSchema), requireManager, membersController.updateMemberRole);
  router.delete("/organizations/:organizationId/members/:memberId", requireManager, membersController.removeMember);
  return router;
};
