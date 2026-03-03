import { z } from "zod";

export const severitySchema = z.enum(["critical", "high", "medium", "low"]);
export const scanStatusSchema = z.enum(["queued", "running", "passed", "failed", "blocked"]);
export const integrationStatusSchema = z.enum(["connected", "stubbed", "needs_setup"]);

export type Severity = z.infer<typeof severitySchema>;
export type ScanStatus = z.infer<typeof scanStatusSchema>;
export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;

export const repositorySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  provider: z.enum(["github", "gitlab", "upload"]),
  defaultBranch: z.string(),
  language: z.string(),
  lastCommitSha: z.string(),
  lastScannedAt: z.string(),
  scanStatus: scanStatusSchema,
  openFindings: z.number(),
  riskScore: z.number()
});

export const findingSchema = z.object({
  id: z.string(),
  scanId: z.string(),
  repositoryId: z.string(),
  severity: severitySchema,
  title: z.string(),
  summary: z.string(),
  filePath: z.string(),
  line: z.number(),
  endpoint: z.string(),
  routeMethod: z.string(),
  ruleId: z.string(),
  evidence: z.string(),
  impact: z.string(),
  suggestedFix: z.string(),
  exploitSteps: z.array(z.string()),
  status: z.enum(["open", "triaged", "fixed"])
});

export const scanSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  repositoryId: z.string(),
  repositoryName: z.string(),
  status: scanStatusSchema,
  startedAt: z.string(),
  completedAt: z.string(),
  commitSha: z.string(),
  branch: z.string(),
  riskScore: z.number(),
  filesAnalyzed: z.number(),
  endpointsAnalyzed: z.number(),
  queriesAnalyzed: z.number(),
  findings: z.array(findingSchema)
});

export type Repository = z.infer<typeof repositorySchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Scan = z.infer<typeof scanSchema>;

export type MetricDelta = {
  label: string;
  value: string;
  trend: "up" | "down" | "flat";
};

export type DashboardSummary = {
  organization: {
    id: string;
    name: string;
    plan: string;
  };
  metrics: {
    isolationScore: number;
    openFindings: number;
    protectedEndpoints: number;
    revenueAtRisk: string;
    scansThisWeek: number;
  };
  deltas: MetricDelta[];
  latestScan: Scan;
  repositories: Repository[];
  agentActivity: AgentActivity[];
  riskTrend: RiskTrendPoint[];
};

export type RiskTrendPoint = {
  label: string;
  score: number;
  findings: number;
};

export type AgentActivity = {
  id: string;
  name: string;
  layer: string;
  status: "active" | "watching" | "planned";
  output: string;
  confidence: number;
};

export type IntentContract = {
  id: string;
  name: string;
  plainEnglish: string;
  owner: string;
  status: "passing" | "warning" | "violated";
  lastCheckedAt: string;
  linkedFindings: number;
};

export type Integration = {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  lastSync: string;
};

export type BillingPlan = {
  id: string;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const createRepositoryInputSchema = z.object({
  name: z.string().min(2),
  provider: z.enum(["github", "gitlab", "upload"]).default("github"),
  defaultBranch: z.string().min(1).default("main"),
  language: z.string().min(1).default("TypeScript")
});

export type CreateRepositoryInput = z.infer<typeof createRepositoryInputSchema>;

export const runScanInputSchema = z.object({
  repositoryId: z.string(),
  sourceMode: z.enum(["demo", "uploaded", "provider"]).default("demo")
});

export type RunScanInput = z.infer<typeof runScanInputSchema>;

export const severityWeights: Record<Severity, number> = {
  critical: 100,
  high: 72,
  medium: 38,
  low: 12
};

export function severityRank(severity: Severity): number {
  return severityWeights[severity];
}

export function calculateIsolationScore(findings: Pick<Finding, "severity" | "status">[]): number {
  const openFindings = findings.filter((finding) => finding.status === "open");
  if (openFindings.length === 0) return 100;

  const penalty = openFindings.reduce((total, finding) => total + severityWeights[finding.severity], 0);
  return Math.max(0, Math.round(100 - penalty / 4));
}

export const demoFindings: Finding[] = [
  {
    id: "finding_billing_reports_tenant_filter",
    scanId: "scan_latest",
    repositoryId: "repo_sample_saas",
    severity: "critical",
    title: "Billing report query can return another tenant's invoices",
    summary: "The reports endpoint reads invoice rows without constraining the query to the current tenant boundary.",
    filePath: "src/routes/reports.ts",
    line: 42,
    endpoint: "/api/reports/billing",
    routeMethod: "GET",
    ruleId: "tenant-filter-required",
    evidence: "prisma.invoice.findMany({ where: { status: 'paid' } })",
    impact: "A hostel admin could fetch billing data owned by another hostel if they can guess report filters.",
    suggestedFix: "Add organizationId from the authenticated session to the Prisma where clause and cover it with an API test.",
    exploitSteps: [
      "Sign in as a hostel admin for tenant A.",
      "Call GET /api/reports/billing?status=paid.",
      "Observe paid invoices from tenants that are not tenant A."
    ],
    status: "open"
  },
  {
    id: "finding_admin_export_missing_scope",
    scanId: "scan_latest",
    repositoryId: "repo_sample_saas",
    severity: "high",
    title: "Export endpoint builds CSV before tenant scoping",
    summary: "The export service selects reservation rows before applying organization scoping in application code.",
    filePath: "src/services/exportReservations.ts",
    line: 27,
    endpoint: "/api/admin/export/reservations",
    routeMethod: "POST",
    ruleId: "tenant-scope-before-export",
    evidence: "db.reservation.findMany({ include: { guest: true, payments: true } })",
    impact: "Bulk export paths are high-value because one call can expose many guests, payments, and room allocations.",
    suggestedFix: "Move tenant filtering into the database query and reject exports when session.organizationId is missing.",
    exploitSteps: [
      "Create an admin session for tenant B.",
      "Request a reservation CSV export.",
      "Compare exported reservation IDs against tenant B's known reservations."
    ],
    status: "open"
  },
  {
    id: "finding_customer_lookup_medium",
    scanId: "scan_latest",
    repositoryId: "repo_sample_saas",
    severity: "medium",
    title: "Customer lookup relies on route param without ownership check",
    summary: "The API fetches a customer by id and checks only that the user is authenticated.",
    filePath: "src/routes/customers.ts",
    line: 88,
    endpoint: "/api/customers/:id",
    routeMethod: "GET",
    ruleId: "object-ownership-check",
    evidence: "customer.findUnique({ where: { id: params.id } })",
    impact: "A user with a valid session could probe customer IDs across tenant boundaries.",
    suggestedFix: "Use a compound lookup with id and organizationId, then return 404 for cross-tenant records.",
    exploitSteps: [
      "Sign in as any authenticated user.",
      "Call GET /api/customers/{known-id-from-other-tenant}.",
      "The endpoint returns a customer document instead of a tenant-safe 404."
    ],
    status: "triaged"
  }
];

export const demoScan: Scan = {
  id: "scan_latest",
  organizationId: "org_covenant_demo",
  repositoryId: "repo_sample_saas",
  repositoryName: "sample-saas",
  status: "blocked",
  startedAt: "2026-04-26T01:02:00.000Z",
  completedAt: "2026-04-26T01:04:19.000Z",
  commitSha: "a3f9c2d",
  branch: "main",
  riskScore: 31,
  filesAnalyzed: 286,
  endpointsAnalyzed: 126,
  queriesAnalyzed: 418,
  findings: demoFindings
};

export const demoRepositories: Repository[] = [
  {
    id: "repo_sample_saas",
    organizationId: "org_covenant_demo",
    name: "sample-saas",
    provider: "github",
    defaultBranch: "main",
    language: "TypeScript",
    lastCommitSha: "a3f9c2d",
    lastScannedAt: "2026-04-26T01:04:19.000Z",
    scanStatus: "blocked",
    openFindings: 2,
    riskScore: 31
  },
  {
    id: "repo_billing_worker",
    organizationId: "org_covenant_demo",
    name: "billing-worker",
    provider: "github",
    defaultBranch: "main",
    language: "TypeScript",
    lastCommitSha: "8b14ae7",
    lastScannedAt: "2026-04-25T18:12:55.000Z",
    scanStatus: "passed",
    openFindings: 0,
    riskScore: 94
  }
];

export const demoAgentActivity: AgentActivity[] = [
  {
    id: "agent_architect",
    name: "Architect",
    layer: "Understanding",
    status: "active",
    output: "Mapped 126 routes and 418 query surfaces across the sample repository.",
    confidence: 94
  },
  {
    id: "agent_leak_detector",
    name: "Multi-Tenant Leak Detector",
    layer: "Security",
    status: "active",
    output: "Blocked deploy because 2 high-impact endpoints lack tenant filters.",
    confidence: 91
  },
  {
    id: "agent_intent_drift",
    name: "Intent Drift Monitor",
    layer: "Intent",
    status: "watching",
    output: "Tracking contract: no hostel admin sees another hostel's billing data.",
    confidence: 86
  },
  {
    id: "agent_economics",
    name: "Economic Blast Radius",
    layer: "Economics",
    status: "planned",
    output: "Stripe adapter is stubbed for local development.",
    confidence: 68
  }
];

export const demoRiskTrend: RiskTrendPoint[] = [
  { label: "Mon", score: 78, findings: 5 },
  { label: "Tue", score: 84, findings: 4 },
  { label: "Wed", score: 72, findings: 7 },
  { label: "Thu", score: 63, findings: 9 },
  { label: "Fri", score: 31, findings: 12 }
];

export const demoIntentContracts: IntentContract[] = [
  {
    id: "contract_tenant_billing",
    name: "Tenant billing isolation",
    plainEnglish: "No hostel admin sees another hostel's billing data.",
    owner: "Security",
    status: "violated",
    lastCheckedAt: "2026-04-26T01:04:19.000Z",
    linkedFindings: 1
  },
  {
    id: "contract_free_export",
    name: "Free tier export limit",
    plainEnglish: "Free tier users cannot access export endpoints.",
    owner: "Product",
    status: "warning",
    lastCheckedAt: "2026-04-26T01:04:19.000Z",
    linkedFindings: 1
  },
  {
    id: "contract_support_visibility",
    name: "Support access boundary",
    plainEnglish: "Support agents can only view tenant data after an audited support grant.",
    owner: "Operations",
    status: "passing",
    lastCheckedAt: "2026-04-25T22:11:05.000Z",
    linkedFindings: 0
  }
];

export const demoIntegrations: Integration[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Webhook listener, repository metadata, PR comments, and merge gate checks.",
    status: "stubbed",
    lastSync: "Local adapter ready"
  },
  {
    id: "slack",
    name: "Slack",
    description: "Security digests, blocked deploy alerts, and weekly executive summaries.",
    status: "stubbed",
    lastSync: "Local adapter ready"
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Revenue tagging for economic blast radius and subscription billing.",
    status: "stubbed",
    lastSync: "Local adapter ready"
  },
  {
    id: "ai",
    name: "AI Provider",
    description: "Plain-English reports, remediation hints, and contract drift narration.",
    status: "stubbed",
    lastSync: "Local adapter ready"
  }
];

export const billingPlans: BillingPlan[] = [
  {
    id: "indie",
    name: "Indie",
    priceMonthly: 49,
    description: "Docs, changelog, and basic security scanning.",
    features: ["1 repository", "Weekly scans", "Basic tenant leak checks"]
  },
  {
    id: "startup",
    name: "Startup",
    priceMonthly: 199,
    description: "Intent monitoring, blast radius, and auth audit workflows.",
    features: ["5 repositories", "PR checks", "Slack digests", "Intent contracts"],
    highlighted: true
  },
  {
    id: "scale",
    name: "Scale",
    priceMonthly: 499,
    description: "Compliance mapping, adversarial simulation, and archaeology.",
    features: ["25 repositories", "Exploit reports", "SOC2 evidence", "Decision logs"]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 1499,
    description: "Regulatory scanner, cross-repo intelligence, and team risk.",
    features: ["Unlimited repos", "SSO", "Dedicated support", "Custom controls"]
  }
];

export function createDemoDashboard(): DashboardSummary {
  return {
    organization: {
      id: "org_covenant_demo",
      name: "Covenant Demo",
      plan: "Startup"
    },
    metrics: {
      isolationScore: calculateIsolationScore(demoFindings),
      openFindings: demoFindings.filter((finding) => finding.status === "open").length,
      protectedEndpoints: 117,
      revenueAtRisk: "$4,200/hr",
      scansThisWeek: 18
    },
    deltas: [
      { label: "Critical findings", value: "+1 today", trend: "up" },
      { label: "Protected endpoints", value: "93% covered", trend: "up" },
      { label: "Mean scan time", value: "2m 19s", trend: "down" }
    ],
    latestScan: demoScan,
    repositories: demoRepositories,
    agentActivity: demoAgentActivity,
    riskTrend: demoRiskTrend
  };
}

// ===== Agent surfaces (Layer 2-6) =====

export type AuthAuditEntry = {
  endpoint: string;
  method: string;
  filePath: string;
  line: number;
  authStatus: "protected" | "unprotected" | "admin-only";
  middlewares: string[];
  risk: Severity;
};

export type BlastRadiusEntry = {
  endpoint: string;
  method: string;
  filePath: string;
  revenueTag: string;
  hourlyRevenueAtRisk: number;
  monthlyAtRisk: number;
  dependents: string[];
  severity: Severity;
};

export type DependencyAlert = {
  id: string;
  package: string;
  installedVersion: string;
  fixedVersion: string;
  cveId: string;
  severity: Severity;
  summary: string;
  contextualUsage: { filePath: string; line: number; symbol: string }[];
  publishedAt: string;
};

export type ChangelogEntry = {
  id: string;
  commitSha: string;
  author: string;
  date: string;
  developerSummary: string;
  founderSummary: string;
  auditorSummary: string;
  riskTag: "info" | "low" | "medium" | "high" | "critical";
  affectedAreas: string[];
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  ownershipPercent: number;
  modules: string[];
  busFactorRisk: Severity;
};

export type RegulationEntry = {
  id: string;
  region: string;
  name: string;
  enforcementDate: string;
  daysUntil: number;
  mappedFiles: string[];
  status: "compliant" | "at-risk" | "violating";
  summary: string;
};

export type AgentDefinition = {
  id: string;
  number: number;
  layer: string;
  name: string;
  status: "live" | "beta" | "planned";
  oneLine: string;
  output: string;
};

export const demoAuthAudit: AuthAuditEntry[] = [
  {
    endpoint: "/api/reports/billing",
    method: "GET",
    filePath: "src/routes/reports.ts",
    line: 42,
    authStatus: "protected",
    middlewares: ["requireAuth"],
    risk: "high"
  },
  {
    endpoint: "/api/admin/export/reservations",
    method: "POST",
    filePath: "src/services/exportReservations.ts",
    line: 27,
    authStatus: "admin-only",
    middlewares: ["requireAdmin"],
    risk: "critical"
  },
  {
    endpoint: "/api/customers/:id",
    method: "GET",
    filePath: "src/routes/customers.ts",
    line: 88,
    authStatus: "protected",
    middlewares: ["requireAuth"],
    risk: "medium"
  },
  {
    endpoint: "/api/internal/debug/dump",
    method: "GET",
    filePath: "src/routes/internal.ts",
    line: 14,
    authStatus: "unprotected",
    middlewares: [],
    risk: "critical"
  },
  {
    endpoint: "/api/health",
    method: "GET",
    filePath: "src/routes/health.ts",
    line: 4,
    authStatus: "unprotected",
    middlewares: [],
    risk: "low"
  }
];

export const demoBlastRadius: BlastRadiusEntry[] = [
  {
    endpoint: "/api/payments/charge",
    method: "POST",
    filePath: "src/routes/payments.ts",
    revenueTag: "stripe.charges",
    hourlyRevenueAtRisk: 4200,
    monthlyAtRisk: 3024000,
    dependents: ["checkout-flow", "subscription-renewals", "invoice-generator"],
    severity: "critical"
  },
  {
    endpoint: "/api/reports/billing",
    method: "GET",
    filePath: "src/routes/reports.ts",
    revenueTag: "billing.read",
    hourlyRevenueAtRisk: 0,
    monthlyAtRisk: 0,
    dependents: ["finance-dashboard", "invoice-export"],
    severity: "high"
  },
  {
    endpoint: "/api/admin/export/reservations",
    method: "POST",
    filePath: "src/services/exportReservations.ts",
    revenueTag: "compliance.export",
    hourlyRevenueAtRisk: 0,
    monthlyAtRisk: 0,
    dependents: ["soc2-evidence", "regulator-reports"],
    severity: "high"
  },
  {
    endpoint: "/api/customers/:id",
    method: "GET",
    filePath: "src/routes/customers.ts",
    revenueTag: "tenant.read",
    hourlyRevenueAtRisk: 220,
    monthlyAtRisk: 158400,
    dependents: ["tenant-dashboard", "support-portal"],
    severity: "medium"
  }
];

export const demoDependencyAlerts: DependencyAlert[] = [
  {
    id: "dep_alert_lodash_proto",
    package: "lodash",
    installedVersion: "4.17.20",
    fixedVersion: "4.17.21",
    cveId: "CVE-2021-23337",
    severity: "high",
    summary: "Command injection via lodash.template when user input reaches template strings.",
    contextualUsage: [
      { filePath: "src/services/notifyTemplate.ts", line: 23, symbol: "template" },
      { filePath: "src/jobs/digest.ts", line: 41, symbol: "template" }
    ],
    publishedAt: "2026-04-12T11:30:00.000Z"
  },
  {
    id: "dep_alert_axios_redirect",
    package: "axios",
    installedVersion: "1.6.0",
    fixedVersion: "1.7.4",
    cveId: "CVE-2024-39338",
    severity: "medium",
    summary: "SSRF via insufficient redirect handling when proxying user-supplied URLs.",
    contextualUsage: [{ filePath: "src/integrations/webhook.ts", line: 56, symbol: "axios.get" }],
    publishedAt: "2026-04-04T16:08:00.000Z"
  },
  {
    id: "dep_alert_jose_legacy",
    package: "jose",
    installedVersion: "4.14.0",
    fixedVersion: "5.6.0",
    cveId: "CVE-2024-28176",
    severity: "low",
    summary: "Algorithm confusion in legacy compact JWS parser.",
    contextualUsage: [],
    publishedAt: "2026-03-22T08:01:00.000Z"
  }
];

export const demoChangelog: ChangelogEntry[] = [
  {
    id: "changelog_a3f9c2d",
    commitSha: "a3f9c2d",
    author: "ria.kapoor",
    date: "2026-04-26T01:00:00.000Z",
    developerSummary: "Refactored billing report query to use raw SQL for join performance.",
    founderSummary: "Faster billing reports (3x), but tenant filter was removed - blocked by Covenant.",
    auditorSummary: "Critical: change removed organizationId filter from a paid-invoice query. Deploy gate blocked.",
    riskTag: "critical",
    affectedAreas: ["billing", "reports", "tenant-isolation"]
  },
  {
    id: "changelog_8b14ae7",
    commitSha: "8b14ae7",
    author: "dipan.sen",
    date: "2026-04-25T17:42:00.000Z",
    developerSummary: "Added rate limiting middleware to /api/auth/login.",
    founderSummary: "Login is now resilient to brute-force attempts.",
    auditorSummary: "Adds rate limit (10 req / 60s) to authentication endpoint. SOC2 CC6.6 control evidence updated.",
    riskTag: "low",
    affectedAreas: ["auth", "rate-limiting"]
  },
  {
    id: "changelog_412de01",
    commitSha: "412de01",
    author: "mira.lin",
    date: "2026-04-24T13:18:00.000Z",
    developerSummary: "Bumped Prisma to 6.1 and regenerated client.",
    founderSummary: "Database client upgraded; no behavior changes.",
    auditorSummary: "Routine dependency upgrade. No CVE remediation required.",
    riskTag: "info",
    affectedAreas: ["dependencies", "database"]
  }
];

export const demoTeam: TeamMember[] = [
  {
    id: "user_ria_kapoor",
    name: "Ria Kapoor",
    role: "Staff engineer",
    ownershipPercent: 71,
    modules: ["billing", "tenant-isolation", "reports"],
    busFactorRisk: "critical"
  },
  {
    id: "user_dipan_sen",
    name: "Dipan Sen",
    role: "Senior engineer",
    ownershipPercent: 48,
    modules: ["auth", "rate-limiting", "session"],
    busFactorRisk: "medium"
  },
  {
    id: "user_mira_lin",
    name: "Mira Lin",
    role: "Backend engineer",
    ownershipPercent: 32,
    modules: ["integrations", "webhooks"],
    busFactorRisk: "low"
  },
  {
    id: "user_tao_park",
    name: "Tao Park",
    role: "Frontend engineer",
    ownershipPercent: 28,
    modules: ["dashboard", "settings"],
    busFactorRisk: "low"
  }
];

export const demoRegulations: RegulationEntry[] = [
  {
    id: "reg_dpdp_section_8",
    region: "India",
    name: "DPDP Act Section 8 - Data Principal Rights",
    enforcementDate: "2026-06-25T00:00:00.000Z",
    daysUntil: 60,
    mappedFiles: ["src/routes/customers.ts", "src/services/exportReservations.ts"],
    status: "violating",
    summary: "Right to erasure must be honored within 30 days. Two endpoints lack deletion plumbing."
  },
  {
    id: "reg_eu_ai_act_logging",
    region: "EU",
    name: "EU AI Act Article 13 - Logging",
    enforcementDate: "2026-08-02T00:00:00.000Z",
    daysUntil: 98,
    mappedFiles: ["src/integrations/ai.ts"],
    status: "at-risk",
    summary: "AI provider calls must be logged with input class and decision rationale."
  },
  {
    id: "reg_gdpr_article_25",
    region: "EU",
    name: "GDPR Article 25 - Data minimization",
    enforcementDate: "2018-05-25T00:00:00.000Z",
    daysUntil: 0,
    mappedFiles: ["src/middleware/serializer.ts"],
    status: "compliant",
    summary: "Response serializer redacts PII for unauthorized scopes."
  },
  {
    id: "reg_soc2_cc6_6",
    region: "Global",
    name: "SOC2 CC6.6 - Authentication",
    enforcementDate: "2026-05-10T00:00:00.000Z",
    daysUntil: 14,
    mappedFiles: ["src/routes/auth.ts", "src/middleware/rateLimit.ts"],
    status: "compliant",
    summary: "Rate limiting and MFA enforcement evidence is current."
  }
];

export const demoAgents: AgentDefinition[] = [
  { id: "agent_01", number: 1, layer: "Understanding", name: "Architect", status: "live", oneLine: "Maps routes, queries, and tenant boundaries into a living graph.", output: "126 routes / 418 query surfaces mapped." },
  { id: "agent_02", number: 2, layer: "Understanding", name: "Archaeologist", status: "live", oneLine: "Reads git history to preserve why decisions were made.", output: "4 risk-tagged commits in the decision log." },
  { id: "agent_03", number: 3, layer: "Understanding", name: "Tribal Knowledge Mapper", status: "live", oneLine: "Surfaces implicit cross-service contracts.", output: "5 cross-service contracts registered." },
  { id: "agent_04", number: 4, layer: "Documentation", name: "Doc Writer", status: "live", oneLine: "Auto-generates API docs from code.", output: "OpenAPI 3.1 spec served at /openapi.json." },
  { id: "agent_05", number: 5, layer: "Documentation", name: "Example Generator", status: "live", oneLine: "Curl + JS + Python for every endpoint.", output: "Multi-language examples on /docs/api." },
  { id: "agent_06", number: 6, layer: "Documentation", name: "Changelog Narrator", status: "live", oneLine: "Plain-English changelog for devs, founders, auditors.", output: "3 narrated commits this week." },
  { id: "agent_07", number: 7, layer: "Security", name: "Multi-Tenant Leak Detector", status: "live", oneLine: "Flags sensitive queries lacking tenant filters.", output: "2 critical findings on sample-saas." },
  { id: "agent_08", number: 8, layer: "Security", name: "Adversarial Simulator", status: "live", oneLine: "Reproduces full exploit chains automatically.", output: "3-hop exploit chain reproduced for billing." },
  { id: "agent_09", number: 9, layer: "Security", name: "Auth Flow Auditor", status: "live", oneLine: "Maps protected vs unprotected routes.", output: "1 unprotected internal route detected." },
  { id: "agent_10", number: 10, layer: "Security", name: "Dependency Threat Monitor", status: "live", oneLine: "Maps CVEs to your actual call sites.", output: "3 advisories, 3 contextual usages." },
  { id: "agent_11", number: 11, layer: "Intent", name: "Intent Drift Monitor", status: "live", oneLine: "Plain-English contracts enforced on every PR.", output: "1 violated, 1 warning, 1 passing." },
  { id: "agent_12", number: 12, layer: "Compliance", name: "Regulatory Horizon Scanner", status: "live", oneLine: "Maps upcoming laws to your code before enforcement.", output: "DPDP Section 8 enforcement in 60 days." },
  { id: "agent_13", number: 13, layer: "Compliance", name: "Compliance-to-Code Mapper", status: "live", oneLine: "Maps each control to the function responsible.", output: "GDPR Art. 25 -> serializer middleware." },
  { id: "agent_14", number: 14, layer: "Economics", name: "Economic Blast Radius", status: "live", oneLine: "Tags every endpoint with revenue at risk.", output: "$4,200/hr exposed by /api/payments/charge." },
  { id: "agent_15", number: 15, layer: "Economics", name: "Codebase Time Machine", status: "live", oneLine: "Finds gradual capability regressions over time.", output: "Search latency p95 +38% over 6 sprints." },
  { id: "agent_16", number: 16, layer: "Economics", name: "Behavioral Regression Detector", status: "live", oneLine: "Catches breaking behavior before merge.", output: "PR #284 silently changed pagination contract." },
  { id: "agent_17", number: 17, layer: "Economics", name: "Technical Debt Economist", status: "live", oneLine: "Prioritizes refactors by ROI in engineering hours.", output: "Top refactor: 40h cost / 280h saved." },
  { id: "agent_18", number: 18, layer: "Team", name: "Knowledge Bus Factor Analyzer", status: "live", oneLine: "Flags single points of human failure.", output: "Ria Kapoor owns 71% of billing." },
  { id: "agent_19", number: 19, layer: "Team", name: "Onboarding Accelerator", status: "live", oneLine: "Personalized codebase tours per new dev.", output: "5-stop tour ready for new backend hires." },
  { id: "agent_20", number: 20, layer: "Team", name: "PR Context Enricher", status: "live", oneLine: "Auto-attaches blast radius and intent status to every PR.", output: "Last 3 PRs enriched with risk briefs." }
];

// ===== Phase 4 agent surfaces (Archaeology, Contracts, Time Machine, Regression, Tech Debt, Onboarding, PR Context) =====

export type DecisionLogEntry = {
  id: string;
  commitSha: string;
  date: string;
  author: string;
  title: string;
  rationale: string;
  riskIfRemoved: Severity;
  affectedFiles: string[];
};

export type ServiceContract = {
  id: string;
  consumerService: string;
  providerService: string;
  expectation: string;
  evidence: string;
  status: "verified" | "implicit" | "violated";
  lastObservedAt: string;
};

export type CapabilityTrendPoint = {
  capability: string;
  metric: string;
  series: { sprint: string; value: number }[];
  direction: "improving" | "stable" | "regressing";
  delta: string;
};

export type BehavioralRegression = {
  id: string;
  prNumber: number;
  title: string;
  contract: string;
  before: string;
  after: string;
  severity: Severity;
  detectedAt: string;
};

export type TechDebtItem = {
  id: string;
  area: string;
  summary: string;
  costHours: number;
  savingsHoursPerQuarter: number;
  paybackSprints: number;
  priority: "now" | "soon" | "later";
};

export type OnboardingStop = {
  step: number;
  title: string;
  filePath: string;
  why: string;
  estimatedMinutes: number;
};

export type OnboardingTour = {
  id: string;
  role: string;
  totalMinutes: number;
  stops: OnboardingStop[];
};

export type PrContextBrief = {
  id: string;
  prNumber: number;
  title: string;
  author: string;
  blastRadius: string;
  intentChecks: { contract: string; status: "passing" | "warning" | "violated" }[];
  reviewers: { name: string; reason: string }[];
  riskTag: Severity;
};

export const demoDecisionLog: DecisionLogEntry[] = [
  {
    id: "dl_a3f9c2",
    commitSha: "a3f9c2d",
    date: "2025-11-04T14:32:00.000Z",
    author: "Ria Kapoor",
    title: "Added tenant filter to billing report query",
    rationale: "Post-incident fix after a paid-status invoice from tenant B leaked into tenant A's report.",
    riskIfRemoved: "critical",
    affectedFiles: ["src/routes/reports.ts"]
  },
  {
    id: "dl_8b14ae",
    commitSha: "8b14ae7",
    date: "2025-12-19T09:15:00.000Z",
    author: "Mira Lin",
    title: "Switched export pipeline to streamed CSV",
    rationale: "OOMs in staging when tenants requested 90-day exports.",
    riskIfRemoved: "high",
    affectedFiles: ["src/services/exportReservations.ts"]
  },
  {
    id: "dl_6c2901",
    commitSha: "6c29011",
    date: "2026-02-08T11:08:00.000Z",
    author: "Ria Kapoor",
    title: "Hardened rate limiter on /auth/login",
    rationale: "Credential stuffing attempts spiked from one IP range.",
    riskIfRemoved: "high",
    affectedFiles: ["src/middleware/rateLimit.ts"]
  },
  {
    id: "dl_4d77fa",
    commitSha: "4d77fa2",
    date: "2026-04-12T16:48:00.000Z",
    author: "Tao Park",
    title: "Replaced inline plan checks with feature flags",
    rationale: "Free tier users were occasionally seeing paid export buttons.",
    riskIfRemoved: "medium",
    affectedFiles: ["apps/web/src/components/product/billing.tsx"]
  }
];

export const demoServiceContracts: ServiceContract[] = [
  {
    id: "sc_billing_to_payments",
    consumerService: "billing-worker",
    providerService: "payments-api",
    expectation: "payments-api always returns tenant_id on /charge responses.",
    evidence: "billing-worker/src/handlers/charge.ts:42 reads response.tenant_id without a null check.",
    status: "verified",
    lastObservedAt: "2026-04-25T18:00:00.000Z"
  },
  {
    id: "sc_web_to_api_pagination",
    consumerService: "web",
    providerService: "api",
    expectation: "List endpoints return { items, nextCursor }; web infinite-scroll relies on nextCursor.",
    evidence: "apps/web/src/lib/api.ts uses nextCursor on /v1/repositories.",
    status: "implicit",
    lastObservedAt: "2026-04-26T08:14:00.000Z"
  },
  {
    id: "sc_reports_to_audit",
    consumerService: "reports",
    providerService: "audit-log",
    expectation: "audit-log accepts events synchronously and never drops on failure.",
    evidence: "reports calls audit.write without retry; audit-log retries internally.",
    status: "implicit",
    lastObservedAt: "2026-04-25T23:51:00.000Z"
  },
  {
    id: "sc_export_to_storage",
    consumerService: "exporter",
    providerService: "object-storage",
    expectation: "object-storage signed URLs expire in 600s; exporter mails URLs immediately.",
    evidence: "exporter/email-job.ts schedules send 12s after signing.",
    status: "verified",
    lastObservedAt: "2026-04-24T12:30:00.000Z"
  },
  {
    id: "sc_intent_to_db",
    consumerService: "intent-monitor",
    providerService: "primary-db",
    expectation: "Schema column 'tenant_id' is non-null on every multi-tenant table.",
    evidence: "Recent migration 0298 dropped NOT NULL on reports.tenant_id.",
    status: "violated",
    lastObservedAt: "2026-04-26T01:04:19.000Z"
  }
];

export const demoCapabilityTrends: CapabilityTrendPoint[] = [
  {
    capability: "Search latency p95",
    metric: "ms",
    series: [
      { sprint: "S-5", value: 320 },
      { sprint: "S-4", value: 350 },
      { sprint: "S-3", value: 380 },
      { sprint: "S-2", value: 410 },
      { sprint: "S-1", value: 430 },
      { sprint: "S0", value: 442 }
    ],
    direction: "regressing",
    delta: "+38% over 6 sprints"
  },
  {
    capability: "PR review time",
    metric: "hours",
    series: [
      { sprint: "S-5", value: 14 },
      { sprint: "S-4", value: 13 },
      { sprint: "S-3", value: 12 },
      { sprint: "S-2", value: 12 },
      { sprint: "S-1", value: 11 },
      { sprint: "S0", value: 10 }
    ],
    direction: "improving",
    delta: "-29% over 6 sprints"
  },
  {
    capability: "Test coverage on /api routes",
    metric: "percent",
    series: [
      { sprint: "S-5", value: 71 },
      { sprint: "S-4", value: 72 },
      { sprint: "S-3", value: 70 },
      { sprint: "S-2", value: 71 },
      { sprint: "S-1", value: 70 },
      { sprint: "S0", value: 71 }
    ],
    direction: "stable",
    delta: "flat at 71%"
  }
];

export const demoBehavioralRegressions: BehavioralRegression[] = [
  {
    id: "breg_pr_284",
    prNumber: 284,
    title: "Refactor: list endpoints use offset/limit",
    contract: "List endpoints return { items, nextCursor }",
    before: "{ items: [...], nextCursor: 'abc123' }",
    after: "{ items: [...], totalPages: 7 }",
    severity: "high",
    detectedAt: "2026-04-25T17:42:00.000Z"
  },
  {
    id: "breg_pr_281",
    prNumber: 281,
    title: "Speed up /reports response",
    contract: "All /reports responses include scope_summary",
    before: "{ data: [...], scope_summary: { ... } }",
    after: "{ data: [...] }",
    severity: "medium",
    detectedAt: "2026-04-22T11:08:00.000Z"
  }
];

export const demoTechDebtItems: TechDebtItem[] = [
  {
    id: "td_inline_validation",
    area: "Validation",
    summary: "Replace 14 hand-rolled body validators with the shared Zod schema package.",
    costHours: 40,
    savingsHoursPerQuarter: 70,
    paybackSprints: 1,
    priority: "now"
  },
  {
    id: "td_legacy_session_cookie",
    area: "Auth",
    summary: "Migrate the legacy /v0 session cookie path to the unified session middleware.",
    costHours: 32,
    savingsHoursPerQuarter: 54,
    paybackSprints: 1,
    priority: "now"
  },
  {
    id: "td_export_streaming",
    area: "Performance",
    summary: "Drop 3 ad-hoc export aggregators in favor of the streaming CSV pipeline.",
    costHours: 20,
    savingsHoursPerQuarter: 32,
    paybackSprints: 2,
    priority: "soon"
  },
  {
    id: "td_dashboard_state",
    area: "Frontend",
    summary: "Consolidate the dashboard's 4 client-state stores into one query layer.",
    costHours: 24,
    savingsHoursPerQuarter: 26,
    paybackSprints: 3,
    priority: "later"
  }
];

export const demoOnboardingTour: OnboardingTour = {
  id: "tour_backend_engineer",
  role: "Backend engineer",
  totalMinutes: 45,
  stops: [
    {
      step: 1,
      title: "Org scoping decorator",
      filePath: "apps/api/src/context.ts",
      why: "Every request resolves an organization here. If you change this, every route changes.",
      estimatedMinutes: 8
    },
    {
      step: 2,
      title: "Repository routes + Zod inputs",
      filePath: "apps/api/src/routes/repositories.ts",
      why: "Canonical pattern for: validate -> assertOrganization -> mutate -> return.",
      estimatedMinutes: 8
    },
    {
      step: 3,
      title: "Demo store and tenant scoping",
      filePath: "apps/api/src/services/demo-store.ts",
      why: "Replace this with Prisma when the persistent layer lands. Keep the public surface identical.",
      estimatedMinutes: 10
    },
    {
      step: 4,
      title: "Analyzer entry point",
      filePath: "packages/analyzer/src/index.ts",
      why: "All AST-level rules live here. Add a new rule by extending the visitor.",
      estimatedMinutes: 12
    },
    {
      step: 5,
      title: "Shared Zod schemas + demo data",
      filePath: "packages/shared/src/index.ts",
      why: "Single source of truth consumed by web + api + analyzer.",
      estimatedMinutes: 7
    }
  ]
};

export const demoPrContextBriefs: PrContextBrief[] = [
  {
    id: "pr_312",
    prNumber: 312,
    title: "Add export endpoint to admin dashboard",
    author: "Mira Lin",
    blastRadius: "$1,800/hr - touches /api/admin/export/reservations.",
    intentChecks: [
      { contract: "Tenant billing isolation", status: "passing" },
      { contract: "Free tier export limit", status: "warning" }
    ],
    reviewers: [
      { name: "Ria Kapoor", reason: "Owns 71% of billing module." },
      { name: "Tao Park", reason: "Touches frontend export buttons." }
    ],
    riskTag: "high"
  },
  {
    id: "pr_311",
    prNumber: 311,
    title: "Refactor: list endpoints use offset/limit",
    author: "Aria Singh",
    blastRadius: "$0/hr direct revenue - but breaks consumer pagination contract.",
    intentChecks: [
      { contract: "Cursor pagination contract", status: "violated" }
    ],
    reviewers: [
      { name: "Mira Lin", reason: "Owns integrations layer that consumes cursor." }
    ],
    riskTag: "high"
  },
  {
    id: "pr_309",
    prNumber: 309,
    title: "Tighten rate limit on /auth/login",
    author: "Ria Kapoor",
    blastRadius: "$0/hr - hardens login.",
    intentChecks: [{ contract: "Auth rate limit", status: "passing" }],
    reviewers: [{ name: "Mira Lin", reason: "Pair on auth changes." }],
    riskTag: "low"
  }
];

// ===== Semantic core graph + delivery surfaces =====

export type GraphNode = {
  id: string;
  kind: "route" | "service" | "model" | "tenant_boundary" | "external";
  label: string;
  layer: string;
  riskScore: number;
  meta?: Record<string, string | number>;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: "calls" | "reads" | "writes" | "scopes" | "depends_on";
  label?: string;
};

export type SemanticGraph = {
  generatedAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export const demoSemanticGraph: SemanticGraph = {
  generatedAt: "2026-04-26T01:04:19.000Z",
  nodes: [
    { id: "route_charge", kind: "route", label: "POST /api/payments/charge", layer: "Security", riskScore: 92, meta: { revenuePerHour: 4200 } },
    { id: "route_reports", kind: "route", label: "GET /api/reports", layer: "Security", riskScore: 78 },
    { id: "route_export", kind: "route", label: "POST /api/admin/export/reservations", layer: "Economics", riskScore: 64 },
    { id: "route_login", kind: "route", label: "POST /auth/login", layer: "Security", riskScore: 41 },
    { id: "svc_payments", kind: "service", label: "payments-api", layer: "Economics", riskScore: 70 },
    { id: "svc_billing_worker", kind: "service", label: "billing-worker", layer: "Economics", riskScore: 55 },
    { id: "svc_audit", kind: "service", label: "audit-log", layer: "Compliance", riskScore: 30 },
    { id: "svc_exporter", kind: "service", label: "exporter", layer: "Economics", riskScore: 40 },
    { id: "model_invoice", kind: "model", label: "Invoice", layer: "Economics", riskScore: 80 },
    { id: "model_reservation", kind: "model", label: "Reservation", layer: "Security", riskScore: 65 },
    { id: "model_user", kind: "model", label: "User", layer: "Security", riskScore: 35 },
    { id: "tenant_org", kind: "tenant_boundary", label: "tenant_id (organizations)", layer: "Security", riskScore: 95 },
    { id: "ext_stripe", kind: "external", label: "Stripe API", layer: "Economics", riskScore: 50 },
    { id: "ext_storage", kind: "external", label: "Object storage", layer: "Economics", riskScore: 25 }
  ],
  edges: [
    { id: "e_charge_payments", from: "route_charge", to: "svc_payments", kind: "calls" },
    { id: "e_payments_invoice", from: "svc_payments", to: "model_invoice", kind: "writes" },
    { id: "e_invoice_tenant", from: "model_invoice", to: "tenant_org", kind: "scopes", label: "tenant_id NOT NULL" },
    { id: "e_reports_reservation", from: "route_reports", to: "model_reservation", kind: "reads" },
    { id: "e_reservation_tenant", from: "model_reservation", to: "tenant_org", kind: "scopes" },
    { id: "e_export_exporter", from: "route_export", to: "svc_exporter", kind: "calls" },
    { id: "e_exporter_storage", from: "svc_exporter", to: "ext_storage", kind: "depends_on" },
    { id: "e_login_user", from: "route_login", to: "model_user", kind: "reads" },
    { id: "e_billing_payments", from: "svc_billing_worker", to: "svc_payments", kind: "calls" },
    { id: "e_payments_stripe", from: "svc_payments", to: "ext_stripe", kind: "depends_on" },
    { id: "e_reports_audit", from: "route_reports", to: "svc_audit", kind: "writes" }
  ]
};

export type SlackDigestPreview = {
  channel: string;
  title: string;
  blocks: { kind: "header" | "section" | "context"; text: string }[];
  scheduledAt: string;
};

export type WebhookEvent = {
  id: string;
  receivedAt: string;
  source: "github";
  event: string;
  repository: string;
  ref: string;
  agentsTriggered: string[];
  status: "accepted" | "rejected";
};

export type MergeGateDecision = {
  prNumber: number;
  decision: "allow" | "warn" | "block";
  rationale: string;
  failingChecks: { name: string; severity: Severity; message: string }[];
  passingChecks: string[];
  evaluatedAt: string;
};
