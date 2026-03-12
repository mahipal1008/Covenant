import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A11 — Secret Leak Scanner.
 *
 * Pure-regex pass over source files for high-confidence secret patterns.
 * The intent is parity with gitleaks for live-edit feedback inside
 * Covenant — we don't replace gitleaks in CI, but we surface the same
 * issues on every scan.
 */
const secretPatterns: Array<{ rx: RegExp; rule: string; severity: "critical" | "high" }> = [
  { rx: /AKIA[0-9A-Z]{16}/, rule: "secret-aws-access-key", severity: "critical" },
  { rx: /AIza[0-9A-Za-z_-]{35}/, rule: "secret-google-api-key", severity: "high" },
  { rx: /sk_live_[0-9a-zA-Z]{24,}/, rule: "secret-stripe-live", severity: "critical" },
  { rx: /sk_test_[0-9a-zA-Z]{24,}/, rule: "secret-stripe-test", severity: "high" },
  { rx: /xox[baprs]-[0-9a-zA-Z-]{10,}/, rule: "secret-slack-token", severity: "high" },
  { rx: /ghp_[0-9A-Za-z]{36}/, rule: "secret-github-pat", severity: "critical" },
  { rx: /-----BEGIN (RSA|EC|OPENSSH|PRIVATE) (PRIVATE )?KEY-----/, rule: "secret-private-key-block", severity: "critical" }
];

export const a11SecretScan: Agent<{ leaked: number }> = {
  id: "A11",
  name: "Secret Leak Scanner",
  description: "Regex-based pass for committed AWS / Google / Stripe / GitHub / Slack secrets.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    let leaked = 0;

    for (const file of ctx.sourceFiles) {
      // Skip well-known fixture/test files to reduce noise; CI gitleaks
      // covers the actual repo.
      const lines = file.content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        for (const p of secretPatterns) {
          const m = p.rx.exec(line);
          if (!m) continue;
          leaked += 1;
          findings.push({
            id: `a11-${Buffer.from(`${file.path}:${idx}:${p.rule}`).toString("hex").slice(0, 16)}`,
            ruleId: p.rule,
            severity: p.severity,
            title: `Possible secret of type ${p.rule}`,
            summary: "A token-shaped string was found in source. Even if scoped to dev, rotate it and load from env.",
            filePath: file.path,
            line: idx + 1,
            endpoint: "n/a",
            routeMethod: "n/a",
            evidence: line.replace(m[0], `${m[0].slice(0, 4)}…${m[0].slice(-4)}`).trim().slice(0, 200),
            impact: "Committed credentials enable account takeover or service impersonation as soon as the repo leaks.",
            suggestedFix: "Rotate the secret immediately, scrub git history with git-filter-repo, and load from env or a secrets manager.",
            exploitSteps: ["Clone the repo", "Extract the secret", "Authenticate against the third-party service"]
          });
        }
      });
    }

    return { output: { leaked }, findings };
  }
};
