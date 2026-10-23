import { Router } from "express";
import { allowedRoles, authenticate } from "../../middleware/authMiddleware.js";
import * as submissionController from "../submission/submission.controler.js";
import { Role } from "../../generated/enums.js";
const router = Router();

router
  .route("/")
  .get(authenticate, submissionController.listSubmission)
  .post(authenticate, submissionController.createSubmission);

router.get("/stats", authenticate, submissionController.getSubmissionStats);

router.patch(
  "/:id/review",
  authenticate,
  allowedRoles(Role.MENTOR, Role.ADMIN),
  submissionController.updateSubmissionStatus,
);

export default router;
