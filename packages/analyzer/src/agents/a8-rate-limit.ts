import type { Agent, AgentContext, ArchitectOutput } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A8 — Rate Limit / Abuse Surface Auditor.
 *
 * Cross-references A1's endpoints with whether the source file references
 * a rate-limit primitive (`@fastify/rate-limit`, `rateLimit(`, custom
 * `requireQuota`, etc.). Endpoints that look abuse-prone (auth, signup,
 * password reset, search, send/email/sms) without any rate-limit hint are
 * flagged.
 */
const abuseSurfacePattern = /(login|signup|register|password|reset|forgot|verify|otp|search|send|email|sms|invite|webhook)/i;
const rateLimitPattern = /rate[\s_-]?limit|requireQuota|throttle|@fastify\/rate-limit|rateLimitPlugin/i;

export const a8RateLimit: Agent<{ unprotectedSurfaces: number }> = {
  id: "A8",
  name: "Rate Limit / Abuse Surface Auditor",
  description: "Flags abuse-prone endpoints lacking rate-limit primitives.",
  dependsOn: ["A1"],
  async run(ctx: AgentContext) {
    const arch = ctx.prior.A1 as ArchitectOutput | undefined;
    const findings: AnalyzerFinding[] = [];
    if (!arch) return { output: { unprotectedSurfaces: 0 }, findings, warnings: ["A1 output missing"] };

    const filesWithRateLimit = new Set(
      ctx.sourceFiles.filter((f) => rateLimitPattern.test(f.content)).map((f) => f.path)
    );

    let unprotected = 0;
    for (const ep of arch.endpoints) {
      if (!abuseSurfacePattern.test(ep.endpoint)) continue;
      if (filesWithRateLimit.has(ep.filePath)) continue;
      unprotected += 1;
      findings.push({
        id: `a8-${Buffer.from(`${ep.method}:${ep.endpoint}`).toString("hex").slice(0, 16)}`,
        ruleId: "abuse-surface-no-rate-limit",
        severity: "high",
        title: `${ep.method} ${ep.endpoint} is abuse-prone with no rate-limit hint`,
        summary: "Endpoint pattern matches a known abuse surface (auth, search, send) and the source file references no rate-limit primitive.",
        filePath: ep.filePath,
        line: ep.line,
        endpoint: ep.endpoint,
        routeMethod: ep.method,
        evidence: `no match for ${rateLimitPattern}`,
        impact: "Brute force, enumeration, or amplification attacks have no automatic backstop.",
        suggestedFix: "Register @fastify/rate-limit on the route or wrap the handler in a quota middleware.",
        exploitSteps: [
          `Loop ${ep.method} ${ep.endpoint} from a single IP at high rate`,
          "Observe no 429 response"
        ]
      });
    }

    return { output: { unprotectedSurfaces: unprotected }, findings };
  }
};
