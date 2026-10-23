import { z } from "zod";
import { RequestHandler } from "express";
import {
  createSubmissionSchema,
  updateSubmissionStatusSchema,
} from "./submission.validation.js";
import * as submissionService from "./submission.service.js";
import { sendSuccess } from "../../shared/utils/sendResponse.js";
import { AppErrors } from "../../shared/errors/appErrors.js";

export const listSubmission: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw AppErrors.unauthorized("Authentication required");
  }

  const result = await submissionService.listSubmission(req.user);

  return sendSuccess(res, "Successfully retrived all submission list", result);
};

export const createSubmission: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw AppErrors.unauthorized("Authentication required");
  }

  const payload = createSubmissionSchema.parse(req.body);
  const result = await submissionService.createSubmission(
    payload,
    req.user.userId,
  );

  return sendSuccess(
    res,
    "Project submission created successfully",
    result,
    201,
  );
};

export const updateSubmissionStatus: RequestHandler = async (req, res) => {
  if (!req.user) throw AppErrors.unauthorized("Authentication required");

  const submissionId = z.string().uuid().parse(req.params.id);
  const payload = updateSubmissionStatusSchema.parse(req.body);
  const result = await submissionService.updateSubmissionStatus(
    submissionId,
    req.user.userId,
    payload,
  );

  return sendSuccess(res, "Submission review saved successfully", result);
};
