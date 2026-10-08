import { createApplicationError } from "../../../errors/index.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createCommandBus, createCommandFactory } from "../../../kernel/index.js";
import type { Principal } from "../../../types/index.js";
import {
  resolveOrganizationSettingsActor,
  updateOrganizationSettingsForOwner,
  type OrganizationSettingsPatch,
  type OrganizationSettingsUpdateResult,
  type OrganizationSettingsVersionedValue
} from "../db/organization-setting.gateway.js";
import {
  createWorkspacePolicyEvaluator,
  ORGANIZATION_SETTINGS_UPDATE_COMMAND
} from "../policies/organization-settings.policy.js";

export type OrganizationSettingsUpdateInput = Readonly<{
  organizationId: string;
  expectedVersion: number;
  settings: OrganizationSettingsPatch;
}>;

export type OrganizationSettingsUpdateServiceResult =
  | Readonly<{ ok: true; value: OrganizationSettingsVersionedValue }>
  | Readonly<{
      ok: false;
      error:
        | Readonly<{ code: "conflict"; current: OrganizationSettingsVersionedValue | null }>
        | Readonly<{ code: "invalid_value"; field: string }>;
    }>;

export type OrganizationSettingsUpdater = Readonly<{
  update: (
    principal: Principal,
    input: OrganizationSettingsUpdateInput
  ) => Promise<OrganizationSettingsUpdateServiceResult>;
}>;

const isUpdateResult = (value: unknown): value is OrganizationSettingsUpdateResult =>
  typeof value === "object" && value !== null && "status" in value
  && (value.status === "updated" || value.status === "conflict" || value.status === "invalid");

const mapUpdateResult = (result: OrganizationSettingsUpdateResult): OrganizationSettingsUpdateServiceResult => {
  if (result.status === "updated") return { ok: true, value: result.current };
  if (result.status === "conflict") return { ok: false, error: { code: "conflict", current: result.current } };
  return { ok: false, error: { code: "invalid_value", field: result.field } };
};

/** Applies an owner-only update through a policy-bound command and an optimistic version check. */
export const createOrganizationSettingsUpdater = (): OrganizationSettingsUpdater => ({
  update: async (principal, input) => {
    const buildCommand = createCommandFactory({
      evaluate: createWorkspacePolicyEvaluator({
        resolveActor: () => resolveOrganizationSettingsActor(input.organizationId, principal)
      })
    });
    const command = await buildCommand({
      name: ORGANIZATION_SETTINGS_UPDATE_COMMAND,
      payload: input,
      principal: { userId: principal.userId, workspaceId: input.organizationId }
    });
    const bus = createCommandBus({
      handlers: {
        [ORGANIZATION_SETTINGS_UPDATE_COMMAND]: async () => await updateOrganizationSettingsForOwner(
          input.organizationId,
          principal,
          input.expectedVersion,
          input.settings
        )
      },
      logger: { warn: () => undefined }
    });
    const result: unknown = await bus.dispatch(command);
    if (!isUpdateResult(result)) {
      throw createApplicationError({
        code: ERROR_CODES.internal,
        message: ERROR_MESSAGES.internal,
        status: HTTP_STATUS.internalServerError
      });
    }
    return mapUpdateResult(result);
  }
});
