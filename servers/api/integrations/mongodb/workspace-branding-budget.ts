import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import mongoose from "mongoose";
import {
  ORGANIZATION_BRANDING_LIST_INDEX_NAME,
  WorkspaceBrandingModel
} from "./workspace-branding.model.js";

const containsIndexName = (value: unknown, indexName: string): boolean => {
  if (Array.isArray(value)) return value.some((item) => containsIndexName(item, indexName));
  if (value === null || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) =>
    (key === "indexName" && child === indexName) || containsIndexName(child, indexName)
  );
};

const explainUsesIndex = (explain: unknown, indexName: string): boolean => {
  if (explain === null || typeof explain !== "object") return false;
  const document = explain as Readonly<Record<string, unknown>>;
  const planner = document.queryPlanner;
  const stats = document.executionStats;
  if (planner === null || typeof planner !== "object" || stats === null || typeof stats !== "object") return false;
  return containsIndexName((planner as Readonly<Record<string, unknown>>).winningPlan, indexName)
    && containsIndexName((stats as Readonly<Record<string, unknown>>).executionStages, indexName);
};

export const ORGANIZATION_BRANDING_TARGET_VOLUME = 50;
export const ORGANIZATION_BRANDING_BUDGET_MS = 700;
export const ORGANIZATION_BRANDING_MEASURED_REQUESTS = 200;

export const percentile95 = (samples: readonly number[]): number => {
  if (samples.length === 0) {
    throw new Error("At least one timing sample is required.");
  }
  const ordered = [...samples].sort((left, right) => left - right);
  return ordered[Math.ceil(ordered.length * 0.95) - 1] ?? Infinity;
};

export const runOrganizationBrandingBudgetMeasurement = async (
  uri: string
): Promise<Readonly<{
  measuredAt: string;
  workspaceOrganizations: number;
  requests: number;
  p95Ms: number;
  budgetMs: number;
  withinBudget: boolean;
  index: string;
}>> => {
  await mongoose.connect(uri, { autoIndex: false, serverSelectionTimeoutMS: 10_000 });
  const collectionName = `organization_branding_t5_${randomUUID().replaceAll("-", "")}`;
  const seededModel = mongoose.connection.model(
    `OrganizationBrandingT5_${randomUUID().replaceAll("-", "")}`,
    WorkspaceBrandingModel.schema,
    collectionName
  );

  try {
    await seededModel.createCollection();
    await seededModel.createIndexes();

    const workspaceId = `workspace-t5-${randomUUID()}`;
    const seed = Array.from({ length: ORGANIZATION_BRANDING_TARGET_VOLUME }, (_, index) => ({
      workspaceId,
      organizationId: `org-t5-${String(index + 1).padStart(2, "0")}`,
      logoUrl: null,
      accentColor: index % 2 === 0 ? "#1D4ED8" : "#7C3AED",
      deletedAt: null
    }));
    await seededModel.insertMany(seed, { ordered: true });

    const query = { workspaceId, deletedAt: null } as const;
    const projection = { _id: 0, organizationId: 1, logoUrl: 1, accentColor: 1 } as const;
    const plan = await seededModel.find(query, projection)
      .hint(ORGANIZATION_BRANDING_LIST_INDEX_NAME)
      .explain("executionStats");
    if (!explainUsesIndex(plan, ORGANIZATION_BRANDING_LIST_INDEX_NAME)) {
      throw new Error(`The seeded list query did not execute with ${ORGANIZATION_BRANDING_LIST_INDEX_NAME}.`);
    }

    const samples: number[] = [];
    for (let request = 0; request < ORGANIZATION_BRANDING_MEASURED_REQUESTS; request += 1) {
      const startedAt = performance.now();
      const records = await seededModel.find(query, projection)
        .hint(ORGANIZATION_BRANDING_LIST_INDEX_NAME)
        .lean()
        .exec();
      const elapsedMs = performance.now() - startedAt;
      if (records.length !== ORGANIZATION_BRANDING_TARGET_VOLUME) {
        throw new Error(`Expected ${String(ORGANIZATION_BRANDING_TARGET_VOLUME)} seeded organizations; received ${String(records.length)}.`);
      }
      samples.push(elapsedMs);
    }

    const p95Ms = Number(percentile95(samples).toFixed(2));
    return Object.freeze({
      measuredAt: new Date().toISOString(),
      workspaceOrganizations: ORGANIZATION_BRANDING_TARGET_VOLUME,
      requests: ORGANIZATION_BRANDING_MEASURED_REQUESTS,
      p95Ms,
      budgetMs: ORGANIZATION_BRANDING_BUDGET_MS,
      withinBudget: p95Ms <= ORGANIZATION_BRANDING_BUDGET_MS,
      index: ORGANIZATION_BRANDING_LIST_INDEX_NAME
    });
  } finally {
    await seededModel.collection.drop().catch(() => undefined);
    await mongoose.disconnect();
  }
};
