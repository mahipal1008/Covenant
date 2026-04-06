import {
  AnalyzerRunner,
  buildDefaultAgents,
  demoSourceFiles,
  scanSourceFiles,
  type SourceFileInput
} from "@covenant/analyzer";
import { calculateIsolationScore, type Finding, type Repository, type Scan } from "@covenant/shared";
import { tenantPrisma } from "../db/tenant-guard";

type RunScanArgs = {
  organizationId: string;
  repository: Repository;
};

export function runTenantLeakScan({ organizationId, repository }: RunScanArgs): Scan {
  const startedAt = new Date();
  const result = scanSourceFiles(demoSourceFiles);
  const scanId = `scan_${repository.id}_${startedAt.getTime()}`;

  const findings: Finding[] = result.findings.map((finding) => ({
    id: finding.id,
    scanId,
    repositoryId: repository.id,
    severity: finding.severity,
    title: finding.title,
    summary: finding.summary,
    filePath: finding.filePath,
    line: finding.line,
    endpoint: finding.endpoint,
    routeMethod: finding.routeMethod,
    ruleId: finding.ruleId,
    evidence: finding.evidence,
    impact: finding.impact,
    suggestedFix: finding.suggestedFix,
    exploitSteps: finding.exploitSteps,
    status: "open"
  }));

  const riskScore = calculateIsolationScore(findings);
  return {
    id: scanId,
    organizationId,
    repositoryId: repository.id,
    repositoryName: repository.name,
    status: findings.some((finding) => finding.severity === "critical" || finding.severity === "high")
      ? "blocked"
      : "passed",
    startedAt: startedAt.toISOString(),
    completedAt: new Date(startedAt.getTime() + 128000).toISOString(),
    commitSha: repository.lastCommitSha,
    branch: repository.defaultBranch,
    riskScore,
    filesAnalyzed: result.filesAnalyzed,
    endpointsAnalyzed: result.endpointsAnalyzed,
    queriesAnalyzed: result.queriesAnalyzed,
    findings
  };
}

/**
 * Real scan path — runs the AnalyzerRunner pipeline (A1, A7, A9, A10, A20)
 * against the supplied source files, persists Scan + Finding rows via the
 * tenant-guarded Prisma client, and returns the persisted Scan summary.
 *
 * Caller MUST be inside `runWithTenant({organizationId,...})`.
 */
export async function runAndPersistScan(args: {
  repositoryId: string;
  sourceFiles?: SourceFileInput[];
  branch?: string;
  commitSha?: string | null;
}): Promise<{
  scanId: string;
  status: "passed" | "blocked";
  riskScore: number;
  findingsCount: number;
  durationMs: number;
}> {
  const sourceFiles = args.sourceFiles ?? demoSourceFiles;

  // 1. Create Scan row in `running` state.
  const scan = await tenantPrisma.scan.create({
    data: {
      organizationId: "(injected)",
      repositoryId: args.repositoryId,
      status: "running",
      branch: args.branch ?? "main",
      commitSha: args.commitSha ?? null,
      startedAt: new Date()
    }
  });

  // 2. Build + execute the agent pipeline.
  const runner = new AnalyzerRunner(await buildDefaultAgents());
  const repo = await tenantPrisma.repository.findUniqueOrThrow({ where: { id: args.repositoryId } });
  const result = await runner.run({
    organizationId: repo.organizationId,
    repositoryId: args.repositoryId,
    scanId: scan.id,
    sourceFiles
  });

  // 3. Persist findings.
  if (result.findings.length > 0) {
    await tenantPrisma.finding.createMany({
      data: result.findings.map((f) => ({
        organizationId: "(injected)",
        repositoryId: args.repositoryId,
        scanId: scan.id,
        severity: f.severity,
        status: "open",
        ruleId: f.ruleId,
        title: f.title,
        summary: f.summary,
        filePath: f.filePath,
        line: f.line,
        endpoint: f.endpoint,
        routeMethod: f.routeMethod,
        evidence: f.evidence,
        impact: f.impact,
        suggestedFix: f.suggestedFix,
        exploitSteps: f.exploitSteps as unknown as object
      }))
    });
  }

  // 4. Compute decision (A20 emitted findings; we use severity tally).
  const hasCritical = result.findings.some((f) => f.severity === "critical");
  const hasHigh = result.findings.some((f) => f.severity === "high");
  const status: "passed" | "blocked" = hasCritical || hasHigh ? "blocked" : "passed";
  const riskScore = calculateIsolationScore(
    result.findings.map((f) => ({ severity: f.severity, status: "open" }))
  );

  // 5. Finalize Scan row.
  await tenantPrisma.scan.update({
    where: { id: scan.id },
    data: {
      status,
      riskScore,
      filesAnalyzed: sourceFiles.length,
      completedAt: new Date()
    }
  });

  // 6. Update Repository summary.
  await tenantPrisma.repository.update({
    where: { id: args.repositoryId },
    data: {
      scanStatus: status,
      lastScannedAt: new Date(),
      riskScore
    }
  });

  return {
    scanId: scan.id,
    status,
    riskScore,
    findingsCount: result.findings.length,
    durationMs: result.durationMs
  };
}
