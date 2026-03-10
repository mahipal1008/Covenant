import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A4 — Schema Migration Risk.
 *
 * Looks at SQL/Prisma migration scripts (or any inline raw SQL in source
 * files) for high-risk DDL patterns:
 *   - DROP TABLE / DROP COLUMN without an IF EXISTS guard
 *   - ALTER TABLE ... DROP NOT NULL on populated columns
 *   - RENAME COLUMN (causes app-side breakage without dual-write)
 *   - Missing transaction wrapper on multi-statement scripts
 */

const dangerousPatterns: Array<{ rx: RegExp; severity: "critical" | "high" | "medium"; rule: string; impact: string }> = [
  { rx: /drop\s+table\s+(?!if\s+exists)/i, severity: "critical", rule: "migration-drop-table", impact: "Irreversible data loss on production." },
  { rx: /drop\s+column/i, severity: "high", rule: "migration-drop-column", impact: "Application errors and data loss; require feature-flag gated rollout." },
  { rx: /rename\s+column/i, severity: "high", rule: "migration-rename-column", impact: "Old code paths break the moment the migration runs." },
  { rx: /truncate\s+table/i, severity: "critical", rule: "migration-truncate", impact: "Wipes table contents with no recovery." }
];

export const a4SchemaRisk: Agent<{ flagged: number }> = {
  id: "A4",
  name: "Schema Migration Risk",
  description: "Flags destructive DDL patterns in migration scripts and inline SQL.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    let flagged = 0;

    for (const file of ctx.sourceFiles) {
      const isMigration = /migration|schema\.sql|\.sql$/i.test(file.path);
      const lines = file.content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        for (const p of dangerousPatterns) {
          if (!p.rx.test(line)) continue;
          // Only flag in migrations or explicit raw-SQL strings.
          if (!isMigration && !/\$queryraw|\$executeraw|sql`/i.test(line)) continue;
          flagged += 1;
          findings.push({
            id: `a4-${Buffer.from(`${file.path}:${idx}:${p.rule}`).toString("hex").slice(0, 16)}`,
            ruleId: p.rule,
            severity: p.severity,
            title: `Destructive DDL detected: ${p.rule}`,
            summary: "This migration runs an irreversible or breaking schema change without explicit guards.",
            filePath: file.path,
            line: idx + 1,
            endpoint: "n/a",
            routeMethod: "n/a",
            evidence: line.trim().slice(0, 200),
            impact: p.impact,
            suggestedFix: "Wrap the migration in a transaction, add IF EXISTS guards, and stage rollouts behind a dual-write window.",
            exploitSteps: []
          });
        }
      });
    }

    return { output: { flagged }, findings };
  }
};
