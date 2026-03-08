import type { Agent, AgentContext, AgentResult } from "./agent-contract";
import type { AnalyzerFinding, SourceFileInput } from "./index";

/**
 * AnalyzerRunner — executes a set of agents in dependency order, collects
 * their findings, and returns a structured pipeline result. The runner is
 * pure (no DB, no network) so it stays unit-testable. Persistence is the
 * caller's job — see apps/api/src/services/scanner-service.ts.
 *
 * ADR-003.
 */

export interface RunnerInput {
  organizationId: string;
  repositoryId: string;
  scanId: string;
  sourceFiles: SourceFileInput[];
}

export interface RunnerOutput {
  scanId: string;
  durationMs: number;
  agents: AgentResult[];
  findings: AnalyzerFinding[];
  warnings: string[];
}

function topoSort(agents: Agent[]): Agent[] {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const visited = new Set<string>();
  const out: Agent[] = [];
  const tempMark = new Set<string>();

  const visit = (a: Agent) => {
    if (visited.has(a.id)) return;
    if (tempMark.has(a.id)) {
      throw new Error(`AnalyzerRunner: circular dependency at agent ${a.id}`);
    }
    tempMark.add(a.id);
    for (const depId of a.dependsOn ?? []) {
      const dep = byId.get(depId);
      if (dep) visit(dep);
    }
    tempMark.delete(a.id);
    visited.add(a.id);
    out.push(a);
  };

  for (const a of agents) visit(a);
  return out;
}

export class AnalyzerRunner {
  constructor(private readonly agents: Agent[]) {}

  async run(input: RunnerInput): Promise<RunnerOutput> {
    const ordered = topoSort(this.agents);
    const startedAt = Date.now();
    const ctx: AgentContext = {
      organizationId: input.organizationId,
      repositoryId: input.repositoryId,
      scanId: input.scanId,
      sourceFiles: input.sourceFiles,
      prior: {}
    };

    const results: AgentResult[] = [];
    const findings: AnalyzerFinding[] = [];
    const warnings: string[] = [];

    for (const agent of ordered) {
      const t0 = Date.now();
      try {
        // A20 needs the running findings list; expose it under ctx.prior.findings.
        ctx.prior.findings = findings;
        const r = await agent.run(ctx);
        const result: AgentResult = {
          agentId: agent.id,
          ok: true,
          durationMs: Date.now() - t0,
          output: r.output,
          findings: r.findings,
          warnings: r.warnings ?? []
        };
        results.push(result);
        ctx.prior[agent.id] = r.output;
        findings.push(...r.findings);
        warnings.push(...result.warnings);
      } catch (err) {
        const e = err as Error;
        const error: { message: string; stack?: string } = { message: e.message };
        if (e.stack) error.stack = e.stack;
        results.push({
          agentId: agent.id,
          ok: false,
          durationMs: Date.now() - t0,
          output: null,
          findings: [],
          warnings: [],
          error
        });
        warnings.push(`agent ${agent.id} failed: ${e.message}`);
      }
    }

    return {
      scanId: input.scanId,
      durationMs: Date.now() - startedAt,
      agents: results,
      findings,
      warnings
    };
  }
}

/**
 * Convenience: the canonical agent set for v1 (all 20 agents in the
 * pipeline; A1 is structural, A7/A9/A10/A20 are the original cut, and
 * A2–A6/A8/A11–A19 extend the rule surface).
 */
export async function buildDefaultAgents(): Promise<Agent[]> {
  const [
    { a1Architect },
    { a2ApiDrift },
    { a3DataSensitivity },
    { a4SchemaRisk },
    { a5Performance },
    { a6ErrorHandling },
    { a7TenantLeak },
    { a8RateLimit },
    { a9AuthFlow },
    { a10DependencyThreat },
    { a11SecretScan },
    { a12License },
    { a13LogAudit },
    { a14CronAudit },
    { a15WebhookSig },
    { a16CorsCsp },
    { a17TestGap },
    { a18DocDrift },
    { a19Compliance },
    { a20PrContext }
  ] = await Promise.all([
    import("./agents/a1-architect"),
    import("./agents/a2-api-drift"),
    import("./agents/a3-data-sensitivity"),
    import("./agents/a4-schema-risk"),
    import("./agents/a5-performance"),
    import("./agents/a6-error-handling"),
    import("./agents/a7-tenant-leak"),
    import("./agents/a8-rate-limit"),
    import("./agents/a9-auth-flow"),
    import("./agents/a10-dependency-threat"),
    import("./agents/a11-secret-scan"),
    import("./agents/a12-license"),
    import("./agents/a13-log-audit"),
    import("./agents/a14-cron-audit"),
    import("./agents/a15-webhook-sig"),
    import("./agents/a16-cors-csp"),
    import("./agents/a17-test-gap"),
    import("./agents/a18-doc-drift"),
    import("./agents/a19-compliance"),
    import("./agents/a20-pr-context")
  ]);
  return [
    a1Architect,
    a2ApiDrift,
    a3DataSensitivity,
    a4SchemaRisk,
    a5Performance,
    a6ErrorHandling,
    a7TenantLeak,
    a8RateLimit,
    a9AuthFlow,
    a10DependencyThreat,
    a11SecretScan,
    a12License,
    a13LogAudit,
    a14CronAudit,
    a15WebhookSig,
    a16CorsCsp,
    a17TestGap,
    a18DocDrift,
    a19Compliance,
    a20PrContext
  ];
}
