import type { FastifyInstance } from "fastify";
import { enterTenant } from "./db/tenant-guard";

declare module "fastify" {
  interface FastifyRequest {
    covenant: {
      organizationId: string;
      userId: string;
    };
  }
}

/**
 * Demo / dev tenant defaults — only applied when NODE_ENV !== "production".
 * In production, requests without a verified Bearer token (handled by the
 * `requireAuth` pre-handler in `auth/rbac.ts`) leave `request.covenant`
 * unset; downstream code that touches it will throw `TypeError`, which is
 * the loudest possible failure mode and exactly what we want.
 */
const DEMO_ORG_ID = "org_covenant_demo";
const DEMO_USER_ID = "user_demo_founder";

function pickHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function registerContext(app: FastifyInstance) {
  const isProduction = process.env["NODE_ENV"] === "production";

  app.addHook("onRequest", async (request) => {
    const organizationHeader = pickHeader(request.headers["x-organization-id"]);
    const userHeader = pickHeader(request.headers["x-user-id"]);

    if (isProduction) {
      // Production: never trust headers, never default. requireAuth() in
      // rbac.ts is the only path that may populate request.covenant. If
      // a route reads request.covenant without going through requireAuth
      // first, that is a bug — fail loudly rather than silently leaking.
      return;
    }

    const organizationId = organizationHeader ?? DEMO_ORG_ID;
    const userId = userHeader ?? DEMO_USER_ID;
    request.covenant = { organizationId, userId };

    // Enter the tenant ALS for the rest of this request's async chain
    // (ADR-001). Every tenant-scoped Prisma query reads from this store via
    // the tenant-guard extension.
    enterTenant({ organizationId, userId });
  });
}
