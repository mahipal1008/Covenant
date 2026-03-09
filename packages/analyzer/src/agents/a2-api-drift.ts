import type { Agent, AgentContext, ArchitectOutput } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A2 — API Surface Drift Detector.
 *
 * Catches two surface-level anti-patterns that ship breaking changes
 * silently:
 *   1. Duplicate endpoint registrations (same METHOD + path declared
 *      twice — Fastify will register the last one and swallow the rest).
 *   2. Mixed casing / trailing-slash variants of the same path
 *      (/v1/users vs /v1/Users vs /v1/users/).
 */
export const a2ApiDrift: Agent<{ duplicates: number; variants: number }> = {
  id: "A2",
  name: "API Surface Drift Detector",
  description: "Flags duplicate or near-duplicate endpoint registrations that cause silent overrides.",
  dependsOn: ["A1"],
  async run(ctx: AgentContext) {
    const arch = ctx.prior.A1 as ArchitectOutput | undefined;
    const findings: AnalyzerFinding[] = [];
    if (!arch) return { output: { duplicates: 0, variants: 0 }, findings, warnings: ["A1 output missing"] };

    const seen = new Map<string, { filePath: string; line: number }>();
    const normalized = new Map<string, string[]>();
    let duplicates = 0;
    let variants = 0;

    for (const ep of arch.endpoints) {
      const key = `${ep.method.toUpperCase()} ${ep.endpoint}`;
      if (seen.has(key)) {
        duplicates += 1;
        const prior = seen.get(key)!;
        findings.push({
          id: `a2-dup-${Buffer.from(key).toString("hex").slice(0, 16)}`,
          ruleId: "api-drift-duplicate-route",
          severity: "high",
          title: `Duplicate route registration: ${key}`,
          summary: `The same METHOD+path is declared at ${prior.filePath}:${prior.line} and ${ep.filePath}:${ep.line}.`,
          filePath: ep.filePath,
          line: ep.line,
          endpoint: ep.endpoint,
          routeMethod: ep.method,
          evidence: `previous registration at ${prior.filePath}:${prior.line}`,
          impact: "Last registration silently overrides the earlier handler — behavior depends on file load order.",
          suggestedFix: "Remove or rename one of the duplicate handlers.",
          exploitSteps: []
        });
      } else {
        seen.set(key, { filePath: ep.filePath, line: ep.line });
      }

      const norm = `${ep.method.toUpperCase()} ${ep.endpoint.replace(/\/+$/, "").toLowerCase()}`;
      const list = normalized.get(norm) ?? [];
      list.push(key);
      normalized.set(norm, list);
    }

    for (const [norm, variantsList] of normalized) {
      const unique = [...new Set(variantsList)];
      if (unique.length > 1) {
        variants += 1;
        findings.push({
          id: `a2-var-${Buffer.from(norm).toString("hex").slice(0, 16)}`,
          ruleId: "api-drift-path-variant",
          severity: "medium",
          title: `Path variants for ${norm}`,
          summary: `Multiple casings/trailing-slash variants registered: ${unique.join(", ")}`,
          filePath: arch.endpoints[0]?.filePath ?? "unknown",
          line: arch.endpoints[0]?.line ?? 1,
          endpoint: norm.split(" ").slice(1).join(" "),
          routeMethod: norm.split(" ")[0] ?? "GET",
          evidence: unique.join(", "),
          impact: "Clients hit one variant or another based on URL hygiene; metrics and access logs split.",
          suggestedFix: "Normalize all routes to a single canonical lower-case form without trailing slashes.",
          exploitSteps: []
        });
      }
    }

    return { output: { duplicates, variants }, findings };
  }
};
