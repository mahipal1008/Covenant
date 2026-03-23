import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z, ZodError } from "zod";
import { prisma } from "@covenant/db";
import { hashPassword, verifyPassword } from "../auth/password";
import {
  authConfig,
  generateRefreshToken,
  getPublicJwks,
  hashRefreshToken,
  issueAccessToken,
  verifyAccessToken
} from "../auth/jwt";
import { bindUserRole, issueCsrfCookie } from "../auth/rbac";
import {
  AUTH_LOGIN_LIMIT,
  AUTH_REFRESH_LIMIT,
  AUTH_SIGNUP_LIMIT,
  authRateLimit
} from "../auth/rate-limit";

/**
 * Auth routes — master plan §4.2.
 *
 * Endpoints:
 *   POST   /v1/auth/signup       — first-user / dev signup
 *   POST   /v1/auth/login        — email + password → access JWT + refresh cookie
 *   POST   /v1/auth/refresh      — refresh cookie → new access token (+ rotated refresh)
 *   POST   /v1/auth/logout       — revoke session
 *   GET    /v1/auth/me           — verify access token, return claims
 *   GET    /.well-known/jwks.json — public RS256 JWKS
 *
 * Cookie strategy:
 *   __Host-covenant-refresh: HttpOnly, Secure, SameSite=Lax, Path=/.
 *   Access token returned in JSON body (caller stores in memory, sends as Bearer).
 *
 *   The `__Host-` prefix is required by RFC 6265bis to come with Path=/
 *   (no Domain attribute, Secure). SameSite=Lax instead of Strict so the
 *   cookie survives top-level navigations from external origins like the
 *   Stripe Checkout return URL — CSRF on POSTs is still covered by the
 *   double-submit token in `auth/rbac.ts`.
 *
 * Deferred (next session, scoped follow-up):
 *   - Casbin RBAC policy enforcement at handler granularity.
 *   - Double-submit CSRF cookie (only needed once cookies carry access).
 *   - Rate limiting / lockout on /login.
 */

const REFRESH_COOKIE = "__Host-covenant-refresh";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1),
  organizationName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function setRefreshCookie(reply: FastifyReply, token: string, expiresAt: Date) {
  // RFC 6265bis: __Host- requires Secure + Path=/ + no Domain. We keep
  // the prefix for prod and accept that the cookie scope is the whole
  // origin — the cookie value is only meaningful to /v1/auth/* anyway,
  // which is the only place we read it. SameSite=Lax (vs Strict) so
  // post-Stripe-checkout top-level redirects don't drop the session.
  const isProd = process.env.NODE_ENV === "production";
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE, { path: "/" });
}

async function readBearer(request: FastifyRequest): Promise<string | null> {
  const header = request.headers.authorization;
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/signup", { preHandler: authRateLimit("signup", AUTH_SIGNUP_LIMIT) }, async (request, reply) => {
    try {
      const body = signupSchema.parse(request.body);
      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) return reply.conflict("user already exists");

      const passwordHash = await hashPassword(body.password);
      const slug = body.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      const user = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: body.organizationName,
            slug: `${slug}-${Date.now().toString(36)}`
          }
        });
        const user = await tx.user.create({
          data: { email: body.email, name: body.name, passwordHash }
        });
        await tx.membership.create({
          data: { userId: user.id, organizationId: org.id, role: "owner" }
        });
        return { ...user, organizationId: org.id, role: "owner" };
      });

      const access = await issueAccessToken({
        sub: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role
      });
      const refresh = generateRefreshToken();
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: refresh.hash,
          expiresAt: refresh.expiresAt,
          userAgent: request.headers["user-agent"] ?? null,
          ipAddress: request.ip
        }
      });
      setRefreshCookie(reply, refresh.token, refresh.expiresAt);
      issueCsrfCookie(reply);
      await bindUserRole(user.id, user.organizationId, user.role);
      return reply.code(201).send({
        accessToken: access,
        expiresIn: authConfig.accessTtlSeconds,
        user: { id: user.id, email: user.email, name: user.name, organizationId: user.organizationId }
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.badRequest(err.issues.map((i) => i.message).join(", "));
      }
      app.log.error({ err }, "signup failed");
      return reply.internalServerError("signup failed");
    }
  });

  app.post("/auth/login", { preHandler: authRateLimit("login", AUTH_LOGIN_LIMIT) }, async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const user = await prisma.user.findUnique({
        where: { email: body.email },
        include: { memberships: { take: 1, orderBy: { createdAt: "asc" } } }
      });
      // Always run argon2 verify against a stable hash on the unknown-user
      // path to avoid email-existence timing leaks.
      const referenceHash =
        user?.passwordHash ??
        "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      const ok = await verifyPassword(body.password, referenceHash);
      const membership = user?.memberships[0];
      if (!ok || !user || !user.passwordHash || !membership) {
        return reply.unauthorized("invalid credentials");
      }

      const access = await issueAccessToken({
        sub: user.id,
        email: user.email,
        organizationId: membership.organizationId,
        role: membership.role
      });
      const refresh = generateRefreshToken();
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: refresh.hash,
          expiresAt: refresh.expiresAt,
          userAgent: request.headers["user-agent"] ?? null,
          ipAddress: request.ip
        }
      });
      setRefreshCookie(reply, refresh.token, refresh.expiresAt);
      issueCsrfCookie(reply);
      await bindUserRole(user.id, membership.organizationId, membership.role);
      return {
        accessToken: access,
        expiresIn: authConfig.accessTtlSeconds,
        user: { id: user.id, email: user.email, name: user.name, organizationId: membership.organizationId }
      };
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.badRequest(err.issues.map((i) => i.message).join(", "));
      }
      app.log.error({ err }, "login failed");
      return reply.internalServerError("login failed");
    }
  });

  app.post("/auth/refresh", { preHandler: authRateLimit("refresh", AUTH_REFRESH_LIMIT) }, async (request, reply) => {
    const cookie = request.cookies?.[REFRESH_COOKIE];
    if (!cookie) return reply.unauthorized("missing refresh token");
    const tokenHash = hashRefreshToken(cookie);
    const session = await prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: {
        user: { include: { memberships: { take: 1, orderBy: { createdAt: "asc" } } } }
      }
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return reply.unauthorized("invalid refresh token");
    }
    const membership = session.user.memberships[0];
    if (!membership) return reply.unauthorized("no membership");

    // Rotate refresh token to defeat replay.
    const next = generateRefreshToken();
    await prisma.$transaction([
      prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() }
      }),
      prisma.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash: next.hash,
          expiresAt: next.expiresAt,
          userAgent: request.headers["user-agent"] ?? null,
          ipAddress: request.ip
        }
      })
    ]);

    const access = await issueAccessToken({
      sub: session.userId,
      email: session.user.email,
      organizationId: membership.organizationId,
      role: membership.role
    });
    setRefreshCookie(reply, next.token, next.expiresAt);
    return { accessToken: access, expiresIn: authConfig.accessTtlSeconds };
  });

  app.post("/auth/logout", async (request, reply) => {
    const cookie = request.cookies?.[REFRESH_COOKIE];
    if (cookie) {
      const tokenHash = hashRefreshToken(cookie);
      await prisma.session.updateMany({
        where: { refreshTokenHash: tokenHash, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
    clearRefreshCookie(reply);
    return reply.code(204).send();
  });

  app.get("/auth/me", async (request, reply) => {
    const token = await readBearer(request);
    if (!token) return reply.unauthorized("missing bearer token");
    try {
      const claims = await verifyAccessToken(token);
      return claims;
    } catch {
      return reply.unauthorized("invalid token");
    }
  });
};

/** Public JWKS — registered without a /v1 prefix. */
export const jwksRoutes: FastifyPluginAsync = async (app) => {
  app.get("/.well-known/jwks.json", async () => getPublicJwks());
};
