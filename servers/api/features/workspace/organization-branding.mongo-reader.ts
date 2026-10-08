import {
  ORGANIZATION_BRANDING_INDEX_NAME,
  ORGANIZATION_BRANDING_LIST_INDEX_NAME,
  workspaceBrandingMongoQueries
} from "../../integrations/index.js";
import type { OrganizationBrandingQuery, OrganizationBrandingReader } from "./organization-branding.gateway.js";

export const organizationBrandingMongoReader: OrganizationBrandingReader = Object.freeze({
  findMany: (query: OrganizationBrandingQuery) => workspaceBrandingMongoQueries.findMany(query)
});

export const explainOrganizationBrandingQuery = (
  query: OrganizationBrandingQuery
): Promise<unknown> => workspaceBrandingMongoQueries.explain(query);

const containsIndexName = (value: unknown, indexName: string): boolean => {
  if (Array.isArray(value)) {
    return value.some((item) => containsIndexName(item, indexName));
  }
  if (value === null || typeof value !== "object") {
    return false;
  }
  return Object.entries(value).some(([key, child]) =>
    (key === "indexName" && child === indexName) || containsIndexName(child, indexName)
  );
};

export const explainUsesOrganizationBrandingIndex = (
  explain: unknown,
  indexName: string = ORGANIZATION_BRANDING_INDEX_NAME
): boolean => {
  if (explain === null || typeof explain !== "object") {
    return false;
  }
  const document = explain as Readonly<Record<string, unknown>>;
  const planner = document.queryPlanner;
  const stats = document.executionStats;
  if (planner === null || typeof planner !== "object" || stats === null || typeof stats !== "object") {
    return false;
  }
  const winningPlan = (planner as Readonly<Record<string, unknown>>).winningPlan;
  const stages = (stats as Readonly<Record<string, unknown>>).executionStages;
  return containsIndexName(winningPlan, indexName)
    && containsIndexName(stages, indexName);
};

export const explainUsesOrganizationBrandingListIndex = (explain: unknown): boolean =>
  explainUsesOrganizationBrandingIndex(explain, ORGANIZATION_BRANDING_LIST_INDEX_NAME);

export const assertOrganizationBrandingIndexInUse = async (
  query: OrganizationBrandingQuery
): Promise<unknown> => {
  const plan = await explainOrganizationBrandingQuery(query);
  if (!explainUsesOrganizationBrandingIndex(plan)) {
    throw new Error(`MongoDB did not use the ${ORGANIZATION_BRANDING_INDEX_NAME} index.`);
  }
  return plan;
};
