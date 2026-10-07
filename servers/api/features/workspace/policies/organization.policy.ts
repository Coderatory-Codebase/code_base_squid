import type { Principal } from "../types.js";

export type PolicyDecision = Readonly<{
  action: string;
  subjectId: string;
  allowed: boolean;
}>;

export const decideOrganizationCreation = (principal: Principal): PolicyDecision => ({
  action: "organization:create",
  subjectId: principal.userId,
  allowed: principal.userId.length > 0
});
