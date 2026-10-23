import type { RequestHandler } from "express";
import { ACCESS_COOKIE_NAME, parseCookies } from "../lib/cookie.js";
import { AppErrors } from "../shared/errors/appErrors.js";
import { getUserById, verifyAuthToken } from "../modules/auth/auth.service.js";
import type { UserRole } from "../modules/auth/auth.interface.js";

export const authenticate: RequestHandler = async (req, _res, next) => {
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

    const user = await getUserById(payload.userId);
    req.user = { userId: user.id, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
};

export const allowedRoles = (...roles: UserRole[]): RequestHandler => {
  return async (req, _res, next) => {
    // console.log("user", req.user?.userId);
    if (!req.user) {
      return next(AppErrors.unauthorized("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(AppErrors.forbidden());
    }

    return next();
  };
};
