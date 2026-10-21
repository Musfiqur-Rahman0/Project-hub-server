import type { Response, Request, NextFunction } from "express";
import { normalizeError } from "../shared/errors/normalizeError.js";
import { sendError } from "../shared/utils/sendError.js";

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  const normalized = normalizeError(err);

  if (normalized.statusCode >= 500) {
    console.log(
      "[SERVER ERROR]",
      normalized.code,
      normalized.message,
      normalized.details,
    );
  }

  return sendError(
    res,
    normalized.statusCode,
    normalized.code,
    normalized.message,
    normalized.details,
  );
}
