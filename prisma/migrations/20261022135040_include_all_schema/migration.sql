-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "repository_url" TEXT NOT NULL,
    "live_url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "submission_status" NOT NULL DEFAULT 'PENDING',
    "student_id" TEXT NOT NULL,
    "reviewer_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submissions_status_created_at_idx" ON "submissions"("status", "created_at");

-- CreateIndex
CREATE INDEX "submissions_student_id_created_at_idx" ON "submissions"("student_id", "created_at");

-- CreateIndex
CREATE INDEX "submissions_reviewer_id_idx" ON "submissions"("reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_student_id_repository_url_key" ON "submissions"("student_id", "repository_url");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
