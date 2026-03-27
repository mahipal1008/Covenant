import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { tenantPrisma } from "../db/tenant-guard";

/**
 * Right-to-be-forgotten (RTBF) and data-export request endpoints —
 * Session 6 §5. The actual deletion runs out-of-band via a 30-day
 * cron worker (apps/api/src/jobs/workers/rtbf-deletion.ts) so users
 * have a grace period to cancel before destructive work executes.
 */

const createSchema = z.object({
  type: z.enum(["export", "deletion"]),
  subjectEmail: z.string().email(),
  reason: z.string().max(2000).optional()
});

const cancelSchema = z.object({ reason: z.string().max(500).optional() });

const GRACE_DAYS = 30;

interface AuditEntry {
  at: string;
  actor: string;
  event: string;
  detail?: string;
}

function makeAudit(actor: string, event: string, detail?: string): AuditEntry {
  const e: AuditEntry = { at: new Date().toISOString(), actor, event };
  if (detail !== undefined) e.detail = detail;
  return e;
}

function appendAudit(existing: unknown, entry: AuditEntry): AuditEntry[] {
  const list = Array.isArray(existing) ? (existing as AuditEntry[]) : [];
  return [...list, entry];
}

export async function rtbfRoutes(app: FastifyInstance) {
  app.post("/privacy/data-requests", async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) return reply.badRequest(parsed.error.message);
    const { type, subjectEmail, reason } = parsed.data;
    const orgId = request.covenant.organizationId;
    const userId = request.covenant.userId ?? null;
    const scheduledFor = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000);
    const audit: AuditEntry[] = [
      makeAudit(userId ?? "anonymous", "request.created", `${type} for ${subjectEmail}`)
    ];
    const created = await tenantPrisma.dataSubjectRequest.create({
      data: {
        organizationId: orgId,
        userId,
        subjectEmail,
        type,
        ...(reason !== undefined ? { reason } : {}),
        scheduledFor,
        status: type === "export" ? "in_progress" : "scheduled",
        auditTrail: audit
      }
    });
    return reply.code(201).send({ id: created.id, status: created.status, scheduledFor });
  });

  app.get("/privacy/data-requests", async () => {
    const rows = await tenantPrisma.dataSubjectRequest.findMany({
      orderBy: { requestedAt: "desc" },
      take: 200
    });
    return { requests: rows };
  });

  app.get("/privacy/data-requests/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = await tenantPrisma.dataSubjectRequest.findFirst({ where: { id } });
    if (!row) return reply.notFound("Request not found");
    return row;
  });

  app.post("/privacy/data-requests/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = cancelSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.badRequest(parsed.error.message);
    const row = await tenantPrisma.dataSubjectRequest.findFirst({ where: { id } });
    if (!row) return reply.notFound("Request not found");
    if (row.status === "completed") return reply.badRequest("Already completed; cannot cancel.");
    const audit = appendAudit(
      row.auditTrail,
      makeAudit(request.covenant.userId ?? "anonymous", "request.cancelled", parsed.data.reason)
    );
    const updated = await tenantPrisma.dataSubjectRequest.update({
      where: { id: row.id },
      data: { status: "cancelled", auditTrail: audit }
    });
    return updated;
  });
}
