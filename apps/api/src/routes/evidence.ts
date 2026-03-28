import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { listEvidence, putEvidence, type EvidenceCategory } from "../services/evidence-vault";

const categories = ["ci-artifact", "policy-doc", "training-record", "vendor-risk"] as const;

const putSchema = z.object({
  category: z.enum(categories),
  name: z.string().min(1).max(200),
  contentType: z.string().max(120).optional(),
  /** Body is supplied as base64 to keep the JSON contract clean. */
  bodyBase64: z.string().min(1)
});

const listSchema = z.object({
  category: z.enum(categories).optional()
});

/**
 * Evidence vault endpoints — Session 6 §6. Admin-scoped.
 * The route layer is intentionally thin: storage backend selection
 * happens inside `services/evidence-vault.ts`.
 */
export async function evidenceRoutes(app: FastifyInstance) {
  app.get("/evidence", async (request, reply) => {
    const parsed = listSchema.safeParse(request.query ?? {});
    if (!parsed.success) return reply.badRequest(parsed.error.message);
    const items = await listEvidence(parsed.data.category as EvidenceCategory | undefined);
    return { items };
  });

  app.post("/evidence", async (request, reply) => {
    const parsed = putSchema.safeParse(request.body);
    if (!parsed.success) return reply.badRequest(parsed.error.message);
    const body = Buffer.from(parsed.data.bodyBase64, "base64");
    const meta = await putEvidence({
      category: parsed.data.category,
      name: parsed.data.name,
      body,
      ...(parsed.data.contentType !== undefined ? { contentType: parsed.data.contentType } : {})
    });
    return reply.code(201).send(meta);
  });
}
