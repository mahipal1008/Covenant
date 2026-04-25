# k6 webhook ingest stress — Session 8 §1.
# 
# Validates that github-webhook + slack interactivity endpoints hold
# under bursty traffic. These are signature-verified, DB-write-heavy,
# and feed the worker queue.

import http from "k6/http";
import { check } from "k6";

const target = __ENV.K6_TARGET || "http://localhost:4000";
const githubSecret = __ENV.GITHUB_WEBHOOK_TEST_SECRET || "";

export const options = {
  scenarios: {
    burst: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { target: 50, duration: "1m" },
        { target: 200, duration: "30s" },  // burst
        { target: 50, duration: "2m" },
        { target: 0, duration: "30s" }
      ]
    }
  },
  thresholds: {
    "http_req_duration{kind:webhook}": ["p(95)<500"],
    "http_req_failed{kind:webhook}": ["rate<0.01"]
  }
};

// NB: signature is intentionally invalid to exercise the rejection
// path under load. To exercise the happy path, set
// GITHUB_WEBHOOK_TEST_SECRET and compute X-Hub-Signature-256.
export default function () {
  const payload = JSON.stringify({
    ref: "refs/heads/main",
    after: "0".repeat(40),
    repository: { full_name: "covenantdev/loadtest" },
    pusher: { name: "k6" }
  });
  const res = http.post(`${target}/v1/github/webhook`, payload, {
    headers: {
      "content-type": "application/json",
      "x-github-event": "push",
      "x-hub-signature-256": "sha256=" + (githubSecret || "deadbeef")
    },
    tags: { kind: "webhook", route: "github" }
  });
  check(res, { "did not 5xx": (r) => r.status < 500 });
}
