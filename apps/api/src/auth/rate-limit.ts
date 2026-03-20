/**
 * In-memory token-bucket rate limiter for the auth endpoints — Session 9
 * security review §3.
 *
 * Lives alongside the global @fastify/rate-limit plugin (240/min) and
 * applies tighter caps to login/signup/refresh, which are the targets of
 * brute force and credential stuffing.
 *
 * Keyed by client IP. In-memory storage is fine for single-instance
 * deploys; for multi-instance, swap the bucket store for the same Redis
 * the global plugin uses (`redis: app.redis`).
 *
 * Disabled when NODE_ENV === "test" so the existing route tests don't
 * have to thread artificial delays.
 */

import type { FastifyReply, FastifyRequest } from "fastify";

interface Bucket {
  count: number;
  resetAt: number;
}

interface Limit {
  max: number;
  windowMs: number;
}

const buckets = new Map<string, Bucket>();

// Cap on bucket-map size to bound memory under attacker-driven IP rotation.
// When exceeded we sweep all expired entries; if still over, we evict the
// oldest entries by resetAt. 10k unique IPs is generous for a single
// instance; multi-instance deploys should move to Redis (see file header).
const MAX_BUCKETS = 10_000;

function pruneExpired(now: number): void {
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
  if (buckets.size <= MAX_BUCKETS) return;
  // Still over — evict the oldest by resetAt.
  const entries = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
  const overflow = buckets.size - MAX_BUCKETS;
  for (let i = 0; i < overflow; i += 1) {
    const entry = entries[i];
    if (entry) buckets.delete(entry[0]);
  }
}

function key(scope: string, ip: string): string {
  return `${scope}:${ip}`;
}

function consume(scope: string, ip: string, limit: Limit): boolean {
  const k = key(scope, ip);
  const now = Date.now();
  // Amortized prune — only when the map crosses the threshold.
  if (buckets.size > MAX_BUCKETS) pruneExpired(now);
  const bucket = buckets.get(k);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(k, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit.max;
}

export function authRateLimit(scope: string, limit: Limit) {
  return async function rateLimitHook(request: FastifyRequest, reply: FastifyReply) {
    if (process.env["NODE_ENV"] === "test") return;
    const ip = request.ip || "unknown";
    if (!consume(scope, ip, limit)) {
      reply.header("retry-after", Math.ceil(limit.windowMs / 1000));
      return reply.code(429).send({
        statusCode: 429,
        error: "Too Many Requests",
        message: `rate limit exceeded for ${scope}`
      });
    }
  };
}

/** Test hook — clears all buckets between scenarios. */
export function __resetAuthRateLimits(): void {
  buckets.clear();
}

export const AUTH_LOGIN_LIMIT: Limit = { max: 10, windowMs: 60_000 };
export const AUTH_SIGNUP_LIMIT: Limit = { max: 5, windowMs: 60_000 };
export const AUTH_REFRESH_LIMIT: Limit = { max: 30, windowMs: 60_000 };
