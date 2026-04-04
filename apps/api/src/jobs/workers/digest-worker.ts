import { Worker, type Job } from "bullmq";
import { prisma } from "@covenant/db";
import { runWithTenant } from "../../db/tenant-guard";
import { getRedisConnection, type DigestJobData } from "../queue";
import { recordJobFailure } from "../dlq";

/**
 * covenant-digest worker. Sends the daily / weekly notification digest.
 * Aggregates findings and contract violations for the org, then writes
 * a Notification row per channel that has the corresponding pref enabled.
 */
export function buildDigestWorker() {
  const worker = new Worker<DigestJobData>(
    "covenant-digest",
    async (job: Job<DigestJobData>) => {
      const { organizationId, scope } = job.data;
      return runWithTenant({ organizationId, userId: null }, async () => {
        const since = new Date(Date.now() - (scope === "weekly" ? 7 : 1) * 86400000);
        const [findings, violations] = await Promise.all([
          prisma.finding.count({
            where: { organizationId, createdAt: { gte: since } }
          }),
          prisma.intentContract.count({
            where: { organizationId, status: "violated" }
          })
        ]);

        const prefs = await prisma.notificationPreference.findMany({
          where: { organizationId, eventType: scope === "weekly" ? "team.invitation" : "scan.completed" }
        });

        const title = scope === "weekly" ? "Weekly Covenant digest" : "Daily Covenant digest";
        const body = `${findings} new findings, ${violations} contract violations in the last ${
          scope === "weekly" ? "7 days" : "24 hours"
        }.`;

        // Emit a Notification row per enabled channel.
        const channels: string[] = [];
        for (const pref of prefs) {
          if (pref.email) channels.push("email");
          if (pref.slack) channels.push("slack");
          if (pref.inApp) channels.push("in_app");
        }
        if (channels.length === 0) channels.push("in_app");

        for (const channel of channels) {
          await prisma.notification.create({
            data: {
              organizationId,
              channel,
              title,
              body,
              deliveredAt: new Date()
            }
          });
        }

        return { findings, violations, channels };
      });
    },
    { connection: getRedisConnection(), concurrency: 8 }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    await recordJobFailure({ queue: "covenant-digest", job, err }).catch(() => undefined);
  });

  return worker;
}
