export type ApiErrorCode =
  | "internal_error"
  | "route_not_found"
  | "validation_error"
  | "WORKSPACE_REQUIRED"
  | "VERSION_CONFLICT"
  | "policy_decision_required"
  | "policy_denied"
  | "policy_unavailable";

export type ApiErrorDetails = Readonly<Record<string, unknown>> | readonly unknown[];

export type ApiErrorResponse = Readonly<{
  error: Readonly<{
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetails;
  }>;
}>;
