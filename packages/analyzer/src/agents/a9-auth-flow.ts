import type { Agent, AgentContext, ArchitectOutput } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A9 — Auth Flow Auditor.
 *
 * Reads A1's `authChecks` and raises a finding for every endpoint marked
 * `unprotected` whose path looks privileged (writes, admin paths, exports,
 * billing, internal). Public-looking GETs (health, status, public, openapi)
 * are intentionally allow-listed.
 */
const allowList = [/^\/api\/health/i, /^\/api\/status/i, /^\/api\/public/i, /^\/api\/openapi/i, /^\/openapi/i];
const privilegedPath = /(admin|export|invoice|billing|payout|payment|internal|webhook|delete)/i;

export const a9AuthFlow: Agent<{ unprotectedCount: number }> = {
  id: "A9",
  name: "Auth Flow Auditor",
  description: "Flags privileged endpoints exposed without an authentication middleware.",
  dependsOn: ["A1"],
  async run(ctx: AgentContext) {
    const arch = ctx.prior.A1 as ArchitectOutput | undefined;
    const findings: AnalyzerFinding[] = [];
    if (!arch) {
      return { output: { unprotectedCount: 0 }, findings, warnings: ["A1 output missing"] };
    }

    for (const check of arch.authChecks) {
      if (check.authStatus !== "unprotected") continue;
      if (allowList.some((rx) => rx.test(check.endpoint))) continue;
      const isWrite = check.method !== "GET";
      const looksPrivileged = privilegedPath.test(check.endpoint);
      if (!isWrite && !looksPrivileged) continue;

      findings.push({
        id: `a9-${Buffer.from(`${check.method}${check.endpoint}`).toString("hex").slice(0, 16)}`,
        ruleId: "auth-missing-middleware",
        severity: looksPrivileged ? "critical" : "high",
        title: `${check.method} ${check.endpoint} has no authentication middleware`,
        summary:
          "The route handler is registered without any of the recognized auth middlewares (requireAuth/requireUser/requireAdmin/...).",
        filePath: check.filePath,
        line: check.line,
        endpoint: check.endpoint,
        routeMethod: check.method,
        evidence: `middlewares: [${check.middlewares.join(", ") || "(none)"}]`,
        impact: looksPrivileged
          ? "Unauthenticated access to a privileged surface (admin, billing, exports, internal)."
          : "Unauthenticated mutation of application state.",
        suggestedFix: `Add an auth middleware (e.g. requireAuth) before the handler at ${check.filePath}:${check.line}.`,
        exploitSteps: [
          `curl ${check.method.toLowerCase()} ${check.endpoint} (no Authorization header)`,
          "Observe a 200 response that should have been 401"
        ]
      });
    }

    return { output: { unprotectedCount: findings.length }, findings };
  }
};
