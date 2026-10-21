import type { NextFunction, Request, Response } from "express";
import { AppErrors } from "../shared/errors/appErrors.js";

const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  void req;
  void res;
  next(AppErrors.notFound("Not Found"));
};

export default notFoundHandler;
