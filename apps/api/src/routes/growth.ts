import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sendEmail } from "../services/email";

/**
 * Lead capture + NPS — Session 5 §4, §7.
 *
 *   POST /v1/leads     — marketing form submissions
 *   POST /v1/nps       — in-product NPS responses
 *   GET  /v1/nps/score — aggregate score for the current org
 *
 * Storage is in-memory until the NpsResponse + Lead Prisma models
 * land. The shape and contract are stable so the cutover is a
 * mechanical edit later.
 */

const leadSchema = z.object({
  email: z.string().email(),
  message: z.string().max(4_000).optional(),
  source: z.enum(["home", "pricing", "contact"])
});

const npsSchema = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().max(2_000).optional()
});

interface LeadRow {
  id: string;
  email: string;
  message: string | null;
  source: string;
  at: string;
}

interface NpsRow {
  id: string;
  organizationId: string;
  userId: string;
  score: number;
  comment: string | null;
  at: string;
}

const leads: LeadRow[] = [];
const nps: NpsRow[] = [];

export const growthRoutes: FastifyPluginAsync = async (app) => {
  app.post("/leads", async (req, reply) => {
    const parsed = leadSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.badRequest("invalid lead");
    const id = `lead_${Math.random().toString(36).slice(2, 10)}`;
    const row: LeadRow = {
      id,
      email: parsed.data.email,
      message: parsed.data.message ?? null,
      source: parsed.data.source,
      at: new Date().toISOString()
    };
    leads.push(row);
    // Best-effort notification — the noop provider keeps tests hermetic.
    void sendEmail({
      to: process.env["LEAD_NOTIFY_EMAIL"] ?? "growth@covenant.dev",
      subject: `[lead] ${parsed.data.email} from ${parsed.data.source}`,
      text: parsed.data.message ?? "(no message)"
    }).catch(() => undefined);
    return reply.code(201).send(row);
  });

  app.post("/nps", async (req, reply) => {
    const parsed = npsSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.badRequest("invalid nps");
    const ctx = req.covenant;
    const row: NpsRow = {
      id: `nps_${Math.random().toString(36).slice(2, 10)}`,
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      score: parsed.data.score,
      comment: parsed.data.comment ?? null,
      at: new Date().toISOString()
    };
    nps.push(row);
    return reply.code(201).send(row);
  });

  app.get("/nps/score", async (req) => {
    const orgId = req.covenant.organizationId;
    const rows = nps.filter((r) => r.organizationId === orgId);
    if (rows.length === 0) return { count: 0, score: null };
    const promoters = rows.filter((r) => r.score >= 9).length;
    const detractors = rows.filter((r) => r.score <= 6).length;
    return {
      count: rows.length,
      score: Math.round(((promoters - detractors) / rows.length) * 100)
    };
  });
};

/** Test/admin hook. */
export function __resetGrowth(): void {
  leads.length = 0;
  nps.length = 0;
}
