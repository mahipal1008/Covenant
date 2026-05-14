import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import cookie from "@fastify/cookie";
import Fastify from "fastify";
import { loadConfig } from "./config";
import { registerContext } from "./context";
import { auditRoutes } from "./routes/audit";
import { authRoutes, jwksRoutes } from "./routes/auth";
import { billingRoutes } from "./routes/billing";
import { billingDepthRoutes } from "./routes/billing-depth";
import { contractRoutes } from "./routes/contracts";
import { dashboardRoutes } from "./routes/dashboard";
import { dataExportRoutes } from "./routes/data-export";
import { githubWebhookRoutes } from "./routes/github-webhook";
import { healthRoutes } from "./routes/health";
import { integrationRoutes } from "./routes/integrations";
import { intelligenceRoutes } from "./routes/intelligence";
import { jobsRoutes } from "./routes/jobs";
import { metricsRoutes } from "./routes/metrics";
import { notificationRoutes } from "./routes/notifications";
import { openapiRoutes } from "./routes/openapi";
import { platformRoutes } from "./routes/platform";
import { repositoryRoutes } from "./routes/repositories";
import { scanRoutes } from "./routes/scans";
import { stripeWebhookRoutes } from "./routes/stripe-webhook";
import { tokenRoutes } from "./routes/tokens";
import { webhookSubRoutes } from "./routes/webhooks-subs";
import { ssoRoutes } from "./routes/sso";
import { scimRoutes } from "./routes/scim";
import { adminRoutes } from "./routes/admin";
import { growthRoutes } from "./routes/growth";
import { rtbfRoutes } from "./routes/rtbf";
import { evidenceRoutes } from "./routes/evidence";
import { enforceIpAllowlist } from "./auth/ip-allowlist";
import { CovenantError } from "./errors";

export function buildApp() {
  const config = loadConfig();
  const app = Fastify({
    logger:
      config.nodeEnv === "test"
        ? false
        : {
            level: "info"
          }
  });

  // CORS — Session 9 security review §3. In production we honor only the
  // explicit `CORS_ORIGIN` value (or a comma-separated list); localhost is
  // never trusted. In dev/test we keep localhost in the allowlist so the
  // Next.js app and Playwright runners work out of the box.
  const isProduction = config.nodeEnv === "production";
  const configuredOrigins = config.corsOrigin.split(",").map((s) => s.trim()).filter(Boolean);
  const corsOrigins = isProduction
    ? configuredOrigins
    : [...new Set([...configuredOrigins, "http://localhost:3000", "http://127.0.0.1:3000"])];
  app.register(cors, {
    origin: corsOrigins,
    credentials: true
  });
  // Advanced security headers — Session 4 §7.
  // CSP is enforce-mode (no report-only). COOP/COEP isolate the
  // origin so Spectre-class side channels are blunted. SRI is enforced
  // on the web client; here we just add Permissions-Policy + HSTS.
  app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "connect-src": ["'self'", ...config.corsOrigins],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"]
      }
    },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginEmbedderPolicy: { policy: "require-corp" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "no-referrer" },
    strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true }
  });
  if (config.nodeEnv !== "test") {
    app.register(rateLimit, {
      max: 240,
      timeWindow: "1 minute",
      allowList: ["127.0.0.1", "::1"]
    });
  }
  app.register(sensible);
  app.register(cookie);
  registerContext(app);

  // Map domain errors → HTTP responses. Anything else falls through to
  // Fastify's default error handler (500 with sanitized body).
  app.setErrorHandler((err, _request, reply) => {
    if (err instanceof CovenantError) {
      return reply.code(err.statusCode).send({
        statusCode: err.statusCode,
        code: err.code,
        message: err.message
      });
    }
    throw err;
  });

  // Capture raw body for HMAC-verified webhooks (GitHub, Stripe). The
  // existing JSON parser is replaced with a raw+parsed wrapper so signed
  // payloads can be re-hashed byte-for-byte.
  app.removeContentTypeParser(["application/json"]);
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_req, body, done) => {
      try {
        const buf = body as Buffer;
        const text = buf.toString("utf8");
        const parsed = text ? JSON.parse(text) : {};
        done(null, { ...parsed, __raw: buf });
      } catch (err) {
        done(err as Error);
      }
    }
  );

  // Double-submit CSRF on state-changing requests. Lazy import to keep
  // the module graph dependency-direction clean (rbac depends on jwt).
  app.addHook("preHandler", async (request, reply) => {
    const { requireCsrf } = await import("./auth/rbac");
    return requireCsrf(request, reply);
  });

  // Bearer-token auth + tenant ALS entry on every /v1/* path that is not
  // on the public allowlist (auth/login, auth/signup, webhooks, etc.).
  app.addHook("preHandler", async (request, reply) => {
    const { requireAuth } = await import("./auth/rbac");
    return requireAuth(request, reply);
  });

  // Per-org IP allowlist (Session 4 §3) — empty list = allow-all.
  app.addHook("preHandler", enforceIpAllowlist);

  app.register(openapiRoutes);
  app.register(healthRoutes);
  app.register(metricsRoutes);
  app.register(jwksRoutes);
  app.register(githubWebhookRoutes, { prefix: "/v1" });
  app.register(stripeWebhookRoutes, { prefix: "/v1" });
  app.register(authRoutes, { prefix: "/v1" });
  app.register(dashboardRoutes, { prefix: "/v1" });
  app.register(repositoryRoutes, { prefix: "/v1" });
  app.register(scanRoutes, { prefix: "/v1" });
  app.register(contractRoutes, { prefix: "/v1" });
  app.register(integrationRoutes, { prefix: "/v1" });
  app.register(billingRoutes, { prefix: "/v1" });
  app.register(intelligenceRoutes, { prefix: "/v1" });
  app.register(platformRoutes, { prefix: "/v1" });
  app.register(tokenRoutes, { prefix: "/v1" });
  app.register(webhookSubRoutes, { prefix: "/v1" });
  app.register(auditRoutes, { prefix: "/v1" });
  app.register(notificationRoutes, { prefix: "/v1" });
  app.register(dataExportRoutes, { prefix: "/v1" });
  app.register(billingDepthRoutes, { prefix: "/v1" });
  app.register(jobsRoutes, { prefix: "/v1" });
  app.register(ssoRoutes, { prefix: "/v1" });
  app.register(scimRoutes);
  app.register(adminRoutes, { prefix: "/v1" });
  app.register(growthRoutes, { prefix: "/v1" });
  app.register(rtbfRoutes, { prefix: "/v1" });
  app.register(evidenceRoutes, { prefix: "/v1" });

  return app;
}
