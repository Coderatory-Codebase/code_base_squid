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
  accountClosed: "account_closed"
} as const satisfies Readonly<Record<string, ApiErrorCode>>);
