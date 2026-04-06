import {
  billingPlans,
  calculateIsolationScore,
  createDemoDashboard,
  createRepositoryInputSchema,
  demoFindings,
  demoIntegrations,
  demoIntentContracts,
  demoRepositories,
  demoScan,
  type CreateRepositoryInput,
  type Finding,
  type Repository,
  type Scan
} from "@covenant/shared";
import { runTenantLeakScan } from "./scanner-service";

const DEMO_ORG_ID = "org_covenant_demo";

let repositories: Repository[] = [...demoRepositories];
let scans: Scan[] = [demoScan];
let findings: Finding[] = [...demoFindings];

export const demoStore = {
  organizationId: DEMO_ORG_ID,

  dashboard(organizationId: string) {
    enforceOrganization(organizationId);
    const latestScan = scans[0] ?? demoScan;
    const dashboard = createDemoDashboard();
    return {
      ...dashboard,
      repositories,
      latestScan,
      metrics: {
        ...dashboard.metrics,
        isolationScore: calculateIsolationScore(findings),
        openFindings: findings.filter((finding) => finding.status === "open").length
      }
    };
  },

  repositories(organizationId: string) {
    enforceOrganization(organizationId);
    return repositories;
  },

  createRepository(organizationId: string, input: CreateRepositoryInput) {
    enforceOrganization(organizationId);
    const parsed = createRepositoryInputSchema.parse(input);
    const repository: Repository = {
      id: `repo_${slug(parsed.name)}_${Date.now()}`,
      organizationId,
      name: parsed.name,
      provider: parsed.provider,
      defaultBranch: parsed.defaultBranch,
      language: parsed.language,
      lastCommitSha: "local-demo",
      lastScannedAt: new Date().toISOString(),
      scanStatus: "queued",
      openFindings: 0,
      riskScore: 100
    };

    repositories = [repository, ...repositories];
    return repository;
  },

  latestScan(organizationId: string) {
    enforceOrganization(organizationId);
    return scans[0] ?? demoScan;
  },

  scanById(organizationId: string, scanId: string) {
    enforceOrganization(organizationId);
    return scans.find((scan) => scan.id === scanId) ?? null;
  },

  runScan(organizationId: string, repositoryId: string) {
    enforceOrganization(organizationId);
    const repository = repositories.find((candidate) => candidate.id === repositoryId);
    if (!repository) return null;

    const scan = runTenantLeakScan({ organizationId, repository });
    scans = [scan, ...scans.filter((candidate) => candidate.id !== scan.id)];
    findings = [...scan.findings, ...findings.filter((finding) => finding.scanId !== scan.id)];
    repositories = repositories.map((candidate) =>
      candidate.id === repositoryId
        ? {
            ...candidate,
            scanStatus: scan.status,
            lastScannedAt: scan.completedAt,
            riskScore: scan.riskScore,
            openFindings: scan.findings.filter((finding) => finding.status === "open").length
          }
        : candidate
    );
    return scan;
  },

  contracts(organizationId: string) {
    enforceOrganization(organizationId);
    return demoIntentContracts;
  },

  integrations(organizationId: string) {
    enforceOrganization(organizationId);
    return demoIntegrations;
  },

  billing(organizationId: string) {
    enforceOrganization(organizationId);
    return {
      currentPlan: "Startup",
      plans: billingPlans,
      usage: {
        repositories: repositories.length,
        scansThisMonth: 42,
        seats: 4
      }
    };
  },

  assertOrganization(organizationId: string) {
    enforceOrganization(organizationId);
  }
};

function enforceOrganization(organizationId: string) {
  if (organizationId !== DEMO_ORG_ID) {
    const error = new Error("Organization not found or not accessible");
    error.name = "NotFound";
    throw error;
  }
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
