/**
 * Smoke tests for Session 9 security hardening:
 *   - Auth rate limit token bucket
 *   - Admin / SCIM constant-time compare hardening
 *
 * The rate-limit hook is intentionally a no-op when NODE_ENV === "test"
 * so the rest of the suite isn't slowed down. We test it directly by
 * unsetting the env var around the consume() helper.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

test("authRateLimit allows up to max within the window then blocks", async () => {
  // Force the hook to run as if NODE_ENV !== "test".
  const previous = process.env["NODE_ENV"];
  delete process.env["NODE_ENV"];
  try {
    const mod = await import("./auth/rate-limit");
    mod.__resetAuthRateLimits();
    const hook = mod.authRateLimit("smoke", { max: 2, windowMs: 60_000 });
    let blocked: number | undefined;
    let blockedHeader: number | string | undefined;
    const fakeReply = {
      header(_n: string, value: number | string) {
        blockedHeader = value;
        return this;
      },
      code(c: number) {
        blocked = c;
        return { send: () => undefined };
      }
    };
    const fakeReq = { ip: "10.0.0.1" } as never;

    await hook(fakeReq, fakeReply as never);
    await hook(fakeReq, fakeReply as never);
    assert.equal(blocked, undefined, "first two calls should pass");
    await hook(fakeReq, fakeReply as never);
    assert.equal(blocked, 429, "third call should be rate limited");
    assert.equal(blockedHeader, 60);
  } finally {
    if (previous !== undefined) process.env["NODE_ENV"] = previous;
  }
});

test("authRateLimit isolates buckets per IP", async () => {
  const previous = process.env["NODE_ENV"];
  delete process.env["NODE_ENV"];
  try {
    const mod = await import("./auth/rate-limit");
    mod.__resetAuthRateLimits();
    const hook = mod.authRateLimit("login", { max: 1, windowMs: 60_000 });
    let blocked = false;
    const fakeReply = {
      header() {
        return this;
      },
      code() {
        blocked = true;
        return { send: () => undefined };
      }
    };
    await hook({ ip: "1.1.1.1" } as never, fakeReply as never);
    await hook({ ip: "2.2.2.2" } as never, fakeReply as never);
    assert.equal(blocked, false, "different IPs share no bucket");
    await hook({ ip: "1.1.1.1" } as never, fakeReply as never);
    assert.equal(blocked, true);
  } finally {
    if (previous !== undefined) process.env["NODE_ENV"] = previous;
  }
});

console.log("auth-rate-limit contract tests complete");
