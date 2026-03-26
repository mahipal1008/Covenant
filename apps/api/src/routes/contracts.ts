import type { FastifyPluginAsync } from "fastify";
import { demoStore } from "../services/demo-store";
import { listContracts } from "../db/repos/catalog.repo";

export const contractRoutes: FastifyPluginAsync = async (app) => {
  app.get("/contracts", async (request, reply) => {
    try {
      return await listContracts();
    } catch (err) {
      app.log.warn({ err }, "contracts.repo failed; falling back to demoStore");
      try {
        return demoStore.contracts(request.covenant.organizationId);
      } catch {
        return reply.notFound("Organization not found");
      }
    }
  });
};
