import type { ApiErrorCode } from "@workspace/types";

export const ERROR_CODES = Object.freeze({
  internal: "internal_error",
  routeNotFound: "route_not_found",
  validation: "validation_error",
  workspaceRequired: "WORKSPACE_REQUIRED",
  versionConflict: "VERSION_CONFLICT",
  policyDecisionRequired: "policy_decision_required",
  policyDenied: "policy_denied",
  policyUnavailable: "policy_unavailable",
  unauthenticated: "unauthenticated",
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  principalUnavailable: "principal_unavailable",
  notFound: "not_found",
  conflict: "conflict"
} as const satisfies Readonly<Record<string, ApiErrorCode>>);
