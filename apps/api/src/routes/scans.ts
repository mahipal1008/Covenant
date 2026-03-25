import type { FastifyPluginAsync } from "fastify";
import { runScanInputSchema } from "@covenant/shared";
import { ZodError } from "zod";
import { demoStore } from "../services/demo-store";
import { getLatestScan, getScanById } from "../db/repos/scan.repo";
import { runAndPersistScan } from "../services/scanner-service";

export const scanRoutes: FastifyPluginAsync = async (app) => {
  app.get("/scans/latest", async (request, reply) => {
    try {
      const dbScan = await getLatestScan();
      if (dbScan) return dbScan;
      // Empty DB → demo fallback.
      return demoStore.latestScan(request.covenant.organizationId);
    } catch (err) {
      app.log.warn({ err }, "scan.repo.getLatestScan failed");
      try {
        return demoStore.latestScan(request.covenant.organizationId);
      } catch {
        return reply.notFound("Organization not found");
      }
    }
  });

  app.get<{ Params: { scanId: string } }>("/scans/:scanId", async (request, reply) => {
    try {
      const dbScan = await getScanById(request.params.scanId);
      if (dbScan) return dbScan;
      const scan = demoStore.scanById(request.covenant.organizationId, request.params.scanId);
      if (!scan) return reply.notFound("Scan not found");
      return scan;
    } catch (err) {
      app.log.warn({ err }, "scan.repo.getScanById failed");
      return reply.notFound("Scan not found");
    }
  });

  app.post("/scans", async (request, reply) => {
    try {
      const input = runScanInputSchema.parse(request.body);
      // Try DB-backed scan first; if the repository doesn't exist in
      // Prisma yet, fall back to the demoStore in-memory scan path.
      try {
        const summary = await runAndPersistScan({ repositoryId: input.repositoryId });
        const persisted = await getScanById(summary.scanId);
        if (persisted) return reply.code(201).send(persisted);
      } catch (dbErr) {
        app.log.warn({ err: dbErr }, "runAndPersistScan failed; falling back to demoStore");
      }
      const scan = demoStore.runScan(request.covenant.organizationId, input.repositoryId);
      if (!scan) return reply.notFound("Repository not found");
      return reply.code(201).send(scan);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.badRequest(error.issues.map((issue) => issue.message).join(", "));
      }
      return reply.notFound("Organization not found");
    }
  });
};
