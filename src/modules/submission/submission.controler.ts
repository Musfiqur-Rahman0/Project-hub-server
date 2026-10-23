import { z } from "zod";
import { RequestHandler } from "express";
import {
  createSubmissionSchema,
  listSubmissionQuerySchema,
  updateSubmissionStatusSchema,
} from "./submission.validation.js";
import * as submissionService from "./submission.service.js";
import { sendSuccess } from "../../shared/utils/sendResponse.js";
import { AppErrors } from "../../shared/errors/appErrors.js";

export const listSubmission: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw AppErrors.unauthorized("Authentication required");
  }

  const query = listSubmissionQuerySchema.parse(req.query);
  const result = await submissionService.listSubmission(req.user, query);

  return sendSuccess(
    res,
    "Successfully retrieved submission list",
    result.submissions,
    200,
    result.pagination,
  );
};

export const getSubmissionStats: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw AppErrors.unauthorized("Authentication required");
  }

  const stats = await submissionService.getSubmissionStats(req.user);
  return sendSuccess(res, "Submission statistics retrieved successfully", stats);
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
