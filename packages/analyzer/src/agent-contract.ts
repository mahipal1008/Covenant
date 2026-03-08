import type { AnalyzerFinding, EndpointTrace, QueryTrace, AuthCheck, SourceFileInput } from "./index";

/**
 * Agent contract — ADR-003.
 *
 * Every Covenant agent implements `Agent<TInput, TOutput>`. The runner feeds
 * each agent the same `AgentContext` (org, repo, source files, prior agent
 * outputs) and collects `AgentResult` objects. Agents are pure functions of
 * their context — they MUST NOT touch the database directly. Persistence is
 * the runner's responsibility (see AnalyzerRunner).
 */

export interface AgentContext {
  organizationId: string;
  repositoryId: string;
  scanId: string;
  sourceFiles: SourceFileInput[];
  /** Map of agentId -> output, populated by the runner as agents complete. */
  prior: Record<string, unknown>;
}

export interface AgentResult<TOutput = unknown> {
  agentId: string;
  ok: boolean;
  durationMs: number;
  output: TOutput;
  findings: AnalyzerFinding[];
  warnings: string[];
  error?: { message: string; stack?: string };
}

export interface Agent<TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /**
   * Some agents depend on others (e.g. A7 reads A1's endpoint map). The
   * runner sorts agents into dependency order before executing.
   */
  readonly dependsOn?: string[];
  run(ctx: AgentContext): Promise<{ output: TOutput; findings: AnalyzerFinding[]; warnings?: string[] }>;
}

export type ArchitectOutput = {
  endpoints: EndpointTrace[];
  queries: QueryTrace[];
  authChecks: AuthCheck[];
};

export type DependencyAlert = {
  ecosystem: string;
  packageName: string;
  installedVersion: string;
  cveId: string;
  severity: "critical" | "high" | "medium" | "low";
  fixedVersion: string | null;
  url: string;
};

export type DependencyOutput = {
  scanned: number;
  alerts: DependencyAlert[];
  source: "osv-scanner" | "fixture";
};

export type PrCommentBlock = {
  kind: "summary" | "finding" | "next-step";
  text: string;
};

export type PrContextOutput = {
  decision: "approve" | "block" | "warn";
  blocks: PrCommentBlock[];
  blockingFindingIds: string[];
};
