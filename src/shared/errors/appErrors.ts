export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "RATE_LIMIT_ERROR"
  | "INTERNAL_SERVER_ERROR"
  | "BAD_REQUEST";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code: ErrorCode = "INTERNAL_SERVER_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function createAppError(
  statusCode: number,
  message: string,
  code?: ErrorCode,
  details?: unknown,
): AppError {
  return new AppError(
    statusCode,
    message,
    code ?? inferCode(statusCode),
    details,
  );
}

function inferCode(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "AUTHENTICATION_ERROR";
    case 403:
      return "AUTHORIZATION_ERROR";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMIT_ERROR";
    default:
      return statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST";
  }
}

export const AppErrors = {
  badRequest: (message: string, details?: unknown) =>
    createAppError(400, message, "BAD_REQUEST", details),

  validation: (message: string, details?: unknown) =>
    createAppError(400, message, "VALIDATION_ERROR", details),

  unauthorized: (message: string) =>
    createAppError(401, message, "AUTHENTICATION_ERROR"),

  forbidden: (message = "You don't have access to this") =>
    createAppError(403, message, "AUTHORIZATION_ERROR"),

  notFound: (resource = "Information") =>
    createAppError(404, `${resource} not found`, "NOT_FOUND"),

  conflict: (message: string, details?: unknown) =>
    createAppError(409, message, "CONFLICT", details),

  database: (message = "Failed to store in database", details?: unknown) =>
    createAppError(400, message, "DATABASE_ERROR", details),

  tooManyRequest: (
    message = "Too many request. try again later",
    details?: unknown,
  ) => createAppError(429, message, "RATE_LIMIT_ERROR", details),

  internal: (message = "Internal server error") =>
    createAppError(500, message, "INTERNAL_SERVER_ERROR"),
};
