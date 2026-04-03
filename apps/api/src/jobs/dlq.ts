import { prisma } from "@covenant/db";
import type { Job } from "bullmq";

/**
 * Persist a final job failure to the JobFailure DLQ table (master plan §4.3).
 * Called by every worker's failed handler once attempts >= max.
 */
export async function recordJobFailure(args: {
  queue: string;
  job: Job;
  err: Error;
  organizationId?: string | null;
}) {
  const { queue, job, err, organizationId } = args;
  const final = job.attemptsMade >= (job.opts.attempts ?? 1);
  await prisma.jobFailure.create({
    data: {
      queue,
      jobName: job.name,
      jobId: String(job.id ?? "unknown"),
      attempts: job.attemptsMade,
      status: final ? "abandoned" : "retrying",
      errorMessage: err.message?.slice(0, 4000) ?? "(no message)",
      errorStack: err.stack?.slice(0, 8000) ?? null,
      payload: job.data as object,
      organizationId:
        organizationId ??
        (typeof (job.data as { organizationId?: unknown })?.organizationId === "string"
          ? ((job.data as { organizationId: string }).organizationId)
          : null)
    }
  });
}
