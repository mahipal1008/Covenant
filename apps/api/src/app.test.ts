import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const { buildApp } = await import("./app");
const app = buildApp();

async function test(name: string, run: () => Promise<void>) {
  await run();
  console.log(`ok - ${name}`);
}

await app.ready();

try {
  await test("returns a scoped dashboard", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/dashboard", headers: { "x-organization-id": "org_covenant_demo" } });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().organization.name, "Covenant Demo");
  });

  await test("rejects an unknown organization scope", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/dashboard",
      headers: { "x-organization-id": "org_other" }
    });

    assert.equal(response.statusCode, 404);
  });

  await test("runs a demo tenant leak scan", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/scans",
      headers: { "x-organization-id": "org_covenant_demo" },
      payload: { repositoryId: "repo_sample_saas", sourceMode: "demo" }
    });

    assert.equal(response.statusCode, 201);
    assert.ok(response.json().findings.length > 0);
  });

  await test("returns the agent matrix with at least 20 entries", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/agents",
      headers: { "x-organization-id": "org_covenant_demo" }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.ok(Array.isArray(body.agents));
    assert.equal(body.agents.length, 20);
    assert.ok(body.counts.live >= 7);
  });

  await test("auth audit endpoint reports unprotected routes", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/auth-audit",
      headers: { "x-organization-id": "org_covenant_demo" }
    });
    assert.equal(response.statusCode, 200);
    assert.ok(response.json().coverage.unprotected >= 1);
  });

  await test("blast radius totals reflect demo data", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/blast-radius",
      headers: { "x-organization-id": "org_covenant_demo" }
    });
    assert.equal(response.statusCode, 200);
    assert.ok(response.json().totals.hourly > 0);
  });

  await test("dependency alerts include CVE context", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/dependencies",
      headers: { "x-organization-id": "org_covenant_demo" }
    });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.ok(body.alerts.length >= 1);
    assert.match(body.alerts[0].cveId, /^CVE-/);
  });

  await test("openapi document advertises every v1 surface", async () => {
    const response = await app.inject({ method: "GET", url: "/openapi.json" });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.openapi, "3.1.0");
    assert.ok(body.paths["/v1/dashboard"]);
    assert.ok(body.paths["/v1/scans"].post);
    assert.ok(body.paths["/v1/agents"].get);
    assert.ok(body.paths["/v1/blast-radius"].get);
  });

  await test("phase-4 agent endpoints respond with demo data", async () => {
    const headers = { "x-organization-id": "org_covenant_demo" };
    const paths = [
      "/v1/decision-log",
      "/v1/service-contracts",
      "/v1/capability-trends",
      "/v1/behavioral-regressions",
      "/v1/tech-debt",
      "/v1/onboarding-tour",
      "/v1/pr-context"
    ];
    for (const path of paths) {
      const response = await app.inject({ method: "GET", url: path, headers });
      assert.equal(response.statusCode, 200, `${path} should be 200`);
    }
  });

  await test("agents are all live", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/agents",
      headers: { "x-organization-id": "org_covenant_demo" }
    });
    const body = response.json();
    assert.equal(body.agents.length, 20);
    assert.equal(body.counts.live, 20);
    assert.equal(body.counts.beta, 0);
    assert.equal(body.counts.planned, 0);
  });

  await test("semantic graph returns nodes and edges", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/graph",
      headers: { "x-organization-id": "org_covenant_demo" }
    });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.ok(body.graph.nodes.length > 0);
    assert.ok(body.graph.edges.length > 0);
    assert.ok(body.counts.highRiskNodes >= 1);
  });

  await test("github webhook accepts push events", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/integrations/github/webhook",
      headers: { "x-organization-id": "org_covenant_demo" },
      payload: { event: "push", repository: "covenant-demo/sample-saas", ref: "refs/heads/main" }
    });
    assert.equal(response.statusCode, 202);
    const body = response.json();
    assert.equal(body.status, "accepted");
    assert.ok(body.agentsTriggered.length >= 1);
  });

  await test("slack digest preview generates blocks", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/integrations/slack/digest",
      headers: { "x-organization-id": "org_covenant_demo" },
      payload: { channel: "#covenant-alerts", scope: "weekly" }
    });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.channel, "#covenant-alerts");
    assert.ok(body.blocks.length >= 1);
  });

  await test("merge gate blocks PR with violated contracts", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/pr-checks",
      headers: { "x-organization-id": "org_covenant_demo" },
      payload: { prNumber: 284, title: "Refactor list endpoints", changedFiles: ["src/routes/list.ts"] }
    });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.prNumber, 284);
    assert.equal(body.decision, "block");
    assert.ok(body.failingChecks.length >= 1);
  });
} finally {
  await app.close();
}
