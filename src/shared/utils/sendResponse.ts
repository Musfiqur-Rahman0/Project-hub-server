import { Response } from "express";

import { ApiSuccessResponse } from "./api.interface.js";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const body: ApiSuccessResponse<T> = { success: true, data, message };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}
