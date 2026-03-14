import type { Agent, AgentContext, PrContextOutput } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A20 — PR Context Enricher.
 *
 * Aggregates findings from upstream agents and renders a structured PR
 * comment payload. Posting to GitHub is intentionally out of scope —
 * that's a deferred infrastructure step. This agent's job is to compute
 * the decision (approve / warn / block) and the human-readable blocks.
 */

export const a20PrContext: Agent<PrContextOutput> = {
  id: "A20",
  name: "PR Context Enricher",
  description: "Builds the merge-gate decision and PR comment payload from upstream findings.",
  dependsOn: ["A1", "A7", "A9", "A10"],
  async run(ctx: AgentContext) {
    // Collect findings from earlier agents. The runner exposes them under
    // ctx.prior[<agentId>] but the structured findings list is built by
    // the runner itself; we accept it via ctx.prior.findings.
    const findings = (ctx.prior.findings as AnalyzerFinding[] | undefined) ?? [];

    const critical = findings.filter((f) => f.severity === "critical");
    const high = findings.filter((f) => f.severity === "high");
    const decision: PrContextOutput["decision"] =
      critical.length > 0 ? "block" : high.length > 0 ? "warn" : "approve";

    const blocks: PrContextOutput["blocks"] = [
      {
        kind: "summary",
        text:
          decision === "block"
            ? `🔴 Covenant is blocking this PR — ${critical.length} critical issue${critical.length === 1 ? "" : "s"} must be resolved.`
            : decision === "warn"
              ? `🟡 Covenant has ${high.length} high-severity finding${high.length === 1 ? "" : "s"} on this PR.`
              : "🟢 No critical or high-severity findings — Covenant is happy to merge."
      }
    ];

    for (const f of [...critical, ...high].slice(0, 5)) {
      blocks.push({
        kind: "finding",
        text: `**${f.severity.toUpperCase()}** ${f.title} — \`${f.filePath}:${f.line}\` — ${f.suggestedFix}`
      });
    }

    if (decision !== "approve") {
      blocks.push({
        kind: "next-step",
        text: "Run `covenant scan --fix` locally to apply auto-fix suggestions, or open the Covenant dashboard for full evidence."
      });
    }

    return {
      output: {
        decision,
        blocks,
        blockingFindingIds: critical.map((f) => f.id)
      },
      findings: []
    };
  }
};
