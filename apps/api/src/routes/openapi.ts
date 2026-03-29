import type { FastifyPluginAsync } from "fastify";

type ParameterSpec = {
  name: string;
  in: "path" | "query" | "header";
  required: boolean;
  description: string;
  schema: { type: string; example?: unknown };
};

type EndpointSpec = {
  method: "get" | "post";
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: ParameterSpec[];
  requestExample?: Record<string, unknown>;
  responseExample: unknown;
};

const orgHeader: ParameterSpec = {
  name: "x-organization-id",
  in: "header",
  required: false,
  description: "Organization scope. Defaults to org_covenant_demo when omitted in development.",
  schema: { type: "string", example: "org_covenant_demo" }
};

const endpoints: EndpointSpec[] = [
  {
    method: "get",
    path: "/health",
    summary: "Liveness probe",
    description: "Returns 200 when the API process is alive. No org scope required.",
    tags: ["System"],
    responseExample: { ok: true, service: "covenant-api", time: "2026-04-26T08:00:00.000Z" }
  },
  {
    method: "get",
    path: "/v1/dashboard",
    summary: "Tenant isolation dashboard",
    description: "Returns the org-scoped dashboard payload: open findings, agents, integrations, risk trend.",
    tags: ["Dashboard"],
    parameters: [orgHeader],
    responseExample: { organization: { id: "org_covenant_demo" }, openFindings: 3, riskScore: 50 }
  },
  {
    method: "get",
    path: "/v1/repositories",
    summary: "List repositories",
    description: "Returns every repository onboarded for the org.",
    tags: ["Repositories"],
    parameters: [orgHeader],
    responseExample: [{ id: "repo_demo", name: "sample-saas", scanStatus: "blocked" }]
  },
  {
    method: "post",
    path: "/v1/repositories",
    summary: "Onboard a repository",
    description: "Creates a repository in the org scope. Returns 400 on validation failure.",
    tags: ["Repositories"],
    parameters: [orgHeader],
    requestExample: { name: "checkout-svc", provider: "github", defaultBranch: "main", language: "TypeScript" },
    responseExample: { id: "repo_checkout-svc_1777000000000", scanStatus: "queued" }
  },
  {
    method: "get",
    path: "/v1/scans/latest",
    summary: "Latest scan",
    description: "Returns the most recent scan for the org with its findings, evidence, and exploit steps.",
    tags: ["Scans"],
    parameters: [orgHeader],
    responseExample: { id: "scan_latest", status: "blocked", findings: [{ severity: "critical" }] }
  },
  {
    method: "get",
    path: "/v1/scans/{scanId}",
    summary: "Scan by id",
    description: "Returns a specific scan. Returns 404 if not found in this org.",
    tags: ["Scans"],
    parameters: [
      orgHeader,
      { name: "scanId", in: "path", required: true, description: "Scan identifier.", schema: { type: "string", example: "scan_latest" } }
    ],
    responseExample: { id: "scan_latest", riskScore: 76, findings: [] }
  },
  {
    method: "post",
    path: "/v1/scans",
    summary: "Trigger a scan",
    description: "Runs a scan against an existing repository in demo or upload mode. Returns 404 if the repository is unknown, 400 on validation failure.",
    tags: ["Scans"],
    parameters: [orgHeader],
    requestExample: { repositoryId: "repo_demo", sourceMode: "demo" },
    responseExample: { id: "scan_demo_1777000000000", status: "blocked", findings: [{ severity: "high" }] }
  },
  {
    method: "get",
    path: "/v1/contracts",
    summary: "Intent contracts",
    description: "Plain-English contracts and their current pass/warn/fail status.",
    tags: ["Intent"],
    parameters: [orgHeader],
    responseExample: { contracts: [{ id: "ctr_billing", status: "violated" }] }
  },
  {
    method: "get",
    path: "/v1/integrations",
    summary: "Integration status",
    description: "Adapter and webhook integration status for the org.",
    tags: ["Integrations"],
    parameters: [orgHeader],
    responseExample: [{ id: "int_github", status: "connected" }]
  },
  {
    method: "get",
    path: "/v1/billing",
    summary: "Billing plan + usage",
    description: "Current plan, addons, scans this month, and seat usage.",
    tags: ["Billing"],
    parameters: [orgHeader],
    responseExample: { plan: "Startup", scansThisMonth: 124, seats: 6 }
  },
  {
    method: "get",
    path: "/v1/agents",
    summary: "Agent matrix",
    description: "Every Covenant agent with status (live / beta / planned), layer, and last output.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { agents: [], counts: { live: 12, beta: 1, planned: 7 } }
  },
  {
    method: "get",
    path: "/v1/auth-audit",
    summary: "Auth flow audit",
    description: "Per-route protected / admin-only / unprotected breakdown with coverage percentage.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { entries: [], coverage: { protected: 2, admin: 1, unprotected: 2 } }
  },
  {
    method: "get",
    path: "/v1/blast-radius",
    summary: "Economic blast radius",
    description: "Revenue at risk per endpoint with hourly and monthly totals.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { entries: [], totals: { hourly: 4420, monthly: 3182400 } }
  },
  {
    method: "get",
    path: "/v1/dependencies",
    summary: "Dependency CVE alerts",
    description: "Vulnerabilities mapped to actual call sites in your code.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { alerts: [], counts: { high: 1, medium: 1, low: 1 } }
  },
  {
    method: "get",
    path: "/v1/changelog",
    summary: "Narrated changelog",
    description: "Three-audience changelog: developer / founder / auditor narration with risk badge.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { entries: [{ commit: "a3f9c2", risk: "critical" }] }
  },
  {
    method: "get",
    path: "/v1/team",
    summary: "Knowledge bus factor",
    description: "Per-member ownership concentration and at-risk areas.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { members: [], atRisk: 1 }
  },
  {
    method: "get",
    path: "/v1/regulations",
    summary: "Regulatory horizon",
    description: "Upcoming regulations mapped to your code with enforcement countdown.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { entries: [], nextEnforcementDays: 14 }
  },
  {
    method: "get",
    path: "/v1/decision-log",
    summary: "Archaeologist decision log",
    description: "Risk-tagged commit timeline with the rationale behind each decision.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { entries: [], counts: { critical: 1, high: 2 } }
  },
  {
    method: "get",
    path: "/v1/service-contracts",
    summary: "Tribal knowledge contracts",
    description: "Implicit and verified contracts between services with last-observed timestamps.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { contracts: [], counts: { verified: 2, implicit: 2, violated: 1 } }
  },
  {
    method: "get",
    path: "/v1/capability-trends",
    summary: "Codebase time machine",
    description: "Capability metrics tracked across recent sprints; flags gradual regressions.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { trends: [], regressing: 1 }
  },
  {
    method: "get",
    path: "/v1/behavioral-regressions",
    summary: "Behavioral regression detector",
    description: "PRs that silently changed observable contracts.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { regressions: [], openCount: 2 }
  },
  {
    method: "get",
    path: "/v1/tech-debt",
    summary: "Technical debt economist",
    description: "Refactor backlog ranked by ROI in engineering hours per quarter.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { items: [], totals: { costHours: 116, savingsHoursPerQuarter: 182, roi: 1.57 } }
  },
  {
    method: "get",
    path: "/v1/onboarding-tour",
    summary: "Onboarding accelerator tour",
    description: "Personalized 5-stop codebase tour for a given role.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { id: "tour_backend_engineer", role: "Backend engineer", totalMinutes: 45, stops: [] }
  },
  {
    method: "get",
    path: "/v1/pr-context",
    summary: "PR context enricher",
    description: "Auto-attached blast radius, intent checks, and reviewer reasons per PR.",
    tags: ["Intelligence"],
    parameters: [orgHeader],
    responseExample: { briefs: [], highRiskCount: 2 }
  },
  {
    method: "get",
    path: "/v1/graph",
    summary: "Living semantic graph",
    description: "Architect agent's living dependency graph: routes, services, models, tenant boundaries, and externals.",
    tags: ["Platform"],
    parameters: [orgHeader],
    responseExample: { graph: { generatedAt: "", nodes: [], edges: [] }, counts: { nodes: 14, edges: 11, highRiskNodes: 5 } }
  },
  {
    method: "post",
    path: "/v1/integrations/github/webhook",
    summary: "GitHub webhook receiver",
    description: "Accepts push/pr events. Triggers the agents whose outputs depend on the changed surface.",
    tags: ["Platform"],
    parameters: [orgHeader],
    requestExample: { event: "push", repository: "covenant-demo/sample-saas", ref: "refs/heads/main", commitSha: "a3f9c2d" },
    responseExample: { id: "webhook_123", status: "accepted", agentsTriggered: ["agent_01", "agent_07"] }
  },
  {
    method: "post",
    path: "/v1/integrations/slack/digest",
    summary: "Slack digest preview",
    description: "Returns a preview of the Slack/email digest that would be posted, without delivering it.",
    tags: ["Platform"],
    parameters: [orgHeader],
    requestExample: { channel: "#covenant-alerts", scope: "security" },
    responseExample: { channel: "#covenant-alerts", title: "Covenant - Security digest", blocks: [] }
  },
  {
    method: "post",
    path: "/v1/pr-checks",
    summary: "Merge gate evaluator",
    description: "Evaluates a PR against intent contracts, service contracts, and behavioral regressions. Returns allow / warn / block.",
    tags: ["Platform"],
    parameters: [orgHeader],
    requestExample: { prNumber: 284, title: "Refactor list endpoints", changedFiles: ["src/routes/list.ts"] },
    responseExample: { prNumber: 284, decision: "block", failingChecks: [], passingChecks: [] }
  }
];

function buildOpenApiDocument(baseUrl: string) {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const ep of endpoints) {
    const bucket = paths[ep.path] ?? (paths[ep.path] = {});
    const operation: Record<string, unknown> = {
      summary: ep.summary,
      description: ep.description,
      tags: ep.tags,
      parameters: ep.parameters || [],
      responses: {
        "200": {
          description: "OK",
          content: { "application/json": { example: ep.responseExample } }
        },
        "400": { description: "Bad request - validation failed" },
        "404": { description: "Not found in this organization scope" }
      }
    };
    if (ep.requestExample) {
      operation.requestBody = {
        required: true,
        content: { "application/json": { example: ep.requestExample } }
      };
    }
    bucket[ep.method] = operation;
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "Covenant API",
      version: "0.1.0",
      description:
        "Living intelligence for SaaS codebases. Every endpoint is org-scoped via the optional x-organization-id header (defaults to org_covenant_demo in development)."
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: "System" },
      { name: "Dashboard" },
      { name: "Repositories" },
      { name: "Scans" },
      { name: "Intent" },
      { name: "Integrations" },
      { name: "Billing" },
      { name: "Intelligence", description: "Agent surfaces (auth, blast radius, dependencies, changelog, team, regulations)." }
    ],
    paths
  };
}

export const openapiRoutes: FastifyPluginAsync = async (app) => {
  app.get("/openapi.json", async (request) => {
    const protocol = (request.headers["x-forwarded-proto"] as string) || request.protocol;
    const host = request.headers.host || "localhost:4000";
    return buildOpenApiDocument(`${protocol}://${host}`);
  });
};

export const openapiEndpoints = endpoints;
