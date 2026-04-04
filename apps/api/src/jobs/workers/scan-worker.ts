import { Worker, type Job } from "bullmq";
import { prisma } from "@covenant/db";
import { runWithTenant } from "../../db/tenant-guard";
import { getRedisConnection, type ScanJobData } from "../queue";
import { recordJobFailure } from "../dlq";

/**
 * covenant-scan worker. Picks up scan jobs and runs them inside the tenant's
 * ALS context so all repo writes go through tenant-guard.
 *
 * For now the actual analysis pipeline is intentionally minimal — it records
 * the start, increments a usage record, and marks the scan as queued for the
 * analyzer to consume. The deep analyzer integration lives in agent A1+A7
 * (Task 5) and is invoked by AnalyzerRunner.
 */
export function buildScanWorker() {
  const worker = new Worker<ScanJobData>(
    "covenant-scan",
    async (job: Job<ScanJobData>) => {
      const { organizationId, repositoryId, sourceMode } = job.data;
      return runWithTenant({ organizationId, userId: null }, async () => {
        // Record the scan kickoff.
        const scan = await prisma.scan.create({
          data: {
            organizationId,
            repositoryId,
            status: "running",
            startedAt: new Date()
          }
        });
        await prisma.usageRecord.create({
          data: {
            organizationId,
            metric: "scan",
            quantity: 1,
            metadata: { sourceMode, jobId: job.id ?? null }
          }
        });
        // The analyzer pipeline (Task 5) runs out-of-band and updates this row.
        return { scanId: scan.id };
      });
    },
    { connection: getRedisConnection(), concurrency: 4 }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    await recordJobFailure({ queue: "covenant-scan", job, err }).catch(() => undefined);
  });

  return worker;
}
