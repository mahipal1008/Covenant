-- CreateEnum
CREATE TYPE "JobFailureStatus" AS ENUM ('failed', 'retrying', 'abandoned');

-- CreateTable
CREATE TABLE "JobFailure" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "queue" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "status" "JobFailureStatus" NOT NULL DEFAULT 'failed',
    "errorMessage" TEXT NOT NULL,
    "errorStack" TEXT,
    "payload" JSONB NOT NULL,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobFailure_queue_failedAt_idx" ON "JobFailure"("queue", "failedAt");

-- CreateIndex
CREATE INDEX "JobFailure_organizationId_failedAt_idx" ON "JobFailure"("organizationId", "failedAt");
