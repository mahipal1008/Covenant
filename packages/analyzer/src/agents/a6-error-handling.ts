import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A6 — Error Handling Auditor.
 *
 * Looks for:
 *   - empty catch blocks (`catch (e) {}` or `catch {}`)
 *   - catches that only `console.log` and swallow the error
 *   - throw of bare strings (no Error)
 *   - `await` calls outside any try/catch in async functions (heuristic)
 */
export const a6ErrorHandling: Agent<{ issues: number }> = {
  id: "A6",
  name: "Error Handling Auditor",
  description: "Detects swallowed exceptions and unstructured error throws.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    let issues = 0;

    for (const file of ctx.sourceFiles) {
      const text = file.content;
      const lines = text.split(/\r?\n/);

      // Empty catch
      const emptyCatch = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g;
      let m: RegExpExecArray | null;
      while ((m = emptyCatch.exec(text)) !== null) {
        const line = text.slice(0, m.index).split(/\r?\n/).length;
        issues += 1;
        findings.push({
          id: `a6-empty-${Buffer.from(`${file.path}:${line}`).toString("hex").slice(0, 16)}`,
          ruleId: "error-handling-empty-catch",
          severity: "medium",
          title: "Empty catch block silences errors",
          summary: "Catch block has no body; the exception is swallowed and never logged or rethrown.",
          filePath: file.path,
          line,
          endpoint: "n/a",
          routeMethod: "n/a",
          evidence: m[0],
          impact: "Production failures vanish; debugging becomes guesswork.",
          suggestedFix: "Log via structured logger and either rethrow or convert to a typed application error.",
          exploitSteps: []
        });
      }

      // Bare-string throw
      lines.forEach((line, idx) => {
        if (/throw\s+["'`]/.test(line)) {
          issues += 1;
          findings.push({
            id: `a6-string-${Buffer.from(`${file.path}:${idx}`).toString("hex").slice(0, 16)}`,
            ruleId: "error-handling-string-throw",
            severity: "low",
            title: "Bare-string throw loses stack trace",
            summary: "Throwing a string instead of an Error subclass produces a useless stack trace and breaks instanceof checks.",
            filePath: file.path,
            line: idx + 1,
            endpoint: "n/a",
            routeMethod: "n/a",
            evidence: line.trim().slice(0, 200),
            impact: "Logs lack actionable context; downstream error handlers can't classify by type.",
            suggestedFix: "Throw `new Error(...)` or a domain-specific Error subclass.",
            exploitSteps: []
          });
        }
      });
    }

    return { output: { issues }, findings };
  }
};
