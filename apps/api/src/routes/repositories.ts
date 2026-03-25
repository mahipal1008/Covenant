import type { FastifyPluginAsync } from "fastify";
import { createRepositoryInputSchema } from "@covenant/shared";
import { ZodError } from "zod";
import { demoStore } from "../services/demo-store";
import { listRepositories, createRepository } from "../db/repos/repository.repo";

/**
 * Repositories route. Reads now go through the Prisma-backed repo (which
 * runs through tenant-guard); writes still flow through demoStore so the
 * existing scan kickoff stays consistent until scan.repo lands.
 */
export const repositoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/repositories", async (_request, reply) => {
    try {
      const items = await listRepositories();
      return items;
    } catch (err) {
      app.log.error({ err }, "listRepositories failed");
      return reply.notFound("Organization not found");
    }
  });

  app.post("/repositories", async (request, reply) => {
    try {
      const input = createRepositoryInputSchema.parse(request.body);
      // Persist through Prisma (tenant-guard injects org).
      const repository = await createRepository({
        name: input.name,
        provider: input.provider,
        defaultBranch: input.defaultBranch,
        language: input.language
      });
      // Mirror into demoStore so legacy in-memory readers see it too. This
      // bridge goes away once dashboard.ts and scans.ts are migrated.
      try {
        demoStore.createRepository(request.covenant.organizationId, input);
      } catch {
        /* demoStore mirror is best-effort */
      }
      return reply.code(201).send(repository);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.badRequest(error.issues.map((issue) => issue.message).join(", "));
      }
      app.log.error({ err: error }, "createRepository failed");
      return reply.notFound("Organization not found");
    }
  });
};
