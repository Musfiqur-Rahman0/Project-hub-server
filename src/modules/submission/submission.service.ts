import { Prisma, SubmissionStatus } from "../../generated/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppErrors } from "../../shared/errors/appErrors.js";
import { SessionUser } from "../../types/express.js";
import type { CreateSubmissionPayload, UpdateSubmissionStatusPayload } from "./submission.validation.js";

export async function createSubmission(
  payload: CreateSubmissionPayload,
  studentId: string,
) {
  try {
    return await prisma.submission.create({
      data: {
        projectName: payload.projectName,
        repositoryUrl: payload.repoUrl,
        liveUrl: payload.liveUrl,
        description: payload.description,
        status: SubmissionStatus.PENDING,
        studentId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw AppErrors.conflict("You have already submitted this repository");
    }

    throw error;
  }
}

export async function listSubmission(payload: SessionUser) {
  if (payload.role !== "STUDENT") {
    return prisma.submission.findMany();
  }

  return prisma.submission.findMany({
    where: { studentId: payload.userId },
  });
}

export async function updateSubmissionStatus(
  submissionId: string,
  reviewerId: string,
  payload: UpdateSubmissionStatusPayload,
) {
  try {
    return await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: payload.status,
        feedback: payload.feedback,
        reviewerId,
        reviewedAt: new Date(),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw AppErrors.notFound("Submission");
    }

    throw error;
  }
}
