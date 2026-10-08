import { performance } from "node:perf_hooks";
import type { Logger } from "@workspace/logging";
import { OrganizationModel, normalizeOrganizationId } from "../integrations/organization.model.js";
import type { QueryPlanExplanation } from "./organization.gateway.js";
import type { Principal } from "../types.js";
import { resolveOrganizationSetting, type OrganizationSetting } from "../domain/organization-setting.js";

export type OrganizationSettingsPatch = Readonly<{
  timeZone?: string | undefined;
  weekStart?: "Monday" | "Sunday" | undefined;
  dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | undefined;
  workspaceSetupRule?: "owner only" | "any member" | undefined;
}>;

export type OrganizationSettingsVersionedValue = Readonly<{
  settings: OrganizationSetting;
  version: number;
}>;

export type OrganizationSettingsActor = Readonly<{
  kind: "user";
  role: "owner" | "admin" | "member";
  guest: false;
}>;

export type OrganizationSettingsUpdateResult =
  | Readonly<{ status: "updated"; current: OrganizationSettingsVersionedValue }>
  | Readonly<{ status: "conflict"; current: OrganizationSettingsVersionedValue | null }>
  | Readonly<{ status: "invalid"; field: string }>;

type SettingsMutationDocument = Readonly<{
  ownerId: string;
  members?: readonly Readonly<{ userId: string; role: "admin" | "member" }>[];
  settings?: Readonly<Record<string, unknown>>;
  version?: number;
}>;

type SettingsMutationQuery<T> = Readonly<{
  select: (projection: Readonly<Record<string, 1>>) => SettingsMutationQuery<T>;
  lean: () => Readonly<{ exec: () => Promise<T> }>;
}>;

type SettingsMutationModel = Readonly<{
  findOne: (filter: Readonly<Record<string, unknown>>) => SettingsMutationQuery<SettingsMutationDocument | null>;
  findOneAndUpdate: (
    filter: Readonly<Record<string, unknown>>,
    update: Readonly<Record<string, unknown>>,
    options: Readonly<Record<string, unknown>>
  ) => SettingsMutationQuery<SettingsMutationDocument | null>;
}>;

const mutationModel = OrganizationModel as unknown as SettingsMutationModel;

const toVersionedValue = (document: SettingsMutationDocument): OrganizationSettingsVersionedValue => {
  const resolved = resolveOrganizationSetting(document.settings ?? {});
  if (!resolved.ok) throw new Error(`Organization setting "${resolved.error.field}" has an invalid stored value.`);
  return { settings: resolved.value, version: document.version ?? 1 };
};

export const resolveOrganizationSettingsActor = async (
  organizationId: string,
  principal: Principal
): Promise<OrganizationSettingsActor | null> => {
  const organization = await mutationModel.findOne({ _id: organizationId, deletedAt: null })
    .select({ ownerId: 1, members: 1 })
    .lean()
    .exec();
  if (!organization) return null;
  if (organization.ownerId === principal.userId) return { kind: "user", role: "owner", guest: false };
  const member = organization.members?.find(({ userId }) => userId === principal.userId);
  return member ? { kind: "user", role: member.role, guest: false } : null;
};

export const updateOrganizationSettingsForOwner = async (
  organizationId: string,
  principal: Principal,
  expectedVersion: number,
  settings: OrganizationSettingsPatch
): Promise<OrganizationSettingsUpdateResult> => {
  const organizationFilter = { _id: organizationId, ownerId: principal.userId, deletedAt: null };
  const existing = await mutationModel.findOne(organizationFilter)
    .select({ settings: 1, version: 1 })
    .lean()
    .exec();
  if (!existing) return { status: "conflict", current: null };

  const merged = resolveOrganizationSetting({ ...(existing.settings ?? {}), ...settings });
  if (!merged.ok) return { status: "invalid", field: merged.error.field };

  const set = Object.fromEntries(Object.entries(settings).map(([field, value]) => [`settings.${field}`, value]));
  const updated = await mutationModel.findOneAndUpdate(
    { ...organizationFilter, version: expectedVersion },
    { $set: set, $inc: { version: 1 } },
    { new: true, runValidators: true }
  ).lean().exec();
  if (updated) return { status: "updated", current: toVersionedValue(updated) };

  const current = await mutationModel.findOne(organizationFilter)
    .select({ settings: 1, version: 1 })
    .lean()
    .exec();
  return { status: "conflict", current: current ? toVersionedValue(current) : null };
};

export type OrganizationSettings = Readonly<OrganizationSetting & {
  organizationId: string;
  name: string;
  version: number;
  canUpdate: boolean;
}>;

export const buildOrganizationSettingsQueryFor = (principal: Principal) => {
  const query = OrganizationModel.find();
  query.where("deletedAt").equals(null);
  query.where("workspaceIds").in([...principal.workspaceIds]);

  return query.select({ settings: 1, _id: 1, ownerId: 1, version: 1, name: 1 });
};

export const buildOrganizationOwnerSettingsQueryFor = (principal: Principal) => {
  const query = OrganizationModel.find();
  query.where("deletedAt").equals(null);
  query.where("ownerId").equals(principal.userId);

  return query.select({ settings: 1, _id: 1, ownerId: 1, version: 1, name: 1 });
};

export const organizationSettingsFor = (principal: Principal) =>
  (async () => {
    const workspaceQuery = principal.workspaceIds.length > 0
      ? buildOrganizationSettingsQueryFor(principal).lean().exec()
      : Promise.resolve([]);
    const [workspaceOrganizations, ownedOrganizations] = await Promise.all([
      workspaceQuery,
      buildOrganizationOwnerSettingsQueryFor(principal).lean().exec()
    ]);
    const organizationsById = new Map<string, (typeof ownedOrganizations)[number]>();
    for (const organization of [...workspaceOrganizations, ...ownedOrganizations]) {
      organizationsById.set(normalizeOrganizationId(organization._id), organization);
    }
    return [...organizationsById.values()];
  })();

export const settingsOf = async (
  principal: Principal,
  logger: Logger,
): Promise<readonly OrganizationSettings[]> => {
  const startedAt = performance.now();
  const signalContext = {
    module: "workspace",
    feature: "organization-settings",
    operation: "read",
    workspaceIds: [...principal.workspaceIds]
  } as const;

  try {
    const organizations = await organizationSettingsFor(principal);
    const result: OrganizationSettings[] = [];
    for (const organization of organizations) {
      const resolved = resolveOrganizationSetting(organization.settings);
      if (!resolved.ok) {
        throw new Error(`Organization setting "${resolved.error.field}" has an invalid stored value`);
      }
      result.push({
        ...resolved.value,
        organizationId: normalizeOrganizationId(organization._id),
        name: organization.name,
        version: organization.version ?? 1,
        canUpdate: organization.ownerId === principal.userId
      });
    }

    logger.info("Organization settings read completed.", {
      ...signalContext,
      outcome: "success",
      durationMs: performance.now() - startedAt,
    });
    return result;
  } catch (error) {
    logger.error("Organization settings read failed.", {
      ...signalContext,
      outcome: "failure",
      durationMs: performance.now() - startedAt,
      reason: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
};

export const explainOrganizationSettingsQueryFor = async (
  principal: Principal
): Promise<QueryPlanExplanation> => {
  const explanation: unknown = await buildOrganizationSettingsQueryFor(principal)
    .explain("queryPlanner")
    .exec();
  if (
    typeof explanation !== "object" ||
    explanation === null ||
    !("queryPlanner" in explanation)
  ) {
    throw new Error("MongoDB explain returned an unexpected settings query plan shape");
  }

  return explanation as QueryPlanExplanation;
};

export const explainOrganizationOwnerSettingsQueryFor = async (
  principal: Principal
): Promise<QueryPlanExplanation> => {
  const explanation: unknown = await buildOrganizationOwnerSettingsQueryFor(principal)
    .explain("queryPlanner")
    .exec();
  if (
    typeof explanation !== "object" ||
    explanation === null ||
    !("queryPlanner" in explanation)
  ) {
    throw new Error("MongoDB explain returned an unexpected owner settings query plan shape");
  }

  return explanation as QueryPlanExplanation;
};
