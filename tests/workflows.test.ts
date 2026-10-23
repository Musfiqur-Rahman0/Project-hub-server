import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { Role } from "../src/generated/enums.js";
import { normalizeError } from "../src/shared/errors/normalizeError.js";

const testDatabaseUrl = process.env.DATABASE_URL_TEST;
if (!testDatabaseUrl) {
  throw new Error(
    "Set DATABASE_URL_TEST to a dedicated test database before running tests",
  );
}
if (process.env.NODE_ENV === "production") {
  throw new Error("API workflow tests cannot run with NODE_ENV=production");
}
let testDatabase: URL;
try {
  testDatabase = new URL(testDatabaseUrl);
} catch {
  throw new Error(
    "DATABASE_URL_TEST is not a valid URL. Replace the example value with your test Supabase connection string.",
  );
}
if (!["postgres:", "postgresql:"].includes(testDatabase.protocol)) {
  throw new Error(
    "DATABASE_URL_TEST must be a PostgreSQL connection URL for the test database.",
  );
}

let configuredDatabase: URL | undefined;
if (process.env.DATABASE_URL) {
  try {
    configuredDatabase = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error("DATABASE_URL must be a valid URL when set.");
  }
}
if (
  configuredDatabase &&
  testDatabase.protocol === configuredDatabase.protocol &&
  testDatabase.host === configuredDatabase.host &&
  testDatabase.pathname === configuredDatabase.pathname
) {
  throw new Error("DATABASE_URL_TEST must be different from DATABASE_URL");
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testDatabaseUrl;

const { default: app } = await import("../src/app.js");
const { prisma } = await import("../src/lib/prisma.js");

test("production errors do not expose internal details", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const normalized = normalizeError(new Error("database password leaked"));
    assert.equal(normalized.statusCode, 500);
    assert.equal(normalized.details, undefined);
    assert.doesNotMatch(normalized.message, /database password leaked/);
  } finally {
    if (previousEnvironment === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousEnvironment;
    }
  }
});

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: any;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string; details?: unknown };
};

test("authentication and submission review workflows", async () => {
  const suffix = randomUUID();
  const studentEmail = `student-${suffix}@example.test`;
  const mentorEmail = `mentor-${suffix}@example.test`;
  const password = "WorkflowTest123!";
  let studentId: string | undefined;
  let server: Server | undefined;
  let schemaReady = false;

  try {
    await prisma.$connect();

    const tables = await prisma.$queryRaw<
      Array<{ users: string | null; submissions: string | null }>
    >`
      SELECT
        to_regclass('public.users')::text AS users,
        to_regclass('public.submissions')::text AS submissions
    `;
    if (!tables[0]?.users || !tables[0]?.submissions) {
      throw new Error(
        "Test database schema is missing. Apply migrations to DATABASE_URL_TEST with `npx prisma migrate deploy` before running tests.",
      );
    }
    schemaReady = true;

    server = await new Promise<Server>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

    const request = async (
      path: string,
      options: {
        method?: string;
        token?: string;
        body?: unknown;
      } = {},
    ): Promise<{ status: number; body: ApiResponse }> => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.body !== undefined
            ? { "content-type": "application/json" }
            : {}),
          ...(options.token
            ? { authorization: `Bearer ${options.token}` }
            : {}),
        },
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
      });
      return {
        status: response.status,
        body: (await response.json()) as ApiResponse,
      };
    };

    const invalidSignup = await request("/auth/register", {
      method: "POST",
      body: { fullName: "A", email: "not-an-email", password: "weak" },
    });
    assert.equal(invalidSignup.status, 400);
    assert.equal(invalidSignup.body.success, false);
    assert.equal(invalidSignup.body.error?.code, "VALIDATION_ERROR");

    const signup = await request("/auth/register", {
      method: "POST",
      body: { fullName: "Test Student", email: studentEmail, password },
    });
    assert.equal(signup.status, 201);
    assert.equal(signup.body.success, true);
    assert.equal("passwordHash" in (signup.body.data?.user ?? {}), false);
    assert.doesNotMatch(
      JSON.stringify(signup.body),
      /passwordHash|WorkflowTest123!/,
    );
    studentId = signup.body.data.user.id as string;

    const studentLogin = await request("/auth/login", {
      method: "POST",
      body: { email: studentEmail, password },
    });
    assert.equal(studentLogin.status, 200);
    assert.doesNotMatch(
      JSON.stringify(studentLogin.body),
      /passwordHash|WorkflowTest123!/,
    );
    const studentToken = studentLogin.body.data.accessToken as string;

    const invalidLogin = await request("/auth/login", {
      method: "POST",
      body: { email: studentEmail, password: "WrongPassword123!" },
    });
    assert.equal(invalidLogin.status, 401);
    assert.equal(invalidLogin.body.error?.code, "AUTHENTICATION_ERROR");

    const mentor = await prisma.user.create({
      data: {
        fullName: "Test Mentor",
        email: mentorEmail,
        passwordHash: await bcrypt.hash(password, 4),
        role: Role.MENTOR,
      },
      select: { id: true },
    });
    const mentorLogin = await request("/auth/login", {
      method: "POST",
      body: { email: mentorEmail, password },
    });
    assert.equal(mentorLogin.status, 200);
    const mentorToken = mentorLogin.body.data.accessToken as string;

    const invalidSubmission = await request("/submission", {
      method: "POST",
      token: studentToken,
      body: { projectName: "x" },
    });
    assert.equal(invalidSubmission.status, 400);
    assert.equal(invalidSubmission.body.error?.code, "VALIDATION_ERROR");

    const createSubmission = async (name: string, repo: string) =>
      request("/submission", {
        method: "POST",
        token: studentToken,
        body: {
          projectName: name,
          repoUrl: `https://github.com/workflow-test/${repo}`,
          liveUrl: "https://example.test",
          description:
            "A sufficiently detailed project description for the review workflow integration test.",
        },
      });

    const firstSubmission = await createSubmission(
      "Workflow project one",
      "project-one",
    );
    const secondSubmission = await createSubmission(
      "Workflow project two",
      "project-two",
    );
    assert.equal(firstSubmission.status, 201);
    assert.equal(secondSubmission.status, 201);

    const duplicateSubmission = await createSubmission(
      "Workflow project one",
      "project-one",
    );
    assert.equal(duplicateSubmission.status, 409);
    assert.equal(duplicateSubmission.body.error?.code, "CONFLICT");

    const studentCannotReview = await request(
      `/submission/${firstSubmission.body.data.id}/review`,
      {
        method: "PATCH",
        token: studentToken,
        body: {
          status: "REJECTED",
          feedback: "This should not be allowed.",
        },
      },
    );
    assert.equal(studentCannotReview.status, 403);

    const rejectResponse = await request(
      `/submission/${firstSubmission.body.data.id}/review`,
      {
        method: "PATCH",
        token: mentorToken,
        body: {
          status: "REJECTED",
          feedback: "Please add tests for the main user flow.",
        },
      },
    );
    assert.equal(rejectResponse.status, 200);
    const approveResponse = await request(
      `/submission/${secondSubmission.body.data.id}/review`,
      {
        method: "PATCH",
        token: mentorToken,
        body: {
          status: "APPROVED",
          feedback: "The project meets the review criteria.",
        },
      },
    );
    assert.equal(approveResponse.status, 200);

    const invalidPage = await request("/submission?page=0", {
      token: studentToken,
    });
    assert.equal(invalidPage.status, 400);
    assert.equal(invalidPage.body.error?.code, "VALIDATION_ERROR");

    const invalidStatus = await request("/submission?status=UNKNOWN", {
      token: studentToken,
    });
    assert.equal(invalidStatus.status, 400);
    assert.equal(invalidStatus.body.error?.code, "VALIDATION_ERROR");

    const pageOne = await request("/submission?page=1&pageSize=1", {
      token: studentToken,
    });
    const pageTwo = await request("/submission?page=2&pageSize=1", {
      token: studentToken,
    });
    assert.equal(pageOne.status, 200);
    assert.equal(pageTwo.status, 200);
    assert.equal(pageOne.body.data?.length, 1);
    assert.equal(pageTwo.body.data?.length, 1);
    assert.notEqual(pageOne.body.data[0].id, pageTwo.body.data[0].id);
    assert.equal(pageOne.body.meta?.total, 2);
    assert.equal(pageOne.body.meta?.totalPages, 2);

    const approvedFilter = await request("/submission?status=APPROVED", {
      token: studentToken,
    });
    assert.equal(approvedFilter.status, 200);
    assert.equal(approvedFilter.body.data?.length, 1);
    assert.equal(
      approvedFilter.body.data[0].feedback,
      "The project meets the review criteria.",
    );

    const studentStats = await request("/submission/stats", {
      token: studentToken,
    });
    assert.deepEqual(studentStats.body.data, {
      total: 2,
      pending: 0,
      approved: 1,
      rejected: 1,
    });

    const unauthenticatedStats = await request("/submission/stats");
    assert.equal(unauthenticatedStats.status, 401);
    assert.equal(unauthenticatedStats.body.error?.code, "AUTHENTICATION_ERROR");

    const mentorStats = await request("/submission/stats", {
      token: mentorToken,
    });
    const mentorCounts = mentorStats.body.data;
    assert.equal(
      mentorCounts.total,
      mentorCounts.pending + mentorCounts.approved + mentorCounts.rejected,
    );
    assert.ok(mentorCounts.total >= 2);

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const response = await request("/auth/login", {
        method: "POST",
        body: { email: studentEmail, password: "WrongPassword123!" },
      });
      assert.equal(response.status, 401);
    }
    const rateLimited = await request("/auth/login", {
      method: "POST",
      body: { email: studentEmail, password },
    });
    assert.equal(rateLimited.status, 429);
    assert.equal(rateLimited.body.error?.code, "RATE_LIMIT_ERROR");
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }

    if (schemaReady) {
      if (studentId) {
        await prisma.submission.deleteMany({ where: { studentId } });
      }
      await prisma.user.deleteMany({
        where: { email: { in: [studentEmail, mentorEmail] } },
      });
    }
    await prisma.$disconnect();
  }
});
