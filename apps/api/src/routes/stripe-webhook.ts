import type { FastifyPluginAsync } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@covenant/db";

/**
 * Stripe webhook handler — master plan §6.
 *
 * Verifies the Stripe-Signature header per Stripe's signing scheme
 * (https://docs.stripe.com/webhooks/signatures) without pulling in the
 * stripe-node SDK — the handler stays SDK-agnostic so it can run in
 * minimal environments. Extends `Subscription` rows on
 * customer.subscription.{created,updated,deleted} events.
 *
 * Bring-up requires STRIPE_WEBHOOK_SECRET (whsec_...) from the Stripe CLI
 * or the dashboard. TEST keys are free; LIVE keys are a real business
 * decision (see §gap analysis).
 */

const TOLERANCE_SECONDS = 300; // Stripe default replay window.

function parseSignatureHeader(header: string): { t: number; v1: string[] } | null {
  const out: { t: number | null; v1: string[] } = { t: null, v1: [] };
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t" && v) {
      const n = Number.parseInt(v, 10);
      // Number.parseInt("abc",10) === NaN — Math.abs(now - NaN) is NaN
      // and NaN > 300 is false, which would let an attacker bypass the
      // replay window with a non-numeric `t`. Hard reject anything
      // non-finite.
      if (!Number.isFinite(n)) return null;
      out.t = n;
    } else if (k === "v1" && v) out.v1.push(v);
  }
  if (out.t === null || out.v1.length === 0) return null;
  return { t: out.t, v1: out.v1 };
}

function verifyStripeSignature(secret: string, payload: Buffer, header: string): boolean {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - parsed.t) > TOLERANCE_SECONDS) return false;

  const signed = `${parsed.t}.${payload.toString("utf8")}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  for (const candidate of parsed.v1) {
    if (candidate.length !== expected.length) continue;
    if (timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))) return true;
  }
  return false;
}

export const stripeWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.post("/webhooks/stripe", async (request, reply) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
    if (!secret) return reply.serviceUnavailable("stripe webhook not configured");

    const sig = request.headers["stripe-signature"];
    const sigStr = Array.isArray(sig) ? sig[0] : sig;
    if (!sigStr) return reply.badRequest("missing signature");

    const raw = (request.body as { __raw?: Buffer } | undefined)?.__raw;
    if (!raw) return reply.badRequest("missing body");

    if (!verifyStripeSignature(secret, raw, sigStr)) {
      return reply.unauthorized("invalid signature");
    }

    type StripeEvent = {
      id: string;
      type: string;
      data: { object: Record<string, unknown> };
    };
    const event = request.body as StripeEvent;

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as {
            id: string;
            customer: string;
            status: string;
            items?: { data?: { price?: { lookup_key?: string; nickname?: string } }[] };
            current_period_end?: number;
            metadata?: { organizationId?: string };
          };
          const organizationId = sub.metadata?.organizationId;
          if (organizationId) {
            const plan =
              sub.items?.data?.[0]?.price?.lookup_key ??
              sub.items?.data?.[0]?.price?.nickname ??
              "Startup";
            await prisma.subscription.upsert({
              where: { id: sub.id },
              create: {
                id: sub.id,
                organizationId,
                plan,
                status: sub.status,
                stripeCustomerId: sub.customer,
                currentPeriodEnd: sub.current_period_end
                  ? new Date(sub.current_period_end * 1000)
                  : null
              },
              update: {
                plan,
                status: sub.status,
                stripeCustomerId: sub.customer,
                currentPeriodEnd: sub.current_period_end
                  ? new Date(sub.current_period_end * 1000)
                  : null
              }
            });
          }
          break;
        }
        default:
          // Other event types acknowledged but not persisted yet.
          break;
      }
    } catch (err) {
      app.log.error({ err, eventType: event.type }, "stripe webhook handler failed");
      return reply.internalServerError("handler failed");
    }

    return { received: true, type: event.type };
  });
};
