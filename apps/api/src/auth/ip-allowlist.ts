/**
 * IP allowlist middleware — Session 4 §3.
 *
 * Reads `OrgSettings.ipAllowlist` (CIDR list) for the current request's
 * tenant context. Empty list ⇒ allow-all (default). Any non-empty list
 * is enforced: requests whose remote address doesn't fall inside one
 * of the configured CIDRs receive 403.
 *
 * IPv4 only for now — IPv6 normalization adds noise without value
 * before any customer ever asks for it.
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import { getSettings } from "../services/org-settings";

export async function enforceIpAllowlist(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const ctx = request.covenant;
  if (!ctx?.organizationId) return;
  const cidrs = getSettings(ctx.organizationId).ipAllowlist;
  if (cidrs.length === 0) return;
  const ip = request.ip;
  if (!ip) return reply.forbidden("ip-allowlist: no remote address");
  for (const cidr of cidrs) {
    if (matchCidr(ip, cidr)) return;
  }
  return reply.forbidden("ip-allowlist: address not permitted");
}

export function matchCidr(ip: string, cidr: string): boolean {
  const [base, maskRaw] = cidr.split("/");
  if (!base) return false;
  const mask = maskRaw ? Number(maskRaw) : 32;
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null) return false;
  if (mask === 0) return true;
  const maskBits = (~0 << (32 - mask)) >>> 0;
  return (ipInt & maskBits) === (baseInt & maskBits);
}

function ipv4ToInt(ip: string): number | null {
  // Strip IPv4-mapped IPv6 prefix (::ffff:1.2.3.4) so localhost-over-v6
  // resolves to the right v4 representation.
  const cleaned = ip.replace(/^::ffff:/i, "");
  const parts = cleaned.split(".");
  if (parts.length !== 4) return null;
  let acc = 0;
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    acc = (acc * 256 + n) >>> 0;
  }
  return acc;
}
