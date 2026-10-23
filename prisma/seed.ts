import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client.js";
import { Role, SubmissionStatus } from "../src/generated/enums.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run development seed data in production");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be configured to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const demoPassword = process.env.SEED_PASSWORD ?? "ProjectHub123!";

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {
      fullName: "Sam Student",
      passwordHash,
      role: Role.STUDENT,
      isActive: true,
    },
    create: {
      fullName: "Sam Student",
      email: "student@example.com",
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const secondStudent = await prisma.user.upsert({
    where: { email: "alex.student@example.com" },
    update: {
      fullName: "Alex Student",
      passwordHash,
      role: Role.STUDENT,
      isActive: true,
    },
    create: {
      fullName: "Alex Student",
      email: "alex.student@example.com",
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const mentor = await prisma.user.upsert({
    where: { email: "mentor@example.com" },
    update: {
      fullName: "Morgan Mentor",
      passwordHash,
      role: Role.MENTOR,
      isActive: true,
    },
    create: {
      fullName: "Morgan Mentor",
      email: "mentor@example.com",
      passwordHash,
      role: Role.MENTOR,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      fullName: "Avery Admin",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      fullName: "Avery Admin",
      email: "admin@example.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const submissions = [
    {
      projectName: "Campus Events",
      repositoryUrl: "https://github.com/example/campus-events",
      liveUrl: "https://campus-events.example.com",
      description:
        "A responsive app for discovering and managing campus events.",
      studentId: student.id,
      status: SubmissionStatus.PENDING,
      reviewerId: null,
      reviewedAt: null,
    },
    {
      projectName: "Study Planner",
      repositoryUrl: "https://github.com/example/study-planner",
      liveUrl: "https://study-planner.example.com",
      description:
        "A study planning tool with tasks, deadlines, and progress tracking.",
      studentId: student.id,
      status: SubmissionStatus.APPROVED,
      reviewerId: mentor.id,
      reviewedAt: new Date("2026-10-20T12:00:00.000Z"),
    },
    {
      projectName: "Recipe Finder",
      repositoryUrl: "https://github.com/example/recipe-finder",
      liveUrl: "https://recipe-finder.example.com",
      description:
        "A recipe search app with filters for ingredients and dietary needs.",
      studentId: secondStudent.id,
      status: SubmissionStatus.REJECTED,
      reviewerId: mentor.id,
      reviewedAt: new Date("2026-10-21T12:00:00.000Z"),
    },
  ];

  for (const submission of submissions) {
    const { studentId, repositoryUrl, ...data } = submission;
    await prisma.submission.upsert({
      where: {
        studentId_repositoryUrl: { studentId, repositoryUrl },
      },
      update: data,
      create: { ...data, studentId, repositoryUrl },
    });
  }

  console.info("Seeded demo users and project submissions.");
  console.info(`Demo account password: ${demoPassword}`);
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
