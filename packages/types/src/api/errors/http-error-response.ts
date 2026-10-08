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
  | "principal_unavailable";
export type ApiErrorDetails = Readonly<Record<string, unknown>> | readonly unknown[];

export type ApiErrorResponse = Readonly<{
  error: Readonly<{
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetails;
  }>;
}>;
