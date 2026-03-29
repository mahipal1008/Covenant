import type { FastifyPluginAsync } from "fastify";
import { demoStore } from "../services/demo-store";
import { integrationAdapters } from "../integrations/adapters";
import { listIntegrations } from "../db/repos/catalog.repo";

export const integrationRoutes: FastifyPluginAsync = async (app) => {
  app.get("/integrations", async (request, reply) => {
    try {
      return {
        adapters: integrationAdapters.map((adapter) => adapter.describe()),
        configured: await listIntegrations()
      };
    } catch (err) {
      app.log.warn({ err }, "integrations.repo failed; falling back to demoStore");
      try {
        return {
          adapters: integrationAdapters.map((adapter) => adapter.describe()),
          configured: demoStore.integrations(request.covenant.organizationId)
        };
      } catch {
        return reply.notFound("Organization not found");
      }
    }
  });
};
