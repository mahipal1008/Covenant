/**
 * security.txt — RFC 9116. Served at /.well-known/security.txt by Next.js
 * via the matching folder route. Pure static text; no PII.
 */

export const dynamic = "force-static";

export function GET() {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  const body = [
    "Contact: mailto:security@covenant.dev",
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
    "Canonical: https://covenant.dev/.well-known/security.txt",
    "Policy: https://covenant.dev/security",
    "Acknowledgments: https://covenant.dev/trust"
  ].join("\n");
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}
