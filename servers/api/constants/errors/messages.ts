export const ERROR_MESSAGES = Object.freeze({
  internal: "An unexpected error occurred.",
  routeNotFound: "Route was not found.",
  validation: "Request validation failed.",
  unauthenticated: "Sign in to view this profile.",
  noActiveWorkspace: "No active workspace is available for this account.",
  workspaceSelectionRequired: "Select an active workspace before viewing this profile.",
  userProfileNotFound: "The user profile could not be found.",
  invalidSignIn: "Sign-in was cancelled or its token was invalid. Sign in again.",
  providerUnavailable: "The identity provider is unavailable. Try again.",
  accountClosed: "This account is closed. Contact your organization administrator."
} as const);
