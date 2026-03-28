import type { FastifyInstance } from "fastify";
import { prisma } from "@covenant/db";
import { getScanQueue, getDigestQueue, getRegulationQueue, getCveQueue } from "../jobs/queue";

/**
 * Operational endpoints for the BullMQ job system (master plan §4.3).
 *   GET  /v1/jobs/failures  — recent DLQ entries for the active org
 *   GET  /v1/jobs/queues    — high-level queue counts (waiting/active/failed)
 *   POST /v1/jobs/scan      — enqueue a scan job for a repository
 */
export async function jobsRoutes(app: FastifyInstance) {
  app.get("/jobs/failures", async (request) => {
    const orgId = request.covenant.organizationId;
    // JobFailure is intentionally outside tenant-guard because system-wide
    // jobs (regulation-sync, cve-watcher) have no organizationId.
    const items = await prisma.jobFailure.findMany({
      where: { OR: [{ organizationId: orgId }, { organizationId: null }] },
      orderBy: { failedAt: "desc" },
      take: 50,
      select: {
        id: true,
        queue: true,
        jobName: true,
        jobId: true,
        attempts: true,
        status: true,
        errorMessage: true,
        failedAt: true,
        organizationId: true
      }
    });
    return { items };
  });

  app.get("/jobs/queues", async () => {
    const queues = [
      ["scan", getScanQueue()],
      ["digest", getDigestQueue()],
      ["regulations", getRegulationQueue()],
      ["cve", getCveQueue()]
    ] as const;
    const out: Record<string, { waiting: number; active: number; failed: number; delayed: number }> = {};
    for (const [name, q] of queues) {
      try {
        out[name] = {
          waiting: await q.getWaitingCount(),
          active: await q.getActiveCount(),
          failed: await q.getFailedCount(),
          delayed: await q.getDelayedCount()
        };
      } catch {
        out[name] = { waiting: 0, active: 0, failed: 0, delayed: 0 };
      }
    }
    return { queues: out };
  });

  app.post("/jobs/scan", async (request, reply) => {
    const body = request.body as { repositoryId?: string; sourceMode?: "demo" | "uploaded" | "provider" } | undefined;
    if (!body?.repositoryId) return reply.badRequest("repositoryId required");
    const job = await getScanQueue().add(
      "run-scan",
      {
        organizationId: request.covenant.organizationId,
        repositoryId: body.repositoryId,
        sourceMode: body.sourceMode ?? "demo"
      },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
    );
    return reply.code(202).send({ jobId: job.id });
  });
}
