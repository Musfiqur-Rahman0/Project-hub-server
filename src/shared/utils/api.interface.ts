import { ErrorCode } from "../errors/appErrors.js";

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}
