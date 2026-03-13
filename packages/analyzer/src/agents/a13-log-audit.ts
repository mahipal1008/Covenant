import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A13 — Logging PII Auditor.
 *
 * Catches `console.log` / `logger.info` calls that interpolate request
 * bodies or known PII identifiers (email, password, token, ssn, phone).
 * Structured logs with explicit redaction config (`redact:`) are exempt.
 */
const piiInLog = /(password|token|secret|ssn|creditCard|email|phone|otp|jwt|sessionId)/i;
const logCallSites = /(console\.(log|info|debug|warn|error)|logger\.(log|info|debug|warn|error|trace)|app\.log\.(info|debug|warn|error))\s*\(/i;

export const a13LogAudit: Agent<{ unsafeLogs: number }> = {
  id: "A13",
  name: "Logging PII Auditor",
  description: "Detects log statements that may print PII or secrets.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    let unsafeLogs = 0;

    for (const file of ctx.sourceFiles) {
      const lines = file.content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (!logCallSites.test(line)) return;
        if (!piiInLog.test(line)) return;
        // Allow if the same line declares a redaction marker.
        if (/redact|\[REDACTED\]|\*\*\*/.test(line)) return;
        unsafeLogs += 1;
        findings.push({
          id: `a13-${Buffer.from(`${file.path}:${idx}`).toString("hex").slice(0, 16)}`,
          ruleId: "log-pii-leak",
          severity: "medium",
          title: "Log statement may print PII or secret",
          summary: "Log call interpolates an identifier that matches a PII/secret pattern without a redaction hint.",
          filePath: file.path,
          line: idx + 1,
          endpoint: "n/a",
          routeMethod: "n/a",
          evidence: line.trim().slice(0, 200),
          impact: "Logs persist longer and propagate further than the request body. PII in logs is a GDPR breach.",
          suggestedFix: "Use pino's `redact` option or replace the field with `[REDACTED]` before logging.",
          exploitSteps: []
        });
      });
    }

    return { output: { unsafeLogs }, findings };
  }
};
