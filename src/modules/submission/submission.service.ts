import { Prisma, SubmissionStatus } from "../../generated/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppErrors } from "../../shared/errors/appErrors.js";
import { SessionUser } from "../../types/express.js";
import type { CreateSubmissionPayload } from "./submission.validation.js";

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
