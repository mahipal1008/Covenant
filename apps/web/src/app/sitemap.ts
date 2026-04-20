import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://covenant.dev";

const routes = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/agents", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/platform", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/intelligence", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/docs", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/docs/api", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/security", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/compliance", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/changelog", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/login", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/signup", priority: 0.7, changeFrequency: "yearly" as const },
  { path: "/trust", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/dpa", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/subprocessors", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/cookies", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/onboarding", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/help", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/help/connect-repository", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/help/read-scan-report", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/help/write-intent-contract", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/help/manage-seats", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/help/configure-webhooks", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/help/manage-billing", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/help/request-soc2-report", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/help/troubleshoot-stuck-scan", priority: 0.4, changeFrequency: "monthly" as const }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority
  }));
}
