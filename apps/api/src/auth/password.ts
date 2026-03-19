import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id password hashing — master plan §4.2.
 *
 * Parameters target the OWASP 2024 minimum (memoryCost=19MiB, timeCost=2,
 * parallelism=1) which keeps ~50ms p95 on a single vCPU box without
 * burning the API event loop.
 */

const ARGON2_OPTS = {
  // @node-rs/argon2 expects values in their native units.
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1
} as const;

export async function hashPassword(plaintext: string): Promise<string> {
  if (plaintext.length < 12) {
    throw new Error("password must be at least 12 characters");
  }
  return hash(plaintext, ARGON2_OPTS);
}

export async function verifyPassword(plaintext: string, hashValue: string): Promise<boolean> {
  try {
    return await verify(hashValue, plaintext);
  } catch {
    return false;
  }
}
