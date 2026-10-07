import type { ApiErrorCode } from "@workspace/types";

export const ERROR_CODES = Object.freeze({
  internal: "internal_error",
  routeNotFound: "route_not_found",
  validation: "validation_error",
  unauthenticated: "unauthenticated",
  noActiveWorkspace: "no_active_workspace",
  workspaceSelectionRequired: "workspace_selection_required",
  userProfileNotFound: "user_profile_not_found",
  invalidSignIn: "invalid_sign_in",
  providerUnavailable: "provider_unavailable",
  accountClosed: "account_closed",
  conflict: "conflict",
  profileUpdateForbidden: "profile_update_forbidden",
  sessionNotFound: "session_not_found",
  workspaceRequired: "WORKSPACE_REQUIRED",
  versionConflict: "VERSION_CONFLICT",
  policyDecisionRequired: "policy_decision_required",
  policyDenied: "policy_denied",
  policyUnavailable: "policy_unavailable",
  forbidden: "forbidden",
  principalUnavailable: "principal_unavailable"
} as const satisfies Readonly<Record<string, ApiErrorCode>>);
