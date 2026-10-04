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
  forbidden: "You do not have access to this workspace.",
  principalUnavailable: "Identity or workspace data is temporarily unavailable. Retry the request."
} as const);
