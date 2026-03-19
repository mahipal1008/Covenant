import { generateKeyPair, exportJWK, importJWK, SignJWT, jwtVerify, type JWK } from "jose";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";

/**
 * JWT (RS256) + opaque refresh token issuance — master plan §4.2.
 *
 * Access tokens: RS256 signed JWT, 15-minute lifetime, audience "covenant-api".
 * Refresh tokens: 32-byte opaque random, sha256-hashed before storage in
 * Session.refreshTokenHash so a DB leak doesn't yield usable tokens.
 *
 * Keys: in development we generate an ephemeral RSA-2048 keypair on first
 * use. In production, COVENANT_JWT_PRIVATE_KEY_JWK + COVENANT_JWT_PUBLIC_KEY_JWK
 * env vars override (operator-managed rotation). The public JWK is served
 * at /.well-known/jwks.json so downstream services can verify tokens.
 */

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_DAYS = 30;
const ISSUER = "covenant";
const AUDIENCE = "covenant-api";

type KeyMaterial = {
  privateJwk: JWK;
  publicJwk: JWK & { kid: string };
  privateKey: CryptoKey;
  publicKey: CryptoKey;
};

let cached: KeyMaterial | null = null;

async function loadKeys(): Promise<KeyMaterial> {
  if (cached) return cached;

  const envPriv = process.env.COVENANT_JWT_PRIVATE_KEY_JWK;
  const envPub = process.env.COVENANT_JWT_PUBLIC_KEY_JWK;

  if (envPriv && envPub) {
    const privateJwk = JSON.parse(envPriv) as JWK;
    const publicJwk = JSON.parse(envPub) as JWK & { kid: string };
    const privateKey = (await importJWK(privateJwk, "RS256")) as CryptoKey;
    const publicKey = (await importJWK(publicJwk, "RS256")) as CryptoKey;
    cached = { privateJwk, publicJwk, privateKey, publicKey };
    return cached;
  }

  // Dev-mode ephemeral keypair. Tokens issued here will not survive an
  // API restart — exactly what you want for local dev and tests.
  const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
  const privateJwk = await exportJWK(privateKey);
  const publicJwkBase = await exportJWK(publicKey);
  const kid = createHash("sha256")
    .update(JSON.stringify(publicJwkBase))
    .digest("hex")
    .slice(0, 16);
  privateJwk.kid = kid;
  privateJwk.alg = "RS256";
  privateJwk.use = "sig";
  const publicJwk = { ...publicJwkBase, kid, alg: "RS256", use: "sig" } as JWK & { kid: string };
  cached = { privateJwk, publicJwk, privateKey, publicKey };
  return cached;
}

export async function getPublicJwks(): Promise<{ keys: JWK[] }> {
  const { publicJwk } = await loadKeys();
  return { keys: [publicJwk] };
}

export type AccessClaims = {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
};

export async function issueAccessToken(claims: AccessClaims): Promise<string> {
  const { privateKey, publicJwk } = await loadKeys();
  return new SignJWT({
    email: claims.email,
    organizationId: claims.organizationId,
    role: claims.role
  })
    .setProtectedHeader({ alg: "RS256", kid: publicJwk.kid })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(privateKey);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { publicKey } = await loadKeys();
  const { payload } = await jwtVerify(token, publicKey, { issuer: ISSUER, audience: AUDIENCE });
  // Strict claim shape — without this, a token missing `organizationId`
  // would yield the literal string "undefined" via `String(undefined)`,
  // which the tenant guard could mistake for a real org id.
  const claimsSchema = z.object({
    sub: z.string().min(1),
    email: z.string().email(),
    organizationId: z.string().min(1),
    role: z.string().min(1)
  });
  const parsed = claimsSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`invalid access token claims: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, hash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const authConfig = {
  accessTtlSeconds: ACCESS_TTL_SECONDS,
  refreshTtlDays: REFRESH_TTL_DAYS,
  issuer: ISSUER,
  audience: AUDIENCE
};
