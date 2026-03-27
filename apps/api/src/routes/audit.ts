import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { tenantPrisma } from "../db/tenant-guard";

export async function auditRoutes(app: FastifyInstance) {
  app.get("/audit", async (request) => {
    const q = (request.query as { q?: string; action?: string }) ?? {};
    const where: Prisma.AuditEventWhereInput = {};
    if (q.action) where.action = { contains: q.action };
    if (q.q) {
      where.OR = [
        { actorEmail: { contains: q.q, mode: "insensitive" } },
        { action: { contains: q.q, mode: "insensitive" } },
        { targetType: { contains: q.q, mode: "insensitive" } },
        { targetId: { contains: q.q, mode: "insensitive" } }
      ];
    }
    const events = await tenantPrisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200
    });
    const items = events.map((e) => ({
      id: e.id,
      organizationId: e.organizationId,
      actor: e.actorEmail ?? "system",
      action: e.action,
      resource: e.targetId ? `${e.targetType}:${e.targetId}` : e.targetType,
      ipAddress: e.ipAddress ?? "internal",
      userAgent: e.userAgent ?? "covenant-platform",
      at: e.createdAt.toISOString()
    }));
    return { items, total: items.length };
  });
}
