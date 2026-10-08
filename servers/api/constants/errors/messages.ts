export const ERROR_MESSAGES = Object.freeze({
  internal: "An unexpected error occurred.",
  routeNotFound: "Route was not found.",
  validation: "Request validation failed.",
  workspaceRequired: "A workspace is required.",
  versionConflict: "The resource was changed by another request.",
  policyDecisionRequired: "Command was refused because it carries no principal or policy decision.",
  policyDenied: "The policy decision does not allow this command.",
  policyUnavailable: "Policy is temporarily unavailable. Retry the request.",
  unauthenticated: "Authentication is required.",
  unauthorized: "Sign in to view your organizations.",
  forbidden: "You are not allowed to perform this action.",
  principalUnavailable: "Identity or workspace data is temporarily unavailable. Retry the request.",
  notFound: "The requested resource was not found.",
  conflict: "The resource conflicts with the current state."
} as const);
