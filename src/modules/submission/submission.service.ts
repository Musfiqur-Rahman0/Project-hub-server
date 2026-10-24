import { Prisma, SubmissionStatus } from "../../generated/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppErrors } from "../../shared/errors/appErrors.js";
import { SessionUser } from "../../types/express.js";
import type {
  CreateSubmissionPayload,
  ListSubmissionQuery,
  UpdateSubmissionStatusPayload,
} from "./submission.validation.js";

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

export async function listSubmission(
  user: SessionUser,
  query: ListSubmissionQuery,
) {
  const where: Prisma.SubmissionWhereInput = {
    ...(user.role === "STUDENT" ? { studentId: user.userId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { projectName: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
            { repositoryUrl: { contains: query.search, mode: "insensitive" } },
            ...(user.role === "STUDENT"
              ? []
              : [
                  {
                    student: {
                      fullName: {
                        contains: query.search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                  {
                    student: {
                      email: {
                        contains: query.search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                ]),
          ],
        }
      : {}),
  };
  const skip = (query.page - 1) * query.pageSize;
  const orderBy: Prisma.SubmissionOrderByWithRelationInput[] =
    query.sort === "name"
      ? [{ projectName: "asc" }, { id: "asc" }]
      : [
          { createdAt: query.sort === "oldest" ? "asc" : "desc" },
          { id: query.sort === "oldest" ? "asc" : "desc" },
        ];

  const [submissions, total] = await prisma.$transaction([
    prisma.submission.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy,
      ...(user.role === "STUDENT"
        ? {}
        : {
            include: {
              student: {
                select: { id: true, fullName: true, email: true },
              },
            },
          }),
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    submissions,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
      hasNextPage: skip + submissions.length < total,
      hasPreviousPage: query.page > 1,
    },
  };
}

export async function getSubmissionStats(user: SessionUser) {
  const where: Prisma.SubmissionWhereInput =
    user.role === "STUDENT" ? { studentId: user.userId } : {};

  const groupedCounts = await prisma.submission.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
  });

  const counts = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  for (const group of groupedCounts) {
    const count = group._count._all;
    counts.total += count;

    switch (group.status) {
      case SubmissionStatus.PENDING:
        counts.pending = count;
        break;
      case SubmissionStatus.APPROVED:
        counts.approved = count;
        break;
      case SubmissionStatus.REJECTED:
        counts.rejected = count;
        break;
    }
  }

  return counts;
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
