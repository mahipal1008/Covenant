import type { FastifyPluginAsync } from "fastify";
import {
  demoAgents,
  demoAuthAudit,
  demoBehavioralRegressions,
  demoBlastRadius,
  demoCapabilityTrends,
  demoChangelog,
  demoDecisionLog,
  demoDependencyAlerts,
  demoOnboardingTour,
  demoPrContextBriefs,
  demoRegulations,
  demoServiceContracts,
  demoTeam,
  demoTechDebtItems
} from "@covenant/shared";
import { demoStore } from "../services/demo-store";

export const intelligenceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/agents", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        agents: demoAgents,
        counts: {
          live: demoAgents.filter((a) => a.status === "live").length,
          beta: demoAgents.filter((a) => a.status === "beta").length,
          planned: demoAgents.filter((a) => a.status === "planned").length
        }
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/auth-audit", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        entries: demoAuthAudit,
        coverage: {
          protected: demoAuthAudit.filter((a) => a.authStatus === "protected").length,
          admin: demoAuthAudit.filter((a) => a.authStatus === "admin-only").length,
          unprotected: demoAuthAudit.filter((a) => a.authStatus === "unprotected").length
        }
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/blast-radius", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      const totalHourly = demoBlastRadius.reduce((s, e) => s + e.hourlyRevenueAtRisk, 0);
      const totalMonthly = demoBlastRadius.reduce((s, e) => s + e.monthlyAtRisk, 0);
      return { entries: demoBlastRadius, totals: { hourly: totalHourly, monthly: totalMonthly } };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/dependencies", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        alerts: demoDependencyAlerts,
        counts: {
          critical: demoDependencyAlerts.filter((a) => a.severity === "critical").length,
          high: demoDependencyAlerts.filter((a) => a.severity === "high").length,
          medium: demoDependencyAlerts.filter((a) => a.severity === "medium").length,
          low: demoDependencyAlerts.filter((a) => a.severity === "low").length
        }
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/changelog", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return { entries: demoChangelog };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/team", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        members: demoTeam,
        atRisk: demoTeam.filter((m) => m.busFactorRisk === "critical" || m.busFactorRisk === "high").length
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/regulations", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        entries: demoRegulations,
        nextEnforcementDays: Math.min(...demoRegulations.filter((r) => r.daysUntil > 0).map((r) => r.daysUntil))
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/decision-log", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        entries: demoDecisionLog,
        counts: {
          critical: demoDecisionLog.filter((d) => d.riskIfRemoved === "critical").length,
          high: demoDecisionLog.filter((d) => d.riskIfRemoved === "high").length
        }
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/service-contracts", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        contracts: demoServiceContracts,
        counts: {
          verified: demoServiceContracts.filter((c) => c.status === "verified").length,
          implicit: demoServiceContracts.filter((c) => c.status === "implicit").length,
          violated: demoServiceContracts.filter((c) => c.status === "violated").length
        }
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/capability-trends", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        trends: demoCapabilityTrends,
        regressing: demoCapabilityTrends.filter((t) => t.direction === "regressing").length
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/behavioral-regressions", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        regressions: demoBehavioralRegressions,
        openCount: demoBehavioralRegressions.length
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/tech-debt", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      const totalCost = demoTechDebtItems.reduce((s, i) => s + i.costHours, 0);
      const totalSavings = demoTechDebtItems.reduce((s, i) => s + i.savingsHoursPerQuarter, 0);
      return {
        items: demoTechDebtItems,
        totals: { costHours: totalCost, savingsHoursPerQuarter: totalSavings, roi: Number((totalSavings / totalCost).toFixed(2)) }
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/onboarding-tour", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return demoOnboardingTour;
    } catch {
      return reply.notFound("Organization not found");
    }
  });

  app.get("/pr-context", async (request, reply) => {
    try {
      demoStore.assertOrganization(request.covenant.organizationId);
      return {
        briefs: demoPrContextBriefs,
        highRiskCount: demoPrContextBriefs.filter((b) => b.riskTag === "high" || b.riskTag === "critical").length
      };
    } catch {
      return reply.notFound("Organization not found");
    }
  });
};
