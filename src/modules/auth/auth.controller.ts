import type { RequestHandler } from "express";

import * as authService from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { sendSuccess } from "../../shared/utils/sendResponse.js";

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
