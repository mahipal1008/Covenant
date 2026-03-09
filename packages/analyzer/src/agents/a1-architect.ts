import { scanSourceFiles } from "../index";
import type { Agent, AgentContext, ArchitectOutput } from "../agent-contract";

/**
 * A1 — Architect.
 *
 * Walks the TS AST (via the existing `scanSourceFiles` analyzer) and emits
 * the endpoint/query/auth maps that downstream agents consume. This is the
 * deepest dependency in the pipeline — everything tenant- or auth-related
 * reads from A1's output.
 */
export const a1Architect: Agent<ArchitectOutput> = {
  id: "A1",
  name: "Architect",
  description: "Builds the endpoint, query, and auth maps from the TS Compiler API.",
  async run(ctx: AgentContext) {
    const result = scanSourceFiles(ctx.sourceFiles);
    return {
      output: {
        endpoints: result.endpointTraces,
        queries: result.queryTraces,
        authChecks: result.authChecks
      },
      findings: [] // A1 is a structural pass; A7/A9 raise findings on its output.
    };
  }
};
