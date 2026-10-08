export type OrganizationSettingField =
  | "timeZone"
  | "weekStart"
  | "dateFormat"
  | "workspaceSetupRule";

export type OrganizationSettingError = Readonly<{
  code: "invalid_value";
  field: OrganizationSettingField;
}>;

export type Result<T, E> = Readonly<
  | { ok: true; value: T }
  | { ok: false; error: E }
>;

type SettingValue<T extends string> = Readonly<{
  value: T;
  source: "owner" | "default";
}>;

export type OrganizationSetting = Readonly<{
  timeZone: SettingValue<string>;
  weekStart: SettingValue<"Monday" | "Sunday">;
  dateFormat: SettingValue<"DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD">;
  workspaceSetupRule: SettingValue<"owner only" | "any member">;
}>;

const isTimeZone = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
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

const settingValue = <T extends string>(
  settings: Readonly<Record<string, unknown>>,
  field: OrganizationSettingField,
  fallback: T,
  isValid: (value: unknown) => value is T
): Result<SettingValue<T>, OrganizationSettingError> => {
  if (!Object.hasOwn(settings, field)) {
    return { ok: true, value: Object.freeze({ value: fallback, source: "default" }) };
  }

  const value = settings[field];
  if (!isValid(value)) {
    return { ok: false, error: Object.freeze({ code: "invalid_value", field }) };
  }

  return { ok: true, value: Object.freeze({ value, source: "owner" }) };
};

/** Resolves supported organization settings and their defaults without infrastructure dependencies. */
export const resolveOrganizationSetting = (
  settings: Readonly<Record<string, unknown>> | null | undefined
): Result<OrganizationSetting, OrganizationSettingError> => {
  const values = settings ?? {};
  const timeZone = settingValue(values, "timeZone", "UTC", isTimeZone);
  if (!timeZone.ok) return timeZone;

  const weekStart = settingValue(values, "weekStart", "Monday", isWeekStart);
  if (!weekStart.ok) return weekStart;

  const dateFormat = settingValue(values, "dateFormat", "DD/MM/YYYY", isDateFormat);
  if (!dateFormat.ok) return dateFormat;

  const workspaceSetupRule = settingValue(values, "workspaceSetupRule", "any member", isWorkspaceSetupRule);
  if (!workspaceSetupRule.ok) return workspaceSetupRule;

  return {
    ok: true,
    value: Object.freeze({
      timeZone: timeZone.value,
      weekStart: weekStart.value,
      dateFormat: dateFormat.value,
      workspaceSetupRule: workspaceSetupRule.value
    })
  };
};
