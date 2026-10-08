import { performance } from "node:perf_hooks";
import type { Logger } from "@workspace/logging";
import { OrganizationModel } from "../integrations/organization.model.js";
import type { QueryPlanExplanation } from "./organization.gateway.js";
import type { Principal } from "../types.js";

export type OrganizationSettings = Readonly<{
  timeZone: Readonly<{ value: string; source: "owner" | "default" }>;
  weekStart: Readonly<{ value: "Monday" | "Sunday"; source: "owner" | "default" }>;
  dateFormat: Readonly<{
    value: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
    source: "owner" | "default";
  }>;
  workspaceSetupRule: Readonly<{ value: "owner only" | "any member"; source: "owner" | "default" }>;
}>;

const hasValue = <T extends string>(
  settings: Readonly<Record<string, unknown>>,
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T
): Readonly<{ value: T; source: "owner" | "default" }> => {
  if (!Object.hasOwn(settings, key)) {
    return { value: fallback, source: "default" };
  }

  const value = settings[key];
  if (!isValid(value)) {
    throw new Error(`Organization setting "${key}" has an invalid stored value`);
  }

  return { value, source: "owner" };
};

const isTimeZone = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const isWeekStart = (value: unknown): value is "Monday" | "Sunday" =>
  value === "Monday" || value === "Sunday";

const isDateFormat = (
  value: unknown
): value is "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" =>
  value === "DD/MM/YYYY" || value === "MM/DD/YYYY" || value === "YYYY-MM-DD";

const isWorkspaceSetupRule = (value: unknown): value is "owner only" | "any member" =>
  value === "owner only" || value === "any member";

export const buildOrganizationSettingsQueryFor = (principal: Principal) => {
  const workspaceIds = principal.workspaceIds ?? [];
  const query = OrganizationModel.find();
  query.where("deletedAt").equals(null);
  query.where("workspaceIds").in([...workspaceIds]);

  return query.select({ settings: 1, _id: 0 });
};

export const organizationSettingsFor = (principal: Principal) =>
  buildOrganizationSettingsQueryFor(principal).lean().exec();

export const settingsOf = async (
  principal: Principal,
  logger: Logger,
): Promise<readonly OrganizationSettings[]> => {
  const startedAt = performance.now();

  try {
    const organizations = await organizationSettingsFor(principal);
    const result = organizations.map(({ settings }) => ({
      timeZone: hasValue(settings, "timeZone", "UTC", isTimeZone),
      weekStart: hasValue(settings, "weekStart", "Monday", isWeekStart),
      dateFormat: hasValue(settings, "dateFormat", "DD/MM/YYYY", isDateFormat),
      workspaceSetupRule: hasValue(settings, "workspaceSetupRule", "any member", isWorkspaceSetupRule),
    }));

    logger.info("Organization settings read completed.", {
      module: "workspace",
      feature: "organization-settings",
      workspaceIds: [...(principal.workspaceIds ?? [])],
      outcome: "success",
      durationMs: performance.now() - startedAt,
    });
    return result;
  } catch (error) {
    logger.error("Invalid organization settings", {
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
