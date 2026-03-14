import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A19 — Compliance Mapping.
 *
 * Aggregates the findings raised by upstream agents and projects them
 * onto a small set of compliance frameworks (SOC2, ISO27001, PCI-DSS,
 * GDPR, HIPAA). The mapping is rule-id-based and intentionally narrow —
 * the dashboard surfaces it as "controls touched by this scan", not as
 * an audit substitute.
 */

const ruleToControls: Array<{ match: RegExp; frameworks: string[] }> = [
  { match: /^secret-/, frameworks: ["SOC2-CC6.1", "ISO27001-A.9.4.3", "PCI-DSS-3.4"] },
  { match: /^auth-/, frameworks: ["SOC2-CC6.1", "ISO27001-A.9.2", "PCI-DSS-8.1"] },
  { match: /^tenant-/, frameworks: ["SOC2-CC6.6", "GDPR-Art32", "HIPAA-164.312(a)"] },
  { match: /^data-sensitivity/, frameworks: ["GDPR-Art32", "HIPAA-164.312(e)", "PCI-DSS-3.4"] },
  { match: /^migration-/, frameworks: ["SOC2-CC8.1", "ISO27001-A.12.1.2"] },
  { match: /^cors-|^csp-/, frameworks: ["SOC2-CC6.7", "OWASP-A05"] },
  { match: /^webhook-/, frameworks: ["SOC2-CC6.7", "OWASP-A02"] },
  { match: /^perf-/, frameworks: ["SOC2-A1.1"] },
  { match: /^abuse-/, frameworks: ["SOC2-CC6.6", "OWASP-A07"] },
  { match: /^log-pii/, frameworks: ["GDPR-Art5", "HIPAA-164.312(b)"] },
  { match: /^license-/, frameworks: ["ISO27001-A.18.1.2"] }
];

export type ComplianceMappingOutput = {
  mappings: Array<{ ruleId: string; frameworks: string[]; count: number }>;
  frameworks: Record<string, number>;
};

export const a19Compliance: Agent<ComplianceMappingOutput> = {
  id: "A19",
  name: "Compliance Mapping",
  description: "Projects rule IDs to SOC2 / ISO27001 / PCI / GDPR / HIPAA / OWASP controls.",
  // Runs after the rule-emitting agents.
  dependsOn: ["A1", "A7", "A9", "A11", "A14", "A16"],
  async run(ctx: AgentContext) {
    const priorFindings = (ctx.prior.findings as AnalyzerFinding[] | undefined) ?? [];
    const ruleCounts = new Map<string, number>();
    for (const f of priorFindings) {
      ruleCounts.set(f.ruleId, (ruleCounts.get(f.ruleId) ?? 0) + 1);
    }

    const mappings: ComplianceMappingOutput["mappings"] = [];
    const frameworks: Record<string, number> = {};
    for (const [ruleId, count] of ruleCounts) {
      const matched = ruleToControls.find((m) => m.match.test(ruleId));
      if (!matched) continue;
      mappings.push({ ruleId, frameworks: matched.frameworks, count });
      for (const fw of matched.frameworks) {
        frameworks[fw] = (frameworks[fw] ?? 0) + count;
      }
    }

    return { output: { mappings, frameworks }, findings: [] };
  }
};
