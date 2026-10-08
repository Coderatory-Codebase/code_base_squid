export type { Principal } from "../../types/index.js";

export type OrganizationSummary = Readonly<{ id: string; name: string }>;
export type OrganizationListSummary = OrganizationSummary & Readonly<{
  status: "active" | "archived";
  archivedAt: Date | null;
}>;
export type OrganizationPage<T> = Readonly<{
  organizations: readonly T[];
  nextOffset: number | null;
}>;
export type OrganizationRole = "admin" | "member";
