import type { FastifyPluginAsync } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * GitHub App webhook handler — master plan §4.4 / §6.
 *
 * Verifies the X-Hub-Signature-256 header against GITHUB_WEBHOOK_SECRET
 * using a timing-safe comparison, then dispatches the event by type.
 * The actual GitHub App install + secret rotation is an operator step;
 * the code below is verifiable against the fixture payloads in
 * apps/api/src/__fixtures__/github.
 */

function verifySignature(secret: string, body: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const githubWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.post("/webhooks/github", async (request, reply) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";
    if (!secret) return reply.serviceUnavailable("github webhook not configured");

    const sig = request.headers["x-hub-signature-256"];
    const sigStr = Array.isArray(sig) ? sig[0] : sig;
    const event = request.headers["x-github-event"];
    const eventStr = Array.isArray(event) ? event[0] : event;
    const deliveryId = request.headers["x-github-delivery"];
    const deliveryStr = Array.isArray(deliveryId) ? deliveryId[0] : deliveryId;

    const body = (request.body as { __raw?: Buffer } | undefined)?.__raw;
    if (!body) return reply.badRequest("missing body");

    if (!verifySignature(secret, body, sigStr)) {
      return reply.unauthorized("invalid signature");
    }

    app.log.info(
      { event: eventStr, delivery: deliveryStr },
      "github webhook delivery accepted"
    );

    // Event router. Heavy lifting is deferred to the scan-queue worker so
    // GitHub gets a fast 200 inside its 10-second budget.
    if (eventStr === "ping") return { ok: true, pong: true };
    if (eventStr === "push" || eventStr === "pull_request") {
      // TODO: enqueue scan job once webhook source maps to a Repository row.
      return { ok: true, queued: false, event: eventStr };
    }
    return { ok: true, event: eventStr ?? "unknown" };
  });
};
