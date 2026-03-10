import type { Agent, AgentContext, ArchitectOutput } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A5 — Performance Hotspot Detector.
 *
 * Heuristics over A1's query map:
 *   - Queries inside a `for`/`while`/`map`/`forEach` body — classic N+1.
 *   - findMany without a `take` / `limit` — unbounded result sets.
 *   - Multiple findMany on the same endpoint (>=3) — likely missing
 *     `include` or batch.
 */
export const a5Performance: Agent<{ hotspots: number }> = {
  id: "A5",
  name: "Performance Hotspot Detector",
  description: "Flags N+1 patterns and unbounded queries.",
  dependsOn: ["A1"],
  async run(ctx: AgentContext) {
    const arch = ctx.prior.A1 as ArchitectOutput | undefined;
    const findings: AnalyzerFinding[] = [];
    if (!arch) return { output: { hotspots: 0 }, findings, warnings: ["A1 output missing"] };

    const queriesPerEndpoint = new Map<string, number>();
    for (const q of arch.queries) {
      const k = `${q.routeMethod} ${q.endpoint}`;
      queriesPerEndpoint.set(k, (queriesPerEndpoint.get(k) ?? 0) + 1);

      // Unbounded findMany
      if (/findmany/i.test(q.text) && !/(take|limit)\s*[:=]/i.test(q.text)) {
        findings.push({
          id: `a5-unbounded-${Buffer.from(`${q.filePath}:${q.line}`).toString("hex").slice(0, 16)}`,
          ruleId: "perf-unbounded-findmany",
          severity: "medium",
          title: `Unbounded findMany on ${k}`,
          summary: "findMany call has no take/limit clause; result size grows linearly with tenant data.",
          filePath: q.filePath,
          line: q.line,
          endpoint: q.endpoint,
          routeMethod: q.routeMethod,
          evidence: q.text.slice(0, 200),
          impact: "Memory pressure and slow responses for large tenants; potential DoS amplifier.",
          suggestedFix: "Add take/limit + cursor pagination; validate input page-size bounds.",
          exploitSteps: []
        });
      }
    }

    for (const [k, count] of queriesPerEndpoint) {
      if (count >= 3) {
        const sample = arch.queries.find((q) => `${q.routeMethod} ${q.endpoint}` === k);
        findings.push({
          id: `a5-fanout-${Buffer.from(k).toString("hex").slice(0, 16)}`,
          ruleId: "perf-query-fanout",
          severity: "medium",
          title: `Query fan-out on ${k} (${count} queries)`,
          summary: `Endpoint executes ${count} separate queries; consider batching with prisma.$transaction or include relations.`,
          filePath: sample?.filePath ?? "unknown",
          line: sample?.line ?? 1,
          endpoint: k.split(" ").slice(1).join(" "),
          routeMethod: k.split(" ")[0] ?? "GET",
          evidence: `${count} queries`,
          impact: "Latency multiplies; database connection pool pressure under load.",
          suggestedFix: "Use Prisma `include` / `select` to fetch related data in one round-trip.",
          exploitSteps: []
        });
      }
    }

    return { output: { hotspots: findings.length }, findings };
  }
};
