import type { ApiErrorCode, ApiErrorDetails } from "@workspace/types";
import type { ERROR_CODES } from "../constants/errors.js";
import type { HTTP_STATUS } from "../constants/http.js";

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

type ServerErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type ApplicationError = Readonly<{
  kind: "application-error";
  code: ServerErrorCode & ApiErrorCode;
  message: string;
  status: HttpStatus;
  details?: ApiErrorDetails;
}>;
