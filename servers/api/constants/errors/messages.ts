export const ERROR_MESSAGES = Object.freeze({
  internal: "An unexpected error occurred.",
  routeNotFound: "Route was not found.",
  validation: "Request validation failed.",
  unauthorized: "Sign in required.",
  notFound: "Resource not found.",
  serviceUnavailable: "Service unavailable."
} as const);
