import type { FastifyPluginAsync } from "fastify";
import { demoStore } from "../services/demo-store";
import { getBilling } from "../db/repos/catalog.repo";

export const billingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/billing", async (request, reply) => {
    try {
      return await getBilling();
    } catch (err) {
      app.log.warn({ err }, "billing.repo failed; falling back to demoStore");
      try {
        return demoStore.billing(request.covenant.organizationId);
      } catch {
        return reply.notFound("Organization not found");
      }
    }
  });
};
