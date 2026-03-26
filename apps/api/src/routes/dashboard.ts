import type { FastifyPluginAsync } from "fastify";
import { getDashboard } from "../db/repos/dashboard.repo";
import { demoStore } from "../services/demo-store";

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/dashboard", async (request, reply) => {
    try {
      // Prisma-backed (tenant-guarded). Falls back to demo on empty DB.
      return await getDashboard();
    } catch (err) {
      app.log.warn({ err }, "dashboard.repo failed; falling back to demoStore");
      try {
        return demoStore.dashboard(request.covenant.organizationId);
      } catch {
        return reply.notFound("Organization not found");
      }
    }
  });
};
