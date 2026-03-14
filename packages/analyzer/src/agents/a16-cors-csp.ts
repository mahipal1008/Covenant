import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A16 — CORS / CSP Misconfiguration.
 *
 * Inspects source for two browser-security smells:
 *   - cors({ origin: '*' }) or `Access-Control-Allow-Origin: *` while the
 *     same file/server registers cookies / credentials.
 *   - Content-Security-Policy headers that include `unsafe-inline` or
 *     `unsafe-eval` in script-src.
 */
export const a16CorsCsp: Agent<{ smells: number }> = {
  id: "A16",
  name: "CORS / CSP Misconfiguration",
  description: "Flags wildcard CORS with credentials and unsafe CSP directives.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    let smells = 0;

    for (const file of ctx.sourceFiles) {
      const text = file.content;
      const lines = text.split(/\r?\n/);

      const wildcardCors = /origin\s*:\s*['"`]\*['"`]/.test(text) || /Access-Control-Allow-Origin\s*:\s*\*/i.test(text);
      const credentials = /credentials\s*:\s*true/.test(text);
      if (wildcardCors && credentials) {
        smells += 1;
        const idx = lines.findIndex((l) => /origin\s*:\s*['"`]\*['"`]/.test(l) || /Access-Control-Allow-Origin/i.test(l));
        findings.push({
          id: `a16-cors-${Buffer.from(file.path).toString("hex").slice(0, 16)}`,
          ruleId: "cors-wildcard-with-credentials",
          severity: "high",
          title: "Wildcard CORS combined with credentials",
          summary: "origin '*' with credentials true is rejected by browsers and indicates a confused config.",
          filePath: file.path,
          line: idx >= 0 ? idx + 1 : 1,
          endpoint: "n/a",
          routeMethod: "n/a",
          evidence: "origin: '*' + credentials: true",
          impact: "Either the config is silently broken or, if a custom proxy strips the rejection, cross-site cookie theft.",
          suggestedFix: "Pin origin to an explicit allow-list and keep credentials only for those origins.",
          exploitSteps: []
        });
      }

      lines.forEach((line, idx) => {
        if (/content-security-policy/i.test(line) && /(unsafe-inline|unsafe-eval)/i.test(line)) {
          smells += 1;
          findings.push({
            id: `a16-csp-${Buffer.from(`${file.path}:${idx}`).toString("hex").slice(0, 16)}`,
            ruleId: "csp-unsafe-directive",
            severity: "medium",
            title: "CSP allows unsafe-inline or unsafe-eval",
            summary: "Either directive defeats the main XSS defense provided by CSP.",
            filePath: file.path,
            line: idx + 1,
            endpoint: "n/a",
            routeMethod: "n/a",
            evidence: line.trim().slice(0, 200),
            impact: "Single XSS escalates to full account takeover via inline script execution.",
            suggestedFix: "Adopt nonce-based CSP and remove unsafe-* tokens from script-src.",
            exploitSteps: []
          });
        }
      });
    }

    return { output: { smells }, findings };
  }
};
