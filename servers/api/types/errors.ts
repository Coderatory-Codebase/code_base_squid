import type { ERROR_CODES } from "../constants/errors.js";
import type { HTTP_STATUS } from "../constants/http.js";

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export type ErrorDetails = Readonly<Record<string, unknown>>;

export type ApplicationError = Readonly<{
  kind: "application-error";
  code: ErrorCode;
  message: string;
  status: HttpStatus;
  details?: ErrorDetails;
}>;

export type ErrorResponse = Readonly<{
  error: Readonly<{
    code: ErrorCode;
    message: string;
    details?: ErrorDetails | readonly unknown[];
  }>;
}>;
