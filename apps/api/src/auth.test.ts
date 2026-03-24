import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./auth/password";
import {
  generateRefreshToken,
  hashRefreshToken,
  issueAccessToken,
  verifyAccessToken,
  getPublicJwks
} from "./auth/jwt";

/**
 * Auth primitives contract tests — master plan §4.2. These exercise the
 * password and JWT helpers without booting Fastify or hitting Postgres,
 * so they run on a clean dev box.
 */

test("argon2id roundtrip: hash + verify pass; wrong password fails", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  assert.equal(await verifyPassword("wrong-password-attempt", hash), false);
});

test("hashPassword rejects passwords shorter than 12 chars", async () => {
  await assert.rejects(() => hashPassword("short"), /at least 12/);
});

test("RS256 access token roundtrip", async () => {
  const token = await issueAccessToken({
    sub: "user_1",
    email: "owner@example.com",
    organizationId: "org_1",
    role: "owner"
  });
  assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  const claims = await verifyAccessToken(token);
  assert.equal(claims.sub, "user_1");
  assert.equal(claims.email, "owner@example.com");
  assert.equal(claims.organizationId, "org_1");
  assert.equal(claims.role, "owner");
});

test("verifyAccessToken rejects tampered tokens", async () => {
  const token = await issueAccessToken({
    sub: "user_1",
    email: "u@x.com",
    organizationId: "org_1",
    role: "owner"
  });
  // Flip a character in the payload segment.
  const parts = token.split(".");
  parts[1] = parts[1]?.slice(0, -1) + (parts[1]?.endsWith("a") ? "b" : "a");
  await assert.rejects(() => verifyAccessToken(parts.join(".")));
});

test("refresh token: random + sha256 hash matches lookup", () => {
  const a = generateRefreshToken();
  const b = generateRefreshToken();
  assert.notEqual(a.token, b.token);
  assert.equal(a.hash.length, 64); // sha256 hex
  assert.equal(hashRefreshToken(a.token), a.hash);
  assert.ok(a.expiresAt.getTime() > Date.now() + 29 * 24 * 60 * 60 * 1000);
});

test("JWKS endpoint exposes a single RS256 public key with kid", async () => {
  const jwks = await getPublicJwks();
  assert.equal(jwks.keys.length, 1);
  const k = jwks.keys[0]!;
  assert.equal(k.alg, "RS256");
  assert.equal(k.kty, "RSA");
  assert.equal(k.use, "sig");
  assert.ok(k.kid && k.kid.length === 16);
});

console.log("auth primitives contract tests complete");
