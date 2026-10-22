import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import * as authController from "./auth.controller.js";
import { AppErrors } from "../../shared/errors/appErrors.js";

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(AppErrors.tooManyRequest("Too many request"));
  },
});

router.post("/register", asyncHandler(authController.register));
router.post("/login", loginLimiter, asyncHandler(authController.login));

export default router;
