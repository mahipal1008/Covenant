import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@covenant/db";
import { tenantPrisma } from "../db/tenant-guard";

const eventTypes = [
  "scan.completed",
  "scan.failed",
  "finding.critical",
  "contract.violated",
  "pr.gate.blocked",
  "billing.invoice",
  "team.invitation"
] as const;

type Channel = "email" | "slack" | "in_app";
type Pref = Record<string, Record<Channel, boolean>>;

const updateSchema = z.object({
  prefs: z.record(z.string(), z.record(z.enum(["email", "slack", "in_app"]), z.boolean()))
});

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/notifications/preferences", async () => {
    const rows = await tenantPrisma.notificationPreference.findMany();
    const prefs: Pref = {};
    for (const e of eventTypes) prefs[e] = { email: true, slack: true, in_app: true };
    for (const r of rows) {
      prefs[r.eventType] = { email: r.email, slack: r.slack, in_app: r.inApp };
    }
    return { events: eventTypes, prefs };
  });

  app.put("/notifications/preferences", async (request, reply) => {
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) return reply.badRequest(parsed.error.message);
    const orgId = request.covenant.organizationId;
    const entries = Object.entries(parsed.data.prefs);
    // upsert with composite unique key — extension AND-merges the org filter.
    // For the create branch the extension also injects organizationId.
    await prisma.$transaction(
      entries.map(([eventType, p]) =>
        tenantPrisma.notificationPreference.upsert({
          where: { organizationId_eventType: { organizationId: orgId, eventType } },
          update: { email: !!p.email, slack: !!p.slack, inApp: !!p.in_app },
          create: { organizationId: orgId, eventType, email: !!p.email, slack: !!p.slack, inApp: !!p.in_app }
        })
      )
    );
    await tenantPrisma.auditEvent.create({
      data: {
        organizationId: orgId,
        action: "settings.notifications.updated",
        targetType: "preferences",
        targetId: orgId,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] ?? null
      }
    });
    return { ok: true };
  });
}
