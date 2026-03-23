import type { Scan as SharedScan, Finding as SharedFinding } from "@covenant/shared";
import { tenantPrisma } from "../tenant-guard";

function mapFinding(f: {
  id: string;
  scanId: string;
  repositoryId: string;
  severity: SharedFinding["severity"];
  title: string;
  summary: string;
  filePath: string;
  line: number;
  endpoint: string;
  routeMethod: string;
  ruleId: string;
  evidence: string;
  impact: string;
  suggestedFix: string;
  exploitSteps: unknown;
  status: SharedFinding["status"];
}): SharedFinding {
  return {
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
  };
}

function mapScan(s: {
  id: string;
  organizationId: string;
  repositoryId: string;
  status: SharedScan["status"];
  startedAt: Date;
  completedAt: Date | null;
  commitSha: string | null;
  branch: string;
  riskScore: number;
  filesAnalyzed: number;
  endpointsAnalyzed: number;
  queriesAnalyzed: number;
  repository: { name: string };
  findings: Parameters<typeof mapFinding>[0][];
}): SharedScan {
  return {
    id: s.id,
    organizationId: s.organizationId,
    repositoryId: s.repositoryId,
    repositoryName: s.repository.name,
    status: s.status,
    startedAt: s.startedAt.toISOString(),
    completedAt: (s.completedAt ?? s.startedAt).toISOString(),
    commitSha: s.commitSha ?? "",
    branch: s.branch,
    riskScore: s.riskScore,
    filesAnalyzed: s.filesAnalyzed,
    endpointsAnalyzed: s.endpointsAnalyzed,
    queriesAnalyzed: s.queriesAnalyzed,
    findings: s.findings.map(mapFinding)
  };
}

export async function getLatestScan(): Promise<SharedScan | null> {
  const s = await tenantPrisma.scan.findFirst({
    orderBy: { startedAt: "desc" },
    include: { findings: true, repository: { select: { name: true } } }
  });
  return s ? mapScan(s) : null;
}

export async function getScanById(scanId: string): Promise<SharedScan | null> {
  const s = await tenantPrisma.scan.findUnique({
    where: { id: scanId },
    include: { findings: true, repository: { select: { name: true } } }
  });
  return s ? mapScan(s) : null;
}

export async function listOpenFindings(): Promise<SharedFinding[]> {
  const rows = await tenantPrisma.finding.findMany({
    where: { status: "open" },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 200
  });
  return rows.map(mapFinding);
}
