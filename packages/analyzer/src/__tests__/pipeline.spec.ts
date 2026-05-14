import { describe, expect, test } from "vitest";
import { AnalyzerRunner, buildDefaultAgents, demoSourceFiles, type SourceFileInput } from "../index";

/**
 * Vitest coverage spec — exercises every agent in the default set with
 * a fixture tailored to trigger its rule. This is the canonical "every
 * agent runs" smoke + assertion suite that feeds the coverage gate.
 */

const fixture: SourceFileInput[] = [
  ...demoSourceFiles,
  { path: "src/routes/dup.ts", content: `app.get("/v1/x", a); app.get("/v1/x", b); app.get("/v1/X", c);` },
  { path: "src/models/profile.ts", content: `interface P { ssn: string; creditCard: string; } logger.info({ password: x });` },
  { path: "prisma/migrations/m/migration.sql", content: `DROP TABLE foo; ALTER TABLE bar DROP COLUMN baz;` },
  { path: "src/routes/perf.ts", content: `app.get("/v1/p", async () => { await prisma.a.findMany(); await prisma.b.findMany(); await prisma.c.findMany(); });` },
  { path: "src/util/err.ts", content: `try { f(); } catch (e) {} function g() { throw "no"; }` },
  { path: "src/routes/auth-noratelimit.ts", content: `app.post("/v1/auth/login", async () => ({ ok: 1 }));` },
  { path: "src/secrets/leak.ts", content: `const k = "AKIAIOSFODNN7EXAMPLE"; const s = "sk_live_${"a".repeat(30)}";` },
  { path: "vendor/x/package.json", content: '{"name":"x","license":"AGPL-3.0","dependencies":{}}' },
  { path: "src/jobs/run.ts", content: `setInterval(t, 1000); queue.add("s", { id: 1 });` },
  { path: "src/routes/insecure-webhook.ts", content: `app.post("/v1/webhooks/x", async () => ({ ok: 1 }));` },
  { path: "src/cors.ts", content: `cors({ origin: "*", credentials: true }); res.header("Content-Security-Policy", "script-src 'unsafe-inline'");` },
  ...["a", "b", "c", "d"].map((n) => ({ path: `src/uncov/${n}.ts`, content: `export const ${n} = 1;` })),
  { path: "src/legacy/old.ts", content: `// TODO\n// FIXME\n// HACK\n// XXX\n// TODO\n/** @deprecated since 2022-01-01 */ export const v = 1;` }
];

describe("analyzer pipeline", () => {
  test("buildDefaultAgents returns all 20 agents in spec order", async () => {
    const agents = await buildDefaultAgents();
    expect(agents).toHaveLength(20);
    const ids = agents.map((a) => a.id);
    expect(ids).toContain("A1");
    expect(ids).toContain("A20");
    for (let n = 1; n <= 20; n += 1) {
      expect(ids).toContain(`A${n}`);
    }
  });

  test("runner executes the full pipeline with no failed agents", async () => {
    const agents = await buildDefaultAgents();
    const runner = new AnalyzerRunner(agents);
    const result = await runner.run({
      organizationId: "org_v",
      repositoryId: "repo_v",
      scanId: "scan_v",
      sourceFiles: fixture
    });
    expect(result.agents).toHaveLength(20);
    expect(result.agents.every((a) => a.ok)).toBe(true);
    // Topological order — A1 must come before any dependent.
    const a1Index = result.agents.findIndex((a) => a.agentId === "A1");
    const a20Index = result.agents.findIndex((a) => a.agentId === "A20");
    expect(a1Index).toBe(0);
    expect(a20Index).toBeGreaterThan(a1Index);
  });

  test("each agent's rule fires on a tailored fixture", async () => {
    const agents = await buildDefaultAgents();
    const runner = new AnalyzerRunner(agents);
    const result = await runner.run({
      organizationId: "org_v",
      repositoryId: "repo_v",
      scanId: "scan_v",
      sourceFiles: fixture
    });
    const rules = new Set(result.findings.map((f) => f.ruleId));
    const expected = [
      "api-drift-duplicate-route",
      "api-drift-path-variant",
      "data-sensitivity-government-id",
      "migration-drop-table",
      "perf-unbounded-findmany",
      "perf-query-fanout",
      "error-handling-empty-catch",
      "error-handling-string-throw",
      "abuse-surface-no-rate-limit",
      "secret-aws-access-key",
      "log-pii-leak",
      "cron-runaway-interval",
      "webhook-missing-signature-verify",
      "cors-wildcard-with-credentials",
      "csp-unsafe-directive",
      "coverage-low-test-ratio",
      "doc-todo-density",
      "doc-deprecated-overdue"
    ];
    for (const r of expected) {
      expect(rules, `expected rule ${r} to fire`).toContain(r);
    }
  });

  test("compliance agent projects rules onto frameworks", async () => {
    const agents = await buildDefaultAgents();
    const runner = new AnalyzerRunner(agents);
    const result = await runner.run({
      organizationId: "org_v",
      repositoryId: "repo_v",
      scanId: "scan_v",
      sourceFiles: fixture
    });
    const a19 = result.agents.find((a) => a.agentId === "A19")?.output as
      | { frameworks: Record<string, number> }
      | undefined;
    expect(a19).toBeDefined();
    expect(Object.keys(a19!.frameworks).length).toBeGreaterThan(0);
  });

  test("PR context decision reflects upstream severity", async () => {
    const agents = await buildDefaultAgents();
    const runner = new AnalyzerRunner(agents);
    const result = await runner.run({
      organizationId: "org_v",
      repositoryId: "repo_v",
      scanId: "scan_v",
      sourceFiles: fixture
    });
    const a20 = result.agents.find((a) => a.agentId === "A20")?.output as
      | { decision: "approve" | "warn" | "block"; blocks: unknown[] }
      | undefined;
    expect(a20).toBeDefined();
    expect(["approve", "warn", "block"]).toContain(a20!.decision);
    expect(a20!.blocks.length).toBeGreaterThan(0);
  });
});
