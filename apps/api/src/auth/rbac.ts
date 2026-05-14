import { newEnforcer, newModelFromString, StringAdapter } from "casbin";
import type { FastifyReply, FastifyRequest } from "fastify";
import { timingSafeEqual, randomBytes } from "node:crypto";
import { verifyAccessToken } from "./jwt";
import { enterTenant } from "../db/tenant-guard";

/**
 * Casbin RBAC + double-submit CSRF — master plan §4.2.
 *
 * RBAC model (RBAC with domains, where the domain is the organizationId):
 *   p, role, domain, resource, action
 *   g, user, role, domain
 *
 * Default policy ships three roles (owner, admin, member). Each org gets the
 * same default mapping at signup time — operators can extend later via the
 * Casbin adapter API. We embed both model + policy as strings so this works
 * out of the box without filesystem access.
 */

const RBAC_MODEL = `
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && (p.dom == "*" || r.dom == p.dom) && keyMatch(r.obj, p.obj) && (r.act == p.act || p.act == "*")
`.trim();

// Policy uses "*" as the wildcard domain, then per-tenant g rules pin a
// concrete subject to a role within the domain.
const RBAC_POLICY = `
p, owner, *, /v1/*, *
p, admin, *, /v1/*, *
p, member, *, /v1/dashboard, GET
p, member, *, /v1/repositories, GET
p, member, *, /v1/scans*, GET
p, member, *, /v1/contracts, GET
p, member, *, /v1/integrations, GET
p, member, *, /v1/billing, GET
p, member, *, /v1/audit*, GET
p, member, *, /v1/notifications*, *
p, member, *, /v1/auth/*, *
p, member, *, /v1/jobs/scan, POST
`.trim();

let enforcerPromise: Promise<Awaited<ReturnType<typeof newEnforcer>>> | null = null;

async function getEnforcer() {
  if (!enforcerPromise) {
    const model = newModelFromString(RBAC_MODEL);
    const adapter = new StringAdapter(RBAC_POLICY);
    enforcerPromise = newEnforcer(model, adapter);
  }
  return enforcerPromise;
}

/** Bind the role for a (subject, domain) pair — call from signup/membership flows. */
export async function bindUserRole(userId: string, organizationId: string, role: string) {
  const e = await getEnforcer();
  await e.addRoleForUser(userId, role, organizationId);
}

export async function checkPermission(
  userId: string,
  organizationId: string,
  path: string,
  method: string
): Promise<boolean> {
  const e = await getEnforcer();
  return e.enforce(userId, organizationId, path, method.toUpperCase());
}

/**
 * Public route allowlist — these /v1 paths must remain reachable without
 * a Bearer token because they ARE the auth/bootstrap surface, or because
 * they perform their own (HMAC) authentication.
 *
 * Anything not on this list AND under /v1/ is gated by `requireAuth`.
 */
const PUBLIC_PATH_PREFIXES = [
  "/v1/auth/login",
  "/v1/auth/signup",
  "/v1/auth/refresh",
  "/v1/auth/logout",
  "/v1/sso/", // /v1/sso/start, /v1/sso/callback — pre-login by definition
  "/v1/webhooks/github",
  "/v1/webhooks/stripe",
  "/v1/nps", // public NPS submission endpoint
  "/v1/leads" // public lead-capture endpoint
];

function isPublicPath(rawUrl: string): boolean {
  const path = rawUrl.split("?")[0] ?? rawUrl;
  // SECURITY: do NOT use unanchored `startsWith(p)` here — that would treat
  // `/v1/leads-admin` or `/v1/auth/logout-everywhere` as public and skip the
  // Bearer-token / Casbin / tenant-ALS pre-handlers. Require either an exact
  // match or a `/`-segment match (`p/...`). Prefixes that already end in `/`
  // are matched by the leading `path === p` check (cleaned below).
  return PUBLIC_PATH_PREFIXES.some((p) => {
    const trimmed = p.endsWith("/") ? p.slice(0, -1) : p;
    return path === trimmed || path.startsWith(`${trimmed}/`);
  });
}

/**
 * Fastify pre-handler: requires a valid Bearer token AND an RBAC pass for
 * the resource. Mount selectively on routes that should be authenticated.
 *
 * Header-based dev fallback (`x-organization-id`) is preserved for the
 * existing demo flows; if no Bearer token is present, the handler trusts
 * the dev-mode context already established in registerContext().
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  // Skip non-/v1 paths (health, metrics, openapi, jwks, scim — they have
  // their own auth) and the public bootstrap routes above.
  const url = request.url;
  if (!url.startsWith("/v1/")) return;
  if (isPublicPath(url)) return;

  const auth = request.headers.authorization;
  if (auth?.toLowerCase().startsWith("bearer ")) {
    try {
      const claims = await verifyAccessToken(auth.slice(7).trim());
      request.covenant = { organizationId: claims.organizationId, userId: claims.sub };
      // Enter the tenant ALS so tenantPrisma queries downstream resolve.
      enterTenant({ organizationId: claims.organizationId, userId: claims.sub });
      const ok = await checkPermission(
        claims.sub,
        claims.organizationId,
        (request as FastifyRequest & { routeOptions?: { url?: string } }).routeOptions?.url ?? request.url,
        request.method
      );
      if (!ok) return reply.forbidden("rbac: not allowed");
      return;
    } catch {
      return reply.unauthorized("invalid token");
    }
  }

  // No bearer token. In production we MUST refuse — there is no header
  // fallback. In dev/test, the demo context populated by registerContext
  // is acceptable for the existing fixture flows.
  if (process.env["NODE_ENV"] === "production") {
    return reply.unauthorized("authentication required");
  }
}

/**
 * Double-submit CSRF — issue a non-HttpOnly cookie + require an
 * X-CSRF-Token header that matches on every state-changing request. This
 * is independent of the access JWT, so it protects the cookie-based
 * refresh path. Tokens are 32-byte hex from crypto.randomBytes.
 */

const CSRF_COOKIE = "covenant-csrf";
const CSRF_HEADER = "x-csrf-token";

export function issueCsrfCookie(reply: FastifyReply) {
  const token = randomHex(32);
  reply.setCookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
  });
  return token;
}

export async function requireCsrf(request: FastifyRequest, reply: FastifyReply) {
  // Only enforce on state-changing methods.
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  // Login/signup must work without a pre-existing CSRF cookie. The CSRF
  // cookie is issued in the response, then the SPA reads it for all
  // subsequent state-changing calls.
  const path = request.url.split("?")[0] ?? request.url;
  if (path.endsWith("/auth/signup") || path.endsWith("/auth/login")) return;

  // CSRF only matters for the cookie-auth flow. Bearer-only callers (CI,
  // server-to-server, the test harness) skip the check — their tokens
  // aren't sent automatically by browsers.
  const hasRefreshCookie = Boolean(request.cookies?.["__Host-covenant-refresh"] ?? request.cookies?.["covenant-csrf"]);
  if (!hasRefreshCookie) return;

  const cookie = request.cookies?.[CSRF_COOKIE];
  const header = request.headers[CSRF_HEADER];
  const headerValue = Array.isArray(header) ? header[0] : header;
  if (!cookie || !headerValue) {
    return reply.forbidden("csrf: token missing or mismatched");
  }
  const a = Buffer.from(cookie, "utf8");
  const b = Buffer.from(headerValue, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return reply.forbidden("csrf: token missing or mismatched");
  }
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

export const csrfConfig = { cookieName: CSRF_COOKIE, headerName: CSRF_HEADER };
