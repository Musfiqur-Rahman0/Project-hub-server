import type { RequestHandler, Response, Request } from "express";

import * as authService from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { sendSuccess } from "../../shared/utils/sendResponse.js";
import { AuthTokens } from "./auth.interface.js";
import {
  attachTokensToCookie,
  clearTokensFromCookie,
  parseCookies,
  REFRESH_COOKIE_NAME,
} from "../../lib/cookie.js";
import { AppErrors } from "../../shared/errors/appErrors.js";

function setAuthcookies(res: Response, tokens: AuthTokens): void {
  attachTokensToCookie(res, tokens.accessToken, tokens.refreshToken);
}

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);

  return sendSuccess(
    res,
    { user: result },
    "User registration successful",
    201,
  );
};

export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);

  setAuthcookies(res, result.tokens);
  return sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    },
    "Login successful",
    200,
  );
};

export const refresh: RequestHandler = async (req, res) => {
  const refreshToken = parseCookies(req)[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    throw AppErrors.unauthorized("Invalid or expired session");
  }

  const result = await authService.refresh(refreshToken);
  setAuthcookies(res, result.tokens);

  return sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
    },
    "Successfully refresh access token",
  );
};

export const me: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw AppErrors.unauthorized("Invalid or expired session");
  }
  const user = await authService.getUserById(req.user.userId);
  return sendSuccess(res, { user }, "user information retrived successfully");
};

export const logout: RequestHandler = async (_req, res) => {
  clearTokensFromCookie(res);
  return sendSuccess(res, null, "loged out successfully");
};
