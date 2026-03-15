import { AnalyzerRunner, buildDefaultAgents, demoSourceFiles, type SourceFileInput } from "../index";

const agents = await buildDefaultAgents();
const runner = new AnalyzerRunner(agents);

// Augment the demo set with one privileged unprotected route so A9 has signal.
const fixtureFiles: SourceFileInput[] = [
  ...demoSourceFiles,
  {
    path: "src/routes/admin-export.ts",
    content: `
      router.post("/api/admin/billing/export", async (req, res) => {
        const rows = await db.invoice.findMany();
        res.json(rows);
      });
    `
  }
];

const result = await runner.run({
  organizationId: "org_test",
  repositoryId: "repo_test",
  scanId: "scan_test",
  sourceFiles: fixtureFiles
});

function ok(name: string, cond: boolean, extra?: unknown) {
  if (!cond) {
    console.error(`fail - ${name}`, extra);
    process.exitCode = 1;
  } else {
    console.log(`ok - ${name}`);
  }
}

ok("runner produced 20 agent results", result.agents.length === 20);
ok("every agent ok", result.agents.every((a) => a.ok), result.agents.filter((a) => !a.ok));

const ids = result.agents.map((a) => a.agentId);
ok("A1 ran first", ids[0] === "A1", ids);
ok("A20 ran after dependencies", ids.indexOf("A20") > Math.max(ids.indexOf("A1"), ids.indexOf("A7"), ids.indexOf("A9"), ids.indexOf("A10")));

const arch = result.agents.find((a) => a.agentId === "A1")?.output as { endpoints: unknown[]; queries: unknown[] };
ok("A1 returned endpoints", Array.isArray(arch?.endpoints) && arch.endpoints.length > 0);

ok("A7 raised >=1 tenant finding", result.findings.some((f) => f.ruleId === "tenant-filter-required" || f.ruleId === "tenant-leak-endpoint-pattern"));
ok("A9 raised >=1 auth finding", result.findings.some((f) => f.ruleId === "auth-missing-middleware"));
ok("A10 raised >=1 dependency finding (fixture or osv)", result.findings.some((f) => f.ruleId === "dependency-cve"));

const a20 = result.agents.find((a) => a.agentId === "A20")?.output as { decision: string; blocks: unknown[] };
ok("A20 produced a decision", typeof a20?.decision === "string");
ok("A20 produced blocks", Array.isArray(a20?.blocks) && a20.blocks.length >= 1);

console.log(`runner finished in ${result.durationMs}ms with ${result.findings.length} findings`);
