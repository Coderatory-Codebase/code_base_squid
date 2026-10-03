export type ApiErrorCode =
  | "internal_error"
  | "route_not_found"
  | "validation_error"
  | "unauthenticated"
  | "no_active_workspace"
  | "workspace_selection_required"
  | "user_profile_not_found"
  | "invalid_sign_in"
  | "provider_unavailable"
  | "account_closed";

export type ApiErrorDetails = Readonly<Record<string, unknown>> | readonly unknown[];

export type ApiErrorResponse = Readonly<{
  error: Readonly<{
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetails;
  }>;
}>;
