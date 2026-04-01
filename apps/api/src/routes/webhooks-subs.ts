import { randomBytes, createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@covenant/db";
import { tenantPrisma } from "../db/tenant-guard";

const eventChoices = [
  "scan.completed",
  "scan.failed",
  "finding.created",
  "finding.resolved",
  "contract.violated",
  "pr.gate.blocked"
] as const;

/**
 * SSRF guard for webhook delivery URLs — Session 9 review §5.
 *
 * Blocks the cloud metadata endpoints, loopback, link-local, and
 * private RFC 1918 ranges. Without this, a tenant could subscribe a
 * webhook to `http://169.254.169.254/latest/meta-data/iam/...` and use
 * the worker as an SSRF egress to read AWS instance credentials.
 *
 * In dev/test we relax the loopback check so local fixtures can deliver
 * to 127.0.0.1 — production rejects unconditionally.
 */
const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./, // link-local incl. AWS metadata
  /^0\./,
  /^localhost$/i,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i, // unique-local IPv6
  /^fe[89ab][0-9a-f]:/i // link-local IPv6
];

function isUnsafeWebhookUrl(raw: string): { ok: false; reason: string } | { ok: true } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid url" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: "only http(s) URLs allowed" };
  }
  if (process.env["NODE_ENV"] === "production" && parsed.protocol !== "https:") {
    return { ok: false, reason: "https required in production" };
  }
  const host = parsed.hostname;
  // Allow localhost only outside production.
  const allowLoopback = process.env["NODE_ENV"] !== "production";
  for (const pattern of PRIVATE_HOST_PATTERNS) {
    if (pattern.test(host)) {
      if (allowLoopback && (/^127\./.test(host) || /^localhost$/i.test(host) || host === "::1")) {
        continue;
      }
      return { ok: false, reason: `webhook host ${host} is not routable` };
    }
  }
  return { ok: true };
}

const createSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => isUnsafeWebhookUrl(u).ok, {
      message: "webhook url targets a private/loopback/metadata host"
    }),
  events: z.array(z.enum(eventChoices)).min(1)
});

export async function webhookSubRoutes(app: FastifyInstance) {
  app.get("/webhooks/subscriptions", async () => {
    const items = await tenantPrisma.webhookSubscription.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, organizationId: true, url: true, events: true, active: true, secretPrefix: true, createdAt: true }
    });
    return { items, events: eventChoices };
  });

  app.post("/webhooks/subscriptions", async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) return reply.badRequest(parsed.error.message);
    const secret = `whsec_${randomBytes(20).toString("base64url")}`;
    const secretHash = createHash("sha256").update(secret).digest("hex");
    const created = await tenantPrisma.webhookSubscription.create({
      data: {
        organizationId: request.covenant.organizationId,
        url: parsed.data.url,
        events: parsed.data.events,
        active: true,
        secretHash,
        secretPrefix: secret.slice(0, 11)
      },
      select: { id: true, organizationId: true, url: true, events: true, active: true, secretPrefix: true, createdAt: true }
    });
    return reply.code(201).send({ ...created, secret });
  });

  app.delete("/webhooks/subscriptions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sub = await tenantPrisma.webhookSubscription.findUnique({ where: { id } });
    if (!sub) return reply.notFound();
    await tenantPrisma.webhookSubscription.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.get("/webhooks/deliveries", async (request) => {
    // WebhookDelivery isn't directly tenant-scoped (no organizationId column);
    // it's reached via its parent subscription which IS tenant-scoped, so we
    // first list our subs then pull the deliveries.
    const orgId = request.covenant.organizationId;
    const items = await prisma.webhookDelivery.findMany({
      where: { subscription: { organizationId: orgId } },
      orderBy: { attemptedAt: "desc" },
      take: 50,
      select: { id: true, subscriptionId: true, event: true, status: true, responseCode: true, attempts: true, attemptedAt: true }
    });
    return { items };
  });
}
