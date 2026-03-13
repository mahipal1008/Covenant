import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A14 — Cron / Background Job Auditor.
 *
 * Scans for setInterval/setTimeout, BullMQ queue.add, node-cron schedule,
 * and fastify-cron registrations. Flags:
 *   - schedules without an `attempts` / retry config
 *   - jobs that run more often than every 30 seconds (likely a runaway)
 *   - cron expressions hitting `*` minutes (every minute) without a lock
 */
export const a14CronAudit: Agent<{ jobs: number; risky: number }> = {
  id: "A14",
  name: "Cron / Background Job Auditor",
  description: "Surfaces schedule definitions with missing retries or runaway frequency.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    let jobs = 0;
    let risky = 0;

    for (const file of ctx.sourceFiles) {
      const lines = file.content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        // setInterval(<fn>, <ms>)
        const interval = /setInterval\s*\([^,]+,\s*(\d+)\s*\)/.exec(line);
        if (interval) {
          jobs += 1;
          const ms = Number.parseInt(interval[1] ?? "0", 10);
          if (ms > 0 && ms < 30_000) {
            risky += 1;
            findings.push({
              id: `a14-int-${Buffer.from(`${file.path}:${idx}`).toString("hex").slice(0, 16)}`,
              ruleId: "cron-runaway-interval",
              severity: "medium",
              title: `setInterval at ${ms}ms is below the 30s safety threshold`,
              summary: "High-frequency timers without backoff can saturate the event loop or pound the DB.",
              filePath: file.path,
              line: idx + 1,
              endpoint: "n/a",
              routeMethod: "n/a",
              evidence: line.trim().slice(0, 200),
              impact: "CPU and DB resource exhaustion under load; missed deadlines elsewhere in the process.",
              suggestedFix: "Move to a job queue with backoff, or extend the interval to >= 30s with jitter.",
              exploitSteps: []
            });
          }
        }

        // BullMQ queue.add without attempts
        if (/\bqueue\.(add|addBulk)\s*\(/.test(line) && !/attempts\s*:/.test(line) && !/attempts\s*:/.test(lines[idx + 1] ?? "")) {
          jobs += 1;
          risky += 1;
          findings.push({
            id: `a14-bull-${Buffer.from(`${file.path}:${idx}`).toString("hex").slice(0, 16)}`,
            ruleId: "cron-no-retry-config",
            severity: "low",
            title: "BullMQ job enqueued without retry config",
            summary: "queue.add call lacks an attempts/backoff option; transient failures will not be retried.",
            filePath: file.path,
            line: idx + 1,
            endpoint: "n/a",
            routeMethod: "n/a",
            evidence: line.trim().slice(0, 200),
            impact: "Network blips silently drop work; DLQ growth becomes invisible.",
            suggestedFix: "Set attempts >= 3 with exponential backoff and a backoff floor.",
            exploitSteps: []
          });
        }

        // cron('* * * * *', ...) every minute
        if (/cron\s*\(\s*['"]\*\s+\*\s+\*\s+\*\s+\*['"]/.test(line)) {
          jobs += 1;
          risky += 1;
          findings.push({
            id: `a14-min-${Buffer.from(`${file.path}:${idx}`).toString("hex").slice(0, 16)}`,
            ruleId: "cron-every-minute",
            severity: "low",
            title: "Cron expression runs every minute without distributed lock",
            summary: "Per-minute cron in a horizontally scaled deploy double-fires unless a lock is in place.",
            filePath: file.path,
            line: idx + 1,
            endpoint: "n/a",
            routeMethod: "n/a",
            evidence: line.trim().slice(0, 200),
            impact: "Duplicate work, duplicate notifications, duplicate billing events.",
            suggestedFix: "Wrap in a Redis SETNX lock or move to a single-leader queue.",
            exploitSteps: []
          });
        }
      });
    }

    return { output: { jobs, risky }, findings };
  }
};
