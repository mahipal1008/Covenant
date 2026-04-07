import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "./app";
import { __resetGrowth } from "./routes/growth";

test("POST /v1/leads accepts valid payload", async () => {
  __resetGrowth();
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/v1/leads",
    payload: { email: "founder@example.com", source: "home", message: "hi" }
  });
  assert.equal(res.statusCode, 201);
  const body = res.json() as { email: string; source: string };
  assert.equal(body.email, "founder@example.com");
  assert.equal(body.source, "home");
  await app.close();
});

test("POST /v1/leads rejects bad email", async () => {
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/v1/leads",
    payload: { email: "not-an-email", source: "home" }
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /v1/nps stores score and aggregate computes correctly", async () => {
  __resetGrowth();
  const app = buildApp();
  for (const score of [10, 9, 9, 6, 3]) {
    const res = await app.inject({
      method: "POST",
      url: "/v1/nps",
      payload: { score }
    });
    assert.equal(res.statusCode, 201);
  }
  const summary = await app.inject({ method: "GET", url: "/v1/nps/score" });
  const body = summary.json() as { count: number; score: number };
  assert.equal(body.count, 5);
  // 3 promoters (10,9,9), 2 detractors (6,3) => (3-2)/5 * 100 = 20
  assert.equal(body.score, 20);
  await app.close();
});

test("GET /v1/nps/score returns null for empty org", async () => {
  __resetGrowth();
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/v1/nps/score" });
  const body = res.json() as { count: number; score: number | null };
  assert.equal(body.count, 0);
  assert.equal(body.score, null);
  await app.close();
});
