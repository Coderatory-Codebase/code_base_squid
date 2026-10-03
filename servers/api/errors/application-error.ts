import type { ApplicationError } from "./types.js";

type ApplicationErrorInput = Omit<ApplicationError, "kind" | "name" | "stack">;

export const createApplicationError = (input: ApplicationErrorInput): ApplicationError => {
  const error = new Error(input.message);
  return Object.freeze(Object.assign(error, { kind: "application-error" as const, ...input }));
};

export const isApplicationError = (error: unknown): error is ApplicationError =>
  typeof error === "object" && error !== null && "kind" in error && error.kind === "application-error";
