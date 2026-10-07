import { performance } from "node:perf_hooks";

export const ORGANIZATION_BRANDING_READ_BUDGET_MS = 700;
export const ORGANIZATION_BRANDING_READ_SIGNAL_NAME = "organization_branding.read";

export type OrganizationBrandingReadSignal = Readonly<{
  event: typeof ORGANIZATION_BRANDING_READ_SIGNAL_NAME;
  outcome: "success" | "error";
  durationMs: number;
  resultCount: number;
  budgetMs: typeof ORGANIZATION_BRANDING_READ_BUDGET_MS;
  withinBudget: boolean;
}>;

type ReadTelemetryOptions = Readonly<{
  emit: (signal: OrganizationBrandingReadSignal) => void;
  now?: () => number;
}>;

export const observeOrganizationBrandingRead = async <T extends readonly unknown[]>(
  read: () => Promise<T>,
  { emit, now = () => performance.now() }: ReadTelemetryOptions
): Promise<T> => {
  const startedAt = now();
  try {
    const records = await read();
    const durationMs = Math.max(0, now() - startedAt);
    emit(Object.freeze({
      event: ORGANIZATION_BRANDING_READ_SIGNAL_NAME,
      outcome: "success",
      durationMs,
      resultCount: records.length,
      budgetMs: ORGANIZATION_BRANDING_READ_BUDGET_MS,
      withinBudget: durationMs <= ORGANIZATION_BRANDING_READ_BUDGET_MS
    }));
    return records;
  } catch (error) {
    const durationMs = Math.max(0, now() - startedAt);
    emit(Object.freeze({
      event: ORGANIZATION_BRANDING_READ_SIGNAL_NAME,
      outcome: "error",
      durationMs,
      resultCount: 0,
      budgetMs: ORGANIZATION_BRANDING_READ_BUDGET_MS,
      withinBudget: durationMs <= ORGANIZATION_BRANDING_READ_BUDGET_MS
    }));
    throw error;
  }
};
