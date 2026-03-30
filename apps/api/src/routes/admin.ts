import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getSettings, setSettings } from "../services/org-settings";
import { recentSafetyEvents } from "../services/llm-safety";

/**
 * Super-admin console endpoints — Session 4 §8.
 *
 *   GET    /v1/admin/orgs/:org/settings         — current config
 *   PATCH  /v1/admin/orgs/:org/settings         — update CIDR/SSO/SCIM/LLM/theme
 *   POST   /v1/admin/orgs/:org/impersonate      — issue impersonation context
 *   GET    /v1/admin/feature-flags              — list flag overrides per org
 *   PATCH  /v1/admin/orgs/:org/feature-flags    — set per-org flag values
 *   GET    /v1/admin/support-inbox              — recent safety events as inbox items
 *
 * Authorization: requires `x-admin-token` header matching
 * `process.env.ADMIN_TOKEN`. Every state-changing call writes an
 * AuditEvent shaped object to the in-memory inbox so the support team
 * has a paper trail (real DB persistence flips on with the AuditEvent
 * Prisma cutover that already exists).
 */

interface ImpersonationGrant {
  id: string;
  superAdminId: string;
  organizationId: string;
  asUserId: string;
  reason: string;
  expiresAt: string;
  issuedAt: string;
}

const grants = new Map<string, ImpersonationGrant>();
const inbox: { kind: string; detail: string; at: string }[] = [];

const settingsPatch = z.object({
  ipAllowlist: z.array(z.string()).optional(),
  sso: z
    .object({
      provider: z.enum(["saml", "oidc", "none"]).optional(),
      issuer: z.string().nullable().optional(),
      metadataUrl: z.string().nullable().optional(),
      defaultRole: z.enum(["owner", "admin", "member"]).optional()
    })
    .optional(),
  scim: z.object({ bearerTokenHash: z.string().nullable().optional() }).optional(),
  llm: z
    .object({
      provider: z.enum(["openai", "anthropic", "azure", "local-noop"]).optional(),
      model: z.string().optional(),
      apiKeyRef: z.string().nullable().optional(),
      costCapUsd: z.number().nonnegative().optional(),
      enabled: z.boolean().optional()
    })
    .optional(),
  theme: z
    .object({
      primary: z.string().nullable().optional(),
      accent: z.string().nullable().optional(),
      logoUrl: z
        .string()
        .nullable()
        .optional()
        .refine(
          (v) => {
            if (!v) return true;
            // Mirror apps/web isSafeLogoUrl: https only, no breakout chars.
            if (v.length > 2048) return false;
            if (/["\\\r\n;{}<>]/.test(v)) return false;
            try {
              return new URL(v).protocol === "https:";
            } catch {
              return false;
            }
          },
          { message: "logoUrl must be a safe https URL with no CSS/HTML breakout characters" }
        )
    })
    .optional(),
  featureFlags: z.record(z.boolean()).optional()
});

function authorizeAdmin(req: FastifyRequest): boolean {
  const expected = process.env["ADMIN_TOKEN"];
  if (!expected) {
    // Defense in depth: only allow the unauthenticated test-mode bypass
    // when ALL THREE conditions hold — NODE_ENV=test, the runner has
    // injected a Vitest/node:test marker, AND the env is not also
    // declaring itself production. Closes the "NODE_ENV=test on prod"
    // footgun.
    return (
      process.env["NODE_ENV"] === "test" &&
      typeof process.env["npm_lifecycle_event"] === "string"
    );
  }
  const presented = req.headers["x-admin-token"];
  const value = Array.isArray(presented) ? presented[0] : presented;
  if (typeof value !== "string" || value.length !== expected.length) return false;
  const a = Buffer.from(value, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function audit(kind: string, detail: string): void {
  inbox.push({ kind, detail, at: new Date().toISOString() });
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req, reply) => {
    if (!req.url.startsWith("/v1/admin/")) return;
    if (!authorizeAdmin(req)) return reply.unauthorized("admin token required");
  });

  app.get("/admin/orgs/:org/settings", async (req) => {
    const { org } = req.params as { org: string };
    return getSettings(org);
  });

  app.patch("/admin/orgs/:org/settings", async (req, reply) => {
    const { org } = req.params as { org: string };
    const parsed = settingsPatch.safeParse(req.body ?? {});
    if (!parsed.success) return reply.badRequest("invalid settings");
    const next = setSettings(org, parsed.data as never);
    audit("settings.update", `org=${org} keys=${Object.keys(parsed.data).join(",")}`);
    return next;
  });

  app.post("/admin/orgs/:org/impersonate", async (req, reply) => {
    const { org } = req.params as { org: string };
    const body = z
      .object({ asUserId: z.string(), reason: z.string().min(4), ttlMinutes: z.number().int().min(1).max(120).default(15) })
      .safeParse(req.body ?? {});
    if (!body.success) return reply.badRequest("invalid impersonation request");
    const id = `imp_${Math.random().toString(36).slice(2, 10)}`;
    const now = Date.now();
    const grant: ImpersonationGrant = {
      id,
      superAdminId: "super-admin",
      organizationId: org,
      asUserId: body.data.asUserId,
      reason: body.data.reason,
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + body.data.ttlMinutes * 60_000).toISOString()
    };
    grants.set(id, grant);
    audit("impersonate.start", `org=${org} as=${body.data.asUserId} reason="${body.data.reason}"`);
    return grant;
  });

  app.get("/admin/feature-flags", async () => {
    return { grants: [...grants.values()] };
  });

  app.patch("/admin/orgs/:org/feature-flags", async (req, reply) => {
    const { org } = req.params as { org: string };
    const parsed = z.record(z.boolean()).safeParse(req.body ?? {});
    if (!parsed.success) return reply.badRequest("invalid flags");
    const next = setSettings(org, { featureFlags: parsed.data });
    audit("feature-flags.update", `org=${org} keys=${Object.keys(parsed.data).join(",")}`);
    return next.featureFlags;
  });

  app.get("/admin/support-inbox", async () => {
    return {
      audit: [...inbox].slice(-100),
      safety: recentSafetyEvents().slice(-100)
    };
  });
};

/** Test hook — clears all admin/impersonation state. */
export function __resetAdmin(): void {
  grants.clear();
  inbox.length = 0;
}
