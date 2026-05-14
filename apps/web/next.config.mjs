import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production-readiness review §H3-web: ship sensible security headers on every
// response. CSP intentionally omits a nonce because the marketing pages still
// rely on a few small inline scripts (JSON-LD, analytics bootstrap); switch to
// nonce-based CSP once those are extracted.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()"
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://plausible.io https://*.posthog.com",
      "connect-src 'self' https://plausible.io https://*.posthog.com https://*.sentry.io",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join("; ")
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@covenant/shared"],
  typedRoutes: false,
  // Session 6 §8 — prefer modern formats; next/image will negotiate
  // by Accept header so older clients still get JPEG/PNG.
  images: {
    formats: ["image/avif", "image/webp"]
  },
  turbopack: {
    root: path.resolve(__dirname, "../..")
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
