export type { Principal } from "../../types/index.js";

export type OrganizationSummary = Readonly<{ id: string; name: string }>;
export type OrganizationRole = "admin" | "member";
