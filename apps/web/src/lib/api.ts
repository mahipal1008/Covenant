import {
  billingPlans,
  createDemoDashboard,
  demoIntegrations,
  demoIntentContracts,
  demoScan,
  type BillingPlan,
  type DashboardSummary,
  type Integration,
  type IntentContract,
  type Repository,
  type Scan
} from "@covenant/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";
const headers = {
  "x-organization-id": "org_covenant_demo"
};

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers,
      next: { revalidate: 0 }
    });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function getDashboard(): Promise<DashboardSummary> {
  return getJson("/v1/dashboard", createDemoDashboard());
}

export async function getRepositories(): Promise<Repository[]> {
  const dashboard = await getDashboard();
  return dashboard.repositories;
}

export function getScan(scanId: string): Promise<Scan> {
  const fallback = scanId === "latest" || scanId === demoScan.id ? demoScan : demoScan;
  return getJson(`/v1/scans/${scanId === "latest" ? demoScan.id : scanId}`, fallback);
}

export function getLatestScan(): Promise<Scan> {
  return getJson("/v1/scans/latest", demoScan);
}

export function getContracts(): Promise<IntentContract[]> {
  return getJson("/v1/contracts", demoIntentContracts);
}

export async function getIntegrations(): Promise<Integration[]> {
  const response = await getJson<{ adapters: Integration[]; configured: Integration[] }>("/v1/integrations", {
    adapters: demoIntegrations,
    configured: demoIntegrations
  });
  return response.configured;
}

export function getBilling(): Promise<{
  currentPlan: string;
  plans: BillingPlan[];
  usage: { repositories: number; scansThisMonth: number; seats: number };
}> {
  return getJson("/v1/billing", {
    currentPlan: "Startup",
    plans: billingPlans,
    usage: { repositories: 2, scansThisMonth: 42, seats: 4 }
  });
}

export type ApiToken = {
  id: string;
  name: string;
  scope: "read" | "write" | "admin";
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  createdBy: string;
};
export function getTokens() {
  return getJson<{ items: ApiToken[] }>("/v1/tokens", { items: [] });
}

export type WebhookSub = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secretPrefix: string;
  createdAt: string;
};
export function getWebhookSubs() {
  return getJson<{ items: WebhookSub[]; events: string[] }>("/v1/webhooks/subscriptions", { items: [], events: [] });
}
export function getWebhookDeliveries() {
  return getJson<{ items: { id: string; subscriptionId: string; event: string; status: string; responseCode: number; attemptedAt: string }[] }>("/v1/webhooks/deliveries", { items: [] });
}

export function getAuditLog(query?: { q?: string; action?: string }) {
  const search = new URLSearchParams();
  if (query?.q) search.set("q", query.q);
  if (query?.action) search.set("action", query.action);
  const path = `/v1/audit${search.toString() ? `?${search.toString()}` : ""}`;
  return getJson<{ items: { id: string; actor: string; action: string; resource: string; ipAddress: string; userAgent: string; at: string }[]; total: number }>(path, { items: [], total: 0 });
}

export function getNotificationPreferences() {
  return getJson<{ events: string[]; prefs: Record<string, Record<string, boolean>> }>("/v1/notifications/preferences", { events: [], prefs: {} });
}

export function getDataExports() {
  return getJson<{ items: { id: string; status: string; requestedAt: string; readyAt: string | null; bytes: number | null }[] }>("/v1/data-export", { items: [] });
}

export function getBillingUsage() {
  return getJson<{
    usage: { scansPerMonth: number; repos: number; contracts: number };
    limits: { scansPerMonth: number; repos: number; contracts: number };
    utilization: { scans: number; repos: number; contracts: number };
    trial: { active: boolean; daysLeft: number; plan: string };
  }>("/v1/billing/usage", {
    usage: { scansPerMonth: 0, repos: 0, contracts: 0 },
    limits: { scansPerMonth: 5000, repos: 25, contracts: 200 },
    utilization: { scans: 0, repos: 0, contracts: 0 },
    trial: { active: false, daysLeft: 0, plan: "Startup" }
  });
}

export function getInvoices() {
  return getJson<{ items: { id: string; number: string; period: string; amount: number; currency: string; status: string; issuedAt: string; pdfUrl: string }[] }>("/v1/billing/invoices", { items: [] });
}

export { API_URL };
