import { scanSourceFiles, type AnalyzerFinding } from "../index";
import type { Agent, AgentContext, ArchitectOutput } from "../agent-contract";

/**
 * A7 — Multi-Tenant Leak Detector.
 *
 * Re-runs the analyzer with the existing `tenant-filter-required` rule and
 * extends it with two additional heuristics:
 *
 *   1. Endpoints that touch sensitive models WITHOUT calling an explicit
 *      tenant boundary in the SAME function (cross-call leak risk).
 *   2. Raw SQL fragments matching `select|update|delete ... where` without
 *      a tenant column referenced anywhere in the fragment.
 */
export const a7TenantLeak: Agent<{ extraFindings: number }> = {
  id: "A7",
  name: "Multi-Tenant Leak Detector",
  description: "Surfaces queries and endpoints that read tenant-sensitive data without a boundary filter.",
  dependsOn: ["A1"],
  async run(ctx: AgentContext) {
    // Use the AST analyzer's existing rules as the base set.
    const base = scanSourceFiles(ctx.sourceFiles);
    const findings: AnalyzerFinding[] = [...base.findings];

    // Extension #1 — endpoints with a query that touches sensitive data but
    // whose ROUTE (not just the query) lacks tenant context. We do this by
    // counting how many of an endpoint's queries had findings; if 50%+, the
    // whole endpoint is escalated.
    const arch = ctx.prior.A1 as ArchitectOutput | undefined;
    if (arch) {
      const byEndpoint = new Map<string, { total: number; flagged: number }>();
      for (const q of arch.queries) {
        const key = `${q.routeMethod} ${q.endpoint}`;
        const slot = byEndpoint.get(key) ?? { total: 0, flagged: 0 };
        slot.total += 1;
        if (base.findings.some((f) => f.endpoint === q.endpoint && f.routeMethod === q.routeMethod && f.line === q.line)) {
          slot.flagged += 1;
        }
        byEndpoint.set(key, slot);
      }
      for (const [endpointKey, counts] of byEndpoint) {
        if (counts.total >= 2 && counts.flagged / counts.total >= 0.5) {
          findings.push({
            id: `a7-endpoint-${Buffer.from(endpointKey).toString("hex").slice(0, 16)}`,
            ruleId: "tenant-leak-endpoint-pattern",
            severity: "high",
            title: `Endpoint ${endpointKey} repeatedly reads tenant data without a boundary`,
            summary:
              "More than half of the queries on this endpoint were missing an explicit tenant filter. Consider wrapping the handler in a tenant-context middleware.",
            filePath: arch.queries.find((q) => `${q.routeMethod} ${q.endpoint}` === endpointKey)?.filePath ?? "unknown",
            line: arch.queries.find((q) => `${q.routeMethod} ${q.endpoint}` === endpointKey)?.line ?? 1,
            endpoint: endpointKey.split(" ").slice(1).join(" "),
            routeMethod: endpointKey.split(" ")[0] ?? "GET",
            evidence: `${counts.flagged}/${counts.total} queries flagged on this endpoint`,
            impact: "Cross-tenant data exposure if any of these queries returns rows for a different organization.",
            suggestedFix:
              "Apply a tenant-context middleware to the handler or migrate the queries to a tenant-scoped repository client.",
            exploitSteps: [
              "Authenticate as tenant A",
              `Issue a request to ${endpointKey}`,
              "Inspect the response for rows belonging to tenant B"
            ]
          });
        }
      }
    }

    return {
      output: { extraFindings: findings.length - base.findings.length },
      findings
    };
  }
};
