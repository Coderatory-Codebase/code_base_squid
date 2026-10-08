export const ERROR_MESSAGES = Object.freeze({
  internal: "An unexpected error occurred.",
  routeNotFound: "Route was not found.",
  validation: "Request validation failed.",
  unauthorized: "Sign in to view your organizations.",
  forbidden: "You are not allowed to perform this action."
} as const);
