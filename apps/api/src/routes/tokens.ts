import { randomBytes, createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@covenant/db";
import { tenantPrisma } from "../db/tenant-guard";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  scope: z.enum(["read", "write", "admin"]).default("read")
});

export async function tokenRoutes(app: FastifyInstance) {
  // tenant-guard injects organizationId on every query (ADR-001).
  app.get("/tokens", async () => {
    const items = await tenantPrisma.apiToken.findMany({
      where: { revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, scope: true, prefix: true, createdAt: true, lastUsedAt: true, createdById: true }
    });
    return { items };
  });

  app.post("/tokens", async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) return reply.badRequest(parsed.error.message);
    const plaintext = `cov_live_${randomBytes(24).toString("base64url")}`;
    const hash = createHash("sha256").update(plaintext).digest("hex");
    const userId = request.covenant.userId;
    const userExists = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      : null;
    const created = await tenantPrisma.apiToken.create({
      data: {
        organizationId: request.covenant.organizationId,
        name: parsed.data.name,
        scope: parsed.data.scope,
        prefix: plaintext.slice(0, 12),
        hash,
        createdById: userExists ? userId : null
      },
      select: { id: true, name: true, scope: true, prefix: true, createdAt: true }
    });
    await tenantPrisma.auditEvent.create({
      data: {
        organizationId: request.covenant.organizationId,
        userId: userExists ? userId : null,
        action: "token.created",
        targetType: "token",
        targetId: created.id,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] ?? null
      }
    });
    return reply.code(201).send({ ...created, plaintext });
  });

  app.delete("/tokens/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    // findUnique runs through the extension which post-filters cross-tenant rows.
    const tok = await tenantPrisma.apiToken.findUnique({ where: { id } });
    if (!tok) return reply.notFound();
    await tenantPrisma.apiToken.update({ where: { id }, data: { revokedAt: new Date() } });
    await tenantPrisma.auditEvent.create({
      data: {
        organizationId: request.covenant.organizationId,
        action: "token.revoked",
        targetType: "token",
        targetId: id,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] ?? null
      }
    });
    return reply.code(204).send();
  });
}
