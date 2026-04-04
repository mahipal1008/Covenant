import { Worker, type Job } from "bullmq";
import { getRedisConnection, type RegulationSyncJobData } from "../queue";
import { recordJobFailure } from "../dlq";

/**
 * covenant-regulations worker. Periodically refreshes regulation/policy
 * datasets used by the compliance dashboard. The actual fetch hits public
 * sources (NIST OSCAL, OpenControl YAML feeds). For now this worker just
 * timestamps the run; the data pipeline lands with agent A11 (later).
 */
export function buildRegulationWorker() {
  const worker = new Worker<RegulationSyncJobData>(
    "covenant-regulations",
    async (_job: Job<RegulationSyncJobData>) => {
      // Placeholder: the real fetch + parse + persist pipeline arrives with
      // agent A11 (Compliance Mapper). This worker is wired now so the queue
      // exists for the scheduler.
      return { syncedAt: new Date().toISOString() };
    },
    { connection: getRedisConnection(), concurrency: 2 }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    await recordJobFailure({ queue: "covenant-regulations", job, err }).catch(() => undefined);
  });

  return worker;
}
