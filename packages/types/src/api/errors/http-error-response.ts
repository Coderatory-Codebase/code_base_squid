export type ApiErrorCode =
  | "internal_error"
  | "route_not_found"
  | "validation_error"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "service_unavailable"
  | "WORKSPACE_REQUIRED"
  | "VERSION_CONFLICT"
  | "policy_decision_required"
  | "policy_denied"
  | "policy_unavailable"
  | "unauthenticated"
  | "forbidden"
  | "principal_unavailable"
  | "no_active_workspace"
  | "workspace_selection_required"
  | "user_profile_not_found"
  | "invalid_sign_in"
  | "provider_unavailable"
  | "account_closed"
  | "profile_update_forbidden"
  | "session_not_found";
export type ApiErrorDetails = Readonly<Record<string, unknown>> | readonly unknown[];

export type ApiErrorResponse = Readonly<{
  error: Readonly<{
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetails;
  }>;
}>;
