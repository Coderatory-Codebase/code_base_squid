import type { ApiErrorCode } from "@workspace/types";

export const ERROR_CODES = Object.freeze({
  internal: "internal_error",
  routeNotFound: "route_not_found",
  validation: "validation_error",
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  notFound: "not_found",
  conflict: "conflict",
  workspaceRequired: "WORKSPACE_REQUIRED",
  versionConflict: "VERSION_CONFLICT",
  policyDecisionRequired: "policy_decision_required",
  policyDenied: "policy_denied",
  policyUnavailable: "policy_unavailable",
  unauthenticated: "unauthenticated",
  noActiveWorkspace: "no_active_workspace",
  workspaceSelectionRequired: "workspace_selection_required",
  userProfileNotFound: "user_profile_not_found",
  invalidSignIn: "invalid_sign_in",
  providerUnavailable: "provider_unavailable",
  accountClosed: "account_closed",
  profileUpdateForbidden: "profile_update_forbidden",
  sessionNotFound: "session_not_found",
  principalUnavailable: "principal_unavailable",
  serviceUnavailable: "service_unavailable"
} as const satisfies Readonly<Record<string, ApiErrorCode>>);
