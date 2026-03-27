import type { FastifyInstance } from "fastify";
import { prisma } from "@covenant/db";
import { tenantPrisma } from "../db/tenant-guard";

function serializeJob(j: {
  id: string;
  organizationId: string;
  status: string;
  bytes: bigint | null;
  downloadUrl: string | null;
  requestedAt: Date;
  readyAt: Date | null;
  expiresAt: Date | null;
}) {
  return {
    id: j.id,
    organizationId: j.organizationId,
    status: j.status,
    bytes: j.bytes !== null ? Number(j.bytes) : null,
    downloadUrl: j.downloadUrl,
    requestedAt: j.requestedAt.toISOString(),
    readyAt: j.readyAt ? j.readyAt.toISOString() : null,
    expiresAt: j.expiresAt ? j.expiresAt.toISOString() : null
  };
}

export async function dataExportRoutes(app: FastifyInstance) {
  app.get("/data-export", async () => {
    const jobs = await tenantPrisma.dataExportJob.findMany({
      orderBy: { requestedAt: "desc" }
    });
    return { items: jobs.map(serializeJob) };
  });

  app.post("/data-export", async (request, reply) => {
    const orgId = request.covenant.organizationId;
    const job = await tenantPrisma.dataExportJob.create({
      data: { organizationId: orgId, status: "running" }
    });
    await tenantPrisma.auditEvent.create({
      data: {
        organizationId: orgId,
        action: "data.export.requested",
        targetType: "export",
        targetId: job.id,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] ?? null
      }
    });
    // Background completion runs OUTSIDE the request ALS, so we use the
    // base prisma client here and pass orgId implicitly via the existing row.
    setTimeout(() => {
      void prisma.dataExportJob
        .update({
          where: { id: job.id },
          data: {
            status: "ready",
            readyAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
            bytes: BigInt(Math.floor(Math.random() * 50_000_000) + 1_000_000),
            downloadUrl: `/api/exports/${job.id}.tar.gz`
          }
        })
        .catch(() => undefined);
    }, 2500);
    return reply.code(202).send(serializeJob(job));
  });
}
