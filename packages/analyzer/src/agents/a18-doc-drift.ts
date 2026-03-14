import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A18 — Documentation Drift.
 *
 * Counts TODO / FIXME / HACK / XXX markers and flags files where the
 * marker density is high enough to suggest the code has drifted from its
 * original design intent. Also catches stale dates ("@deprecated since
 * 2022-...") that have outlived a 12-month grace window.
 */
export const a18DocDrift: Agent<{ markers: number; deprecated: number }> = {
  id: "A18",
  name: "Documentation Drift",
  description: "Surfaces high TODO density and long-overdue @deprecated markers.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    const markerRx = /\b(TODO|FIXME|HACK|XXX)\b/g;
    const deprecatedRx = /@deprecated\b[^\n]*?\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/;
    const now = new Date();
    let markers = 0;
    let deprecated = 0;

    for (const file of ctx.sourceFiles) {
      if (!/\.(ts|tsx|js|jsx|md)$/i.test(file.path)) continue;
      const lines = file.content.split(/\r?\n/);
      let perFileMarkers = 0;
      let firstMarkerLine = 0;

      lines.forEach((line, idx) => {
        const matches = line.match(markerRx);
        if (matches) {
          perFileMarkers += matches.length;
          if (!firstMarkerLine) firstMarkerLine = idx + 1;
        }
        const dep = deprecatedRx.exec(line);
        if (dep) {
          const since = new Date(`${dep[1]}-${dep[2]}-${dep[3]}T00:00:00Z`);
          const ageDays = (now.getTime() - since.getTime()) / 86_400_000;
          if (ageDays > 365) {
            deprecated += 1;
            findings.push({
              id: `a18-dep-${Buffer.from(`${file.path}:${idx}`).toString("hex").slice(0, 16)}`,
              ruleId: "doc-deprecated-overdue",
              severity: "low",
              title: `@deprecated marker > 1 year old`,
              summary: `Marker dated ${dep[1]}-${dep[2]}-${dep[3]} is past its 365-day grace period.`,
              filePath: file.path,
              line: idx + 1,
              endpoint: "n/a",
              routeMethod: "n/a",
              evidence: line.trim().slice(0, 200),
              impact: "Code that was supposed to be removed is still on the hot path; downstream callers continue to depend on it.",
              suggestedFix: "Either remove the deprecated symbol or refresh the deprecation date with a new sunset plan.",
              exploitSteps: []
            });
          }
        }
      });

      markers += perFileMarkers;
      if (perFileMarkers >= 5) {
        findings.push({
          id: `a18-todo-${Buffer.from(file.path).toString("hex").slice(0, 16)}`,
          ruleId: "doc-todo-density",
          severity: "low",
          title: `${perFileMarkers} TODO/FIXME markers in ${file.path}`,
          summary: "Concentrated technical-debt markers indicate drift between code and documentation.",
          filePath: file.path,
          line: firstMarkerLine || 1,
          endpoint: "n/a",
          routeMethod: "n/a",
          evidence: `${perFileMarkers} markers`,
          impact: "Onboarding friction; small bugs accumulate behind the markers.",
          suggestedFix: "Convert each marker to a tracked issue or close it out as completed work.",
          exploitSteps: []
        });
      }
    }

    return { output: { markers, deprecated }, findings };
  }
};
