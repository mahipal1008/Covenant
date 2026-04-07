import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { buildApp } from "./app";

/**
 * github webhook: HMAC verification happy + sad paths.
 */

process.env.GITHUB_WEBHOOK_SECRET = "test-secret-do-not-use-in-prod";

const sample = { ref: "refs/heads/main", repository: { full_name: "acme/widget" } };
const payload = JSON.stringify(sample);

function sign(secret: string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

test("github webhook accepts a correctly signed push", async () => {
  const app = buildApp();
  await app.ready();
  const res = await app.inject({
    method: "POST",
    url: "/v1/webhooks/github",
    headers: {
      "content-type": "application/json",
      "x-github-event": "push",
      "x-github-delivery": "deliv-1",
      "x-hub-signature-256": sign(process.env.GITHUB_WEBHOOK_SECRET!, payload)
    },
    payload
  });
  assert.equal(res.statusCode, 200, res.body);
  const body = res.json();
  assert.equal(body.ok, true);
  assert.equal(body.event, "push");
  await app.close();
});

test("github webhook rejects a bad signature", async () => {
  const app = buildApp();
  await app.ready();
  const res = await app.inject({
    method: "POST",
    url: "/v1/webhooks/github",
    headers: {
      "content-type": "application/json",
      "x-github-event": "push",
      "x-hub-signature-256": "sha256=" + "0".repeat(64)
    },
    payload
  });
  assert.equal(res.statusCode, 401);
  await app.close();
});

console.log("github webhook tests complete");
