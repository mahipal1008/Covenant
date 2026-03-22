import {
  calculateIsolationScore,
  createDemoDashboard,
  type DashboardSummary,
  type Repository as SharedRepository,
  type Scan as SharedScan,
  type Finding as SharedFinding
} from "@covenant/shared";
import { tenantPrisma, currentTenant } from "../tenant-guard";

/**
 * Dashboard repo — assembles the DashboardSummary shape from Prisma. Falls
 * back to demo-shaped sections (agentActivity, riskTrend) until those
 * surfaces have their own tables. All reads are tenant-guarded.
 */

function normalizeProvider(value: string): SharedRepository["provider"] {
  if (value === "github" || value === "gitlab" || value === "upload") return value;
  return "github";
}

export async function getDashboard(): Promise<DashboardSummary> {
  const tenant = currentTenant();
  // Pull org metadata for the header card.
  const org = await tenantPrisma.organization.findUniqueOrThrow({
    where: { id: tenant.organizationId }
  });

  // Reads in parallel: repositories, latest scan + its findings, open findings, scan count.
  const [repos, latestScan, openFindings, scansThisWeek] = await Promise.all([
    tenantPrisma.repository.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { findings: { where: { status: "open" } } } } }
    }),
    tenantPrisma.scan.findFirst({
      orderBy: { startedAt: "desc" },
      include: { findings: true, repository: { select: { name: true } } }
    }),
    tenantPrisma.finding.findMany({ where: { status: "open" }, select: { severity: true, status: true } }),
    tenantPrisma.scan.count({
      where: { startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    })
  ]);

  const demo = createDemoDashboard();

  // If there's nothing in the DB yet, fall back to the demo shape (with the
  // real org from Prisma so the header reflects the tenant).
  if (!latestScan || repos.length === 0) {
    return {
      ...demo,
      organization: { id: org.id, name: org.name, plan: org.plan }
    };
  }

  const sharedRepos: SharedRepository[] = repos.map((r) => ({
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    provider: normalizeProvider(r.provider),
    defaultBranch: r.defaultBranch,
    language: r.language,
    lastCommitSha: r.lastCommitSha ?? "",
    lastScannedAt: r.lastScannedAt ? r.lastScannedAt.toISOString() : "",
    scanStatus: r.scanStatus,
    openFindings: r._count.findings,
    riskScore: r.riskScore
  }));

  const sharedScan: SharedScan = {
    id: latestScan.id,
    organizationId: latestScan.organizationId,
    repositoryId: latestScan.repositoryId,
    repositoryName: latestScan.repository.name,
    status: latestScan.status,
    startedAt: latestScan.startedAt.toISOString(),
    completedAt: (latestScan.completedAt ?? latestScan.startedAt).toISOString(),
    commitSha: latestScan.commitSha ?? "",
    branch: latestScan.branch,
    riskScore: latestScan.riskScore,
    filesAnalyzed: latestScan.filesAnalyzed,
    endpointsAnalyzed: latestScan.endpointsAnalyzed,
    queriesAnalyzed: latestScan.queriesAnalyzed,
    findings: latestScan.findings.map<SharedFinding>((f) => ({
      id: f.id,
      scanId: f.scanId,
      repositoryId: f.repositoryId,
      severity: f.severity,
      title: f.title,
      summary: f.summary,
      filePath: f.filePath,
      line: f.line,
      endpoint: f.endpoint,
      routeMethod: f.routeMethod,
      ruleId: f.ruleId,
      evidence: f.evidence,
      impact: f.impact,
      suggestedFix: f.suggestedFix,
      exploitSteps: Array.isArray(f.exploitSteps) ? (f.exploitSteps as string[]) : [],
      status: f.status
    }))
  };

  return {
    organization: { id: org.id, name: org.name, plan: org.plan },
    metrics: {
      isolationScore: calculateIsolationScore(openFindings),
      openFindings: openFindings.length,
      protectedEndpoints: demo.metrics.protectedEndpoints,
      revenueAtRisk: demo.metrics.revenueAtRisk,
      scansThisWeek
    },
    deltas: demo.deltas,
    latestScan: sharedScan,
    repositories: sharedRepos,
    agentActivity: demo.agentActivity,
    riskTrend: demo.riskTrend
  };
}
