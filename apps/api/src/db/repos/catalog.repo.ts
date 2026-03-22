import {
  type IntentContract,
  type Integration as SharedIntegration,
  billingPlans,
  demoIntentContracts,
  demoIntegrations
} from "@covenant/shared";
import { tenantPrisma } from "../tenant-guard";

/**
 * Contracts / Integrations / Billing repos. All reads are tenant-guarded.
 * Empty DB falls back to the bundled demo arrays so the dashboard renders
 * before seeding.
 */

export async function listContracts(): Promise<IntentContract[]> {
  const rows = await tenantPrisma.intentContract.findMany({ orderBy: { createdAt: "desc" } });
  if (rows.length === 0) return demoIntentContracts;
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    plainEnglish: c.plainEnglish,
    owner: c.owner,
    status: c.status,
    lastCheckedAt: (c.lastCheckedAt ?? c.updatedAt).toISOString(),
    linkedFindings: c.linkedFindings
  }));
}

export async function listIntegrations(): Promise<SharedIntegration[]> {
  const rows = await tenantPrisma.integration.findMany({ orderBy: { createdAt: "desc" } });
  if (rows.length === 0) return demoIntegrations;
  return rows.map((i) => ({
    id: i.id,
    name: i.provider,
    description: `${i.provider} integration`,
    status: i.status,
    lastSync: (i.lastSyncAt ?? i.updatedAt).toISOString()
  }));
}

export async function getBilling(): Promise<{
  currentPlan: string;
  plans: typeof billingPlans;
  usage: { repositories: number; scansThisMonth: number; seats: number };
}> {
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [sub, repos, scansThisMonth, seats] = await Promise.all([
    tenantPrisma.subscription.findFirst({ orderBy: { createdAt: "desc" } }),
    tenantPrisma.repository.count(),
    tenantPrisma.scan.count({ where: { startedAt: { gte: since } } }),
    tenantPrisma.membership.count()
  ]);

  return {
    currentPlan: sub?.plan ?? "Startup",
    plans: billingPlans,
    usage: { repositories: repos, scansThisMonth, seats: seats || 4 }
  };
}
