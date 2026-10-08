import type { Principal } from "../types.js";

export type OrganizationLifecyclePolicyDecision = Readonly<{
  action: "organization:archive" | "organization:restore" | "organization:delete";
  subjectId: string;
  allowed: boolean;
}>;

export const decideOrganizationLifecycle = (
  principal: Principal,
  ownerId: string,
  action: "archive" | "restore" | "delete"
): OrganizationLifecyclePolicyDecision => ({
  action: `organization:${action}`,
  subjectId: principal.userId,
  allowed: principal.userId.length > 0 && principal.userId === ownerId
});
