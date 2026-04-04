import { Worker, type Job } from "bullmq";
import { prisma } from "@covenant/db";
import { getRedisConnection } from "../queue";
import { recordJobFailure } from "../dlq";

/**
 * RTBF deletion worker — Session 6 §5.
 *
 * Runs at most once a day (scheduling lives in the cron orchestrator,
 * not here) and finalises any DataSubjectRequest whose `scheduledFor`
 * timestamp is in the past and whose status is still `scheduled`.
 *
 * The worker is idempotent: if a request has already been completed
 * we no-op. The deletion audit trail is appended in-place so the
 * same DataSubjectRequest row stays as the legal record-of-truth
 * even after the user's data has been purged.
 */

export interface RtbfJobData {
  /** Optional id; when omitted the worker scans for everything due. */
  requestId?: string;
}

interface AuditEntry {
  at: string;
  actor: string;
  event: string;
  detail?: string;
}

async function executeDeletion(requestId: string) {
  const row = await prisma.dataSubjectRequest.findUnique({ where: { id: requestId } });
  if (!row || row.status === "completed" || row.status === "cancelled") return;
  const audit: AuditEntry[] = Array.isArray(row.auditTrail)
    ? (row.auditTrail as unknown as AuditEntry[])
    : [];
  audit.push({
    at: new Date().toISOString(),
    actor: "system:rtbf-worker",
    event: "deletion.started"
  });

  // Best-effort tenant-scoped purge. Each step is wrapped so a failure
  // in one model doesn't strand the whole request. The user row is only
  // deleted globally when the user has NO remaining memberships in any
  // other organization — otherwise we sever this org's membership and
  // leave cross-tenant data alone (Session 9 review §7).
  const tasks: Array<{ name: string; run: () => Promise<unknown> }> = [
    {
      name: "memberships",
      run: () =>
        row.userId
          ? prisma.membership.deleteMany({
              where: { userId: row.userId, organizationId: row.organizationId }
            })
          : Promise.resolve(0)
    },
    {
      // Only purge sessions if no memberships remain — sessions are not
      // org-scoped today, so killing them while the user belongs to
      // another org would log them out of unrelated tenants.
      name: "sessions",
      run: async () => {
        if (!row.userId) return 0;
        const remaining = await prisma.membership.count({ where: { userId: row.userId } });
        if (remaining > 0) return 0;
        return prisma.session.deleteMany({ where: { userId: row.userId } });
      }
    },
    {
      // Same: NPS responses are not org-scoped in the schema; only purge
      // when the user has no other org affiliation.
      name: "npsResponses",
      run: async () => {
        if (!row.userId) return 0;
        const remaining = await prisma.membership.count({ where: { userId: row.userId } });
        if (remaining > 0) return 0;
        return prisma.npsResponse.deleteMany({ where: { userId: row.userId } });
      }
    },
    {
      name: "user",
      run: async () => {
        if (!row.userId) return;
        const remaining = await prisma.membership.count({ where: { userId: row.userId } });
        if (remaining > 0) return { skipped: "user has remaining memberships" };
        return prisma.user.delete({ where: { id: row.userId } });
      }
    }
  ];

  for (const task of tasks) {
    try {
      const result = await task.run();
      audit.push({
        at: new Date().toISOString(),
        actor: "system:rtbf-worker",
        event: `deletion.${task.name}.ok`,
        detail: typeof result === "object" ? JSON.stringify(result) : String(result)
      });
    } catch (err) {
      audit.push({
        at: new Date().toISOString(),
        actor: "system:rtbf-worker",
        event: `deletion.${task.name}.error`,
        detail: err instanceof Error ? err.message : String(err)
      });
    }
  }

  audit.push({
    at: new Date().toISOString(),
    actor: "system:rtbf-worker",
    event: "deletion.completed"
  });
  await prisma.dataSubjectRequest.update({
    where: { id: row.id },
    data: { status: "completed", completedAt: new Date(), auditTrail: audit as unknown as object }
  });
}

export function buildRtbfWorker() {
  const worker = new Worker<RtbfJobData>(
    "covenant-rtbf",
    async (job: Job<RtbfJobData>) => {
      if (job.data.requestId) {
        await executeDeletion(job.data.requestId);
        return { processed: 1 };
      }
      const due = await prisma.dataSubjectRequest.findMany({
        where: { status: "scheduled", scheduledFor: { lte: new Date() }, type: "deletion" },
        select: { id: true },
        take: 100
      });
      for (const r of due) await executeDeletion(r.id);
      return { processed: due.length };
    },
    { connection: getRedisConnection() }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    await recordJobFailure({
      queue: "covenant-rtbf",
      job,
      err,
      organizationId: null
    });
  });

  return worker;
}
