import type { Request, Response } from "express";
import { Router } from "express";
import { allowedRoles, authenticate } from "../../middleware/authMiddleware.js";
import { Role } from "../../generated/enums.js";
import { sendSuccess } from "../../shared/utils/sendResponse.js";

const router = Router();

router.get(
  "/",
  authenticate,
  allowedRoles(Role.STUDENT, Role.ADMIN),
  (req: Request, res: Response) => {
    sendSuccess(res, null, "Test completed");
  },
);

export default router;
