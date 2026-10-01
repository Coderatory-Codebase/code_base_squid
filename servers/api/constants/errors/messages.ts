export const ERROR_MESSAGES = Object.freeze({
  internal: "An unexpected error occurred.",
  routeNotFound: "Route was not found.",
  validation: "Request validation failed.",
  workspaceRequired: "A workspace is required.",
  versionConflict: "The resource was changed by another request."
} as const);
