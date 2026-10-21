import { ZodError } from "zod";
import { AppError, ErrorCode } from "./appErrors.js";

export interface NormalizedError {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

function formatZodDetails(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }

  return details;
}

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Please enter valid input",
      details: formatZodDetails(err),
    };
  }

  if (err instanceof SyntaxError && err.message.includes("JSON")) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Please enter valid inputs",
    };
  }

  if (err instanceof Error) {
    return {
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal serval error. Try again later.",
      details:
        process.env.NODE_ENV === "development"
          ? { name: err.name, stack: err.stack }
          : undefined,
    };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal serval error. Try again later.",
  };
}
