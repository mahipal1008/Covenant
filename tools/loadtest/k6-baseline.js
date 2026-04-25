# k6 baseline load test — Session 8 §1.
#
# Goal: 200 RPS sustained for 1 hour against staging. Any p95 > 250ms
# is a regression and must be fixed before launch.
#
# Run:
#   K6_TARGET=https://staging-api.covenant.dev \
#   K6_TOKEN=eyJ... \
#   k6 run tools/loadtest/k6-baseline.js
#
# Stages mirror a realistic production curve: ramp-up, plateau,
# spike, recovery. The plateau is the SLO-bearing window.

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter } from "k6/metrics";

const target = __ENV.K6_TARGET || "http://localhost:4000";
const token = __ENV.K6_TOKEN || "";

const latencyDashboard = new Trend("dashboard_latency", true);
const latencyFindings = new Trend("findings_latency", true);
const latencyScans = new Trend("scans_latency", true);
const latencyHealth = new Trend("health_latency", true);
const errors = new Counter("api_errors");

export const options = {
  scenarios: {
    plateau: {
      executor: "ramping-arrival-rate",
      startRate: 0,
      timeUnit: "1s",
      preAllocatedVUs: 200,
      maxVUs: 600,
      stages: [
        { target: 50, duration: "2m" },    // warm-up
        { target: 200, duration: "5m" },   // ramp to plateau
        { target: 200, duration: "60m" },  // SLO window
        { target: 400, duration: "2m" },   // spike
        { target: 200, duration: "5m" },   // recovery
        { target: 0, duration: "1m" }
      ]
    }
  },
  thresholds: {
    "http_req_duration{kind:slo}": ["p(95)<250", "p(99)<800"],
    "http_req_failed": ["rate<0.005"],
    "checks": ["rate>0.995"]
  }
};

const headers = token
  ? { authorization: `Bearer ${token}`, accept: "application/json" }
  : { accept: "application/json" };

function get(path, latency, tags) {
  const res = http.get(`${target}${path}`, { headers, tags: { kind: "slo", ...tags } });
  latency.add(res.timings.duration);
  if (!check(res, { "status 2xx": (r) => r.status >= 200 && r.status < 300 })) {
    errors.add(1);
  }
}

export default function () {
  // Weighted mix mirrors observed prod traffic (Session 6 RUM panel).
  const r = Math.random();
  if (r < 0.45) {
    get("/v1/dashboard", latencyDashboard, { route: "dashboard" });
  } else if (r < 0.75) {
    get("/v1/findings?limit=50", latencyFindings, { route: "findings" });
  } else if (r < 0.92) {
    get("/v1/scans?limit=20", latencyScans, { route: "scans" });
  } else {
    get("/healthz", latencyHealth, { route: "health" });
  }
  sleep(0.1);
}

export function handleSummary(data) {
  return {
    "stdout": JSON.stringify(data.metrics, null, 2),
    "tools/loadtest/last-run-summary.json": JSON.stringify(data, null, 2)
  };
}
