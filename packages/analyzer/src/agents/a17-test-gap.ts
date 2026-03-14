import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A17 — Test Coverage Gap.
 *
 * Heuristic only — counts `*.test.*`/`*.spec.*` files vs. non-test source
 * files in the same directory tree and flags directories with a low
 * test-to-source ratio.
 */
export const a17TestGap: Agent<{ directories: number; gaps: number }> = {
  id: "A17",
  name: "Test Coverage Gap",
  description: "Flags source directories with a low test-file ratio.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    const buckets = new Map<string, { source: number; test: number; firstSource?: string }>();

    for (const file of ctx.sourceFiles) {
      if (!/\.(ts|tsx|js|jsx)$/i.test(file.path)) continue;
      const dir = file.path.replace(/[\\/][^\\/]+$/, "");
      const slot = buckets.get(dir) ?? { source: 0, test: 0 };
      if (/\.(test|spec)\.[tj]sx?$/i.test(file.path)) slot.test += 1;
      else {
        slot.source += 1;
        slot.firstSource ??= file.path;
      }
      buckets.set(dir, slot);
    }

    let gaps = 0;
    for (const [dir, counts] of buckets) {
      if (counts.source < 3) continue;
      const ratio = counts.test / counts.source;
      if (ratio >= 0.3) continue;
      gaps += 1;
      findings.push({
        id: `a17-${Buffer.from(dir).toString("hex").slice(0, 16)}`,
        ruleId: "coverage-low-test-ratio",
        severity: "low",
        title: `Low test density in ${dir}`,
        summary: `Test-to-source ratio in this directory is ${(ratio * 100).toFixed(0)}% (${counts.test}/${counts.source}).`,
        filePath: counts.firstSource ?? dir,
        line: 1,
        endpoint: "n/a",
        routeMethod: "n/a",
        evidence: `${counts.test} tests for ${counts.source} sources`,
        impact: "Regression risk on changes; bugs surface only in production.",
        suggestedFix: "Add at least one happy-path + one sad-path test per source file in this directory.",
        exploitSteps: []
      });
    }

    return { output: { directories: buckets.size, gaps }, findings };
  }
};
