import type { FastifyInstance } from "fastify";
import { prisma } from "@covenant/db";
import { tenantPrisma } from "../db/tenant-guard";

const limitsByPlan: Record<string, { scansPerMonth: number; repos: number; contracts: number }> = {
  Indie: { scansPerMonth: 500, repos: 5, contracts: 25 },
  Startup: { scansPerMonth: 5000, repos: 25, contracts: 200 },
  Scale: { scansPerMonth: 25000, repos: 100, contracts: 1000 },
  Enterprise: { scansPerMonth: 100000, repos: 500, contracts: 5000 }
};

export async function billingDepthRoutes(app: FastifyInstance) {
  app.get("/billing/usage", async (request) => {
    // Organization itself is NOT in the tenant-scoped set (it IS the tenant),
    // so we read it via the base client.
    const orgId = request.covenant.organizationId;
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const plan = org?.plan ?? "Startup";
    const limits = limitsByPlan[plan] ?? limitsByPlan.Startup!;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [scansAgg, reposAgg, contractsAgg, sub] = await Promise.all([
      tenantPrisma.usageRecord.aggregate({
        _sum: { quantity: true },
        where: { metric: "scan", recordedAt: { gte: monthStart } }
      }),
      tenantPrisma.usageRecord.aggregate({
        _sum: { quantity: true },
        where: { metric: "repository" }
      }),
      tenantPrisma.usageRecord.aggregate({
        _sum: { quantity: true },
        where: { metric: "contract" }
      }),
      tenantPrisma.subscription.findFirst({ orderBy: { createdAt: "desc" } })
    ]);

    const usage = {
      scansPerMonth: scansAgg._sum.quantity ?? 0,
      repos: reposAgg._sum.quantity ?? 0,
      contracts: contractsAgg._sum.quantity ?? 0
    };

    const trial = sub?.currentPeriodEnd
      ? {
          active: sub.currentPeriodEnd.getTime() > Date.now(),
          daysLeft: Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / 86400000)),
          plan
        }
      : { active: false, daysLeft: 0, plan };

    return {
      plan,
      usage,
      limits,
      utilization: {
        scans: Math.round((usage.scansPerMonth / limits.scansPerMonth) * 100),
        repos: Math.round((usage.repos / limits.repos) * 100),
        contracts: Math.round((usage.contracts / limits.contracts) * 100)
      },
      trial
    };
  });

  app.get("/billing/invoices", async () => {
    const invoices = await tenantPrisma.invoice.findMany({
      orderBy: { issuedAt: "desc" },
      take: 24
    });
    return {
      items: invoices.map((i) => ({
        id: i.id,
        number: i.number,
        period: i.periodStart.toLocaleString("en-US", { month: "short", year: "numeric" }),
        amount: i.amountCents,
        currency: i.currency,
        status: i.status,
        issuedAt: i.issuedAt.toISOString(),
        paidAt: i.paidAt ? i.paidAt.toISOString() : null,
        pdfUrl: i.pdfUrl ?? "#"
      }))
    };
  });
}
