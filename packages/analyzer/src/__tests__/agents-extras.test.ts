import { AnalyzerRunner, buildDefaultAgents, type SourceFileInput } from "../index";

/**
 * Focused tests for agents A2-A6, A8, A11-A19 — each agent receives a
 * tailored fixture that triggers its rule, then we assert the expected
 * ruleId appears in the runner's combined findings.
 */

const agents = await buildDefaultAgents();
const runner = new AnalyzerRunner(agents);

const fixture: SourceFileInput[] = [
  // A2 — duplicate route registrations
  {
    path: "src/routes/duplicates.ts",
    content: `
      app.get("/v1/users", handler1);
      app.get("/v1/users", handler2);
      app.get("/v1/Users", handler3);
    `
  },
  // A3 — PII field, A13 — log of password
  {
    path: "src/models/user-profile.ts",
    content: `
      export interface UserProfile { ssn: string; creditCard: string; }
      logger.info("login", { password: req.body.password });
    `
  },
  // A4 — destructive migration
  {
    path: "prisma/migrations/2026_drop/migration.sql",
    content: `DROP TABLE invoices;\nALTER TABLE users DROP COLUMN ssn;`
  },
  // A5 — unbounded findMany + fan-out
  {
    path: "src/routes/perf.ts",
    content: `
      app.get("/v1/perf", async () => {
        const a = await prisma.user.findMany();
        const b = await prisma.invoice.findMany();
        const c = await prisma.subscription.findMany();
        return { a, b, c };
      });
    `
  },
  // A6 — empty catch + bare-string throw
  {
    path: "src/util/errors.ts",
    content: `
      try { doThing(); } catch (e) {}
      function fail() { throw "nope"; }
    `
  },
  // A8 — abuse surface no rate limit
  {
    path: "src/routes/auth-noratelimit.ts",
    content: `app.post("/v1/auth/login", async (req, reply) => { return { ok: true }; });`
  },
  // A11 — secret leaks
  {
    path: "src/secrets/leak.ts",
    content: `const k = "AKIAABCDEFGHIJKLMNOP"; const s = "sk_live_${"a".repeat(30)}";`
  },
  // A12 — restrictive license
  {
    path: "vendor/copyleft/package.json",
    content: JSON.stringify({ name: "lib", version: "1", license: "AGPL-3.0", dependencies: {} })
  },
  // A14 — runaway interval + bull queue.add no retry
  {
    path: "src/jobs/runaway.ts",
    content: `setInterval(tick, 1000);\nqueue.add("scan", { id: 1 });`
  },
  // A15 — webhook without signature verify
  {
    path: "src/routes/insecure-webhook.ts",
    content: `app.post("/v1/webhooks/insecure", async (req) => { return { ok: true }; });`
  },
  // A16 — wildcard CORS + credentials, plus unsafe CSP
  {
    path: "src/cors-config.ts",
    content: `app.register(cors, { origin: "*", credentials: true });\nres.header("Content-Security-Policy", "script-src 'unsafe-inline'");`
  },
  // A17 — low test density (4 source files, 0 tests in dir)
  ...["a", "b", "c", "d"].map((n) => ({
    path: `src/uncovered/${n}.ts`,
    content: `export const ${n} = ${n};`
  })),
  // A18 — TODO density + overdue @deprecated
  {
    path: "src/legacy/old.ts",
    content: `// TODO fix this\n// FIXME really\n// HACK seriously\n// XXX why\n// TODO last\n/** @deprecated since 2022-01-01 */ export const old = 1;`
  }
];

const result = await runner.run({
  organizationId: "org_test",
  repositoryId: "repo_test",
  scanId: "scan_extras",
  sourceFiles: fixture
});

function ok(name: string, cond: boolean, extra?: unknown) {
  if (!cond) {
    console.error(`fail - ${name}`, extra);
    process.exitCode = 1;
  } else {
    console.log(`ok - ${name}`);
  }
}

const rules = new Set(result.findings.map((f) => f.ruleId));

ok("A2 flagged duplicate route", rules.has("api-drift-duplicate-route"));
ok("A2 flagged path variant", rules.has("api-drift-path-variant"));
ok("A3 flagged government-id PII", rules.has("data-sensitivity-government-id"));
ok("A3 flagged financial-pan PII", rules.has("data-sensitivity-financial-pan"));
ok("A4 flagged drop table", rules.has("migration-drop-table"));
ok("A4 flagged drop column", rules.has("migration-drop-column"));
ok("A5 flagged unbounded findMany", rules.has("perf-unbounded-findmany"));
ok("A5 flagged query fan-out", rules.has("perf-query-fanout"));
ok("A6 flagged empty catch", rules.has("error-handling-empty-catch"));
ok("A6 flagged string throw", rules.has("error-handling-string-throw"));
ok("A8 flagged abuse surface", rules.has("abuse-surface-no-rate-limit"));
ok("A11 flagged AWS key", rules.has("secret-aws-access-key"));
ok("A11 flagged Stripe live key", rules.has("secret-stripe-live"));
ok("A12 flagged AGPL license", [...rules].some((r) => r.startsWith("license-agpl")));
ok("A13 flagged PII log", rules.has("log-pii-leak"));
ok("A14 flagged runaway interval", rules.has("cron-runaway-interval"));
ok("A14 flagged bullmq no retry", rules.has("cron-no-retry-config"));
ok("A15 flagged unverified webhook", rules.has("webhook-missing-signature-verify"));
ok("A16 flagged wildcard cors+creds", rules.has("cors-wildcard-with-credentials"));
ok("A16 flagged unsafe CSP", rules.has("csp-unsafe-directive"));
ok("A17 flagged low test ratio", rules.has("coverage-low-test-ratio"));
ok("A18 flagged TODO density", rules.has("doc-todo-density"));
ok("A18 flagged overdue deprecation", rules.has("doc-deprecated-overdue"));

const a19 = result.agents.find((a) => a.agentId === "A19")?.output as { frameworks: Record<string, number> } | undefined;
ok("A19 produced framework projection", !!a19 && Object.keys(a19.frameworks).length > 0);

console.log(`extras: ${result.findings.length} findings across ${rules.size} rules`);
