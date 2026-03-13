import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A12 — License Compliance.
 *
 * Reads any package.json files in the source set, extracts dependency
 * names + their declared license (when the manifest carries one inline),
 * and flags strong-copyleft / unknown licenses that may conflict with the
 * application's own license. This is a coarse first pass; deep scanning
 * (license-checker, scancode) belongs in CI.
 */

const restrictiveLicenses = /^(GPL|AGPL|SSPL|RPL|EUPL)/i;
const noticeLicenses = /^(MPL|EPL|CDDL)/i;

export const a12License: Agent<{ flagged: number }> = {
  id: "A12",
  name: "License Compliance",
  description: "Flags dependencies declaring strong-copyleft or notice-required licenses.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    let flagged = 0;

    for (const file of ctx.sourceFiles) {
      if (!/package\.json$/i.test(file.path)) continue;
      let manifest: { license?: string; dependencies?: Record<string, string>; name?: string };
      try {
        manifest = JSON.parse(file.content);
      } catch {
        continue;
      }
      const license = manifest.license ?? "UNKNOWN";

      if (restrictiveLicenses.test(license) || noticeLicenses.test(license) || license === "UNKNOWN") {
        flagged += 1;
        const severity = restrictiveLicenses.test(license) ? "high" : license === "UNKNOWN" ? "medium" : "low";
        findings.push({
          id: `a12-${Buffer.from(`${file.path}:${license}`).toString("hex").slice(0, 16)}`,
          ruleId: `license-${license.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          severity,
          title: `License ${license} on ${manifest.name ?? file.path}`,
          summary: `Package declares ${license}; review whether the application's distribution model is compatible.`,
          filePath: file.path,
          line: 1,
          endpoint: "n/a",
          routeMethod: "n/a",
          evidence: `"license": ${JSON.stringify(license)}`,
          impact: restrictiveLicenses.test(license)
            ? "Linking strong-copyleft code into a closed-source product can force source disclosure."
            : license === "UNKNOWN"
              ? "Unknown license = no usage rights. Production use is at risk."
              : "Notice/attribution requirements must be satisfied in the distributed product.",
          suggestedFix: "Replace with a permissively-licensed equivalent or obtain a commercial license; document attribution.",
          exploitSteps: []
        });
      }
    }

    return { output: { flagged }, findings };
  }
};
