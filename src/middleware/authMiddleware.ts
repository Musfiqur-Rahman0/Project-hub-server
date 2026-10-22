import { NextFunction, Response, Request } from "express";
import { ACCESS_COOKIE_NAME, parseCookies } from "../lib/cookie.js";
import { AppErrors } from "../shared/errors/appErrors.js";
import { verifyAuthToken } from "../modules/auth/auth.service.js";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authorization = req.get("authorization");
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearerToken ?? parseCookies(req)[ACCESS_COOKIE_NAME];

  if (!token) {
    return next(AppErrors.unauthorized("Forbidden access"));
  }

  try {
    const payload = verifyAuthToken(token);
    if (payload.tokenType !== "access") {
      return next(AppErrors.unauthorized("Invalid access token"));
    }

    req.user = { userId: payload.userId };
    return next();
  } catch (error) {
    return next(error);
  }
};
