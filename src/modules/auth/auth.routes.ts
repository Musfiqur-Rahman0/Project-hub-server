import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import * as authController from "./auth.controller.js";
import { AppErrors } from "../../shared/errors/appErrors.js";
import { authenticate } from "../../middleware/authMiddleware.js";

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
router.get("/logout", asyncHandler(authController.logout));
router.get("/refresh", asyncHandler(authController.refresh));
router.get("/me", authenticate, asyncHandler(authController.me));

export default router;
