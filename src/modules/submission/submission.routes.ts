import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import * as submissionController from "../submission/submission.controler.js";
const router = Router();

router
  .route("/")
  .get(authenticate, submissionController.listSubmission)
  .post(authenticate, submissionController.createSubmission);

export default router;
